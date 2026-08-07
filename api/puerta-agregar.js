// POST /api/puerta-agregar — dar de alta a alguien que no está en la lista.
//
//   { id, dia, nombre, email?, empresa? }
//
// El caso es el de siempre en una puerta: llega alguien que no figura en ningún
// canal —una invitación que nadie cargó, prensa, un speaker— y hay que dejarlo
// entrar. Entra como un canal más, con `origen = 'puerta'`, así que la lista, el
// CSV y los conteos lo levantan sin saber que es especial.
//
// El `id` lo genera el CLIENTE, igual que en puerta-checkin: es lo que permite
// encolar el alta cuando no hay señal y reintentarla sin duplicar.
import { db } from './_lib/db.js'
import { json, rejectMethod, readBody, esMailValido } from './_lib/http.js'
import { DIAS, dia as buscarDia, rejectSinSesion } from './_lib/puerta.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CAMPOS = 'id, origen, nombre, email, telefono, empresa, entrada, dias'

/**
 * El "evento" de un alta lleva la fecha, y eso no es cosmético.
 *
 * `asistentes_externos` tiene un índice único `(origen, evento, email)` (ver la
 * migración 0004). Hasta acá todos los altas entraban con `evento = 'puerta'`
 * fijo, así que la regla que dice el comentario de más abajo —«si vuelve mañana,
 * se lo agrega de nuevo»— chocaba contra ese índice: al día siguiente es el mismo
 * (origen, evento, email) y el insert reventaba.
 *
 * Con la fecha adentro, un alta es para HOY y mañana es otra fila, que es
 * exactamente lo que `dias` ya venía diciendo.
 */
const eventoDe = d => `puerta-${d.fecha}`

/**
 * Un alta habilita TODO el evento, no sólo el día en que se hizo.
 *
 * Antes guardaba el día suelto —"Jue 6"— con la idea de que quien entra por la
 * puerta se habilita para hoy y si vuelve mañana se lo agrega de nuevo. En la
 * práctica eso significa que la persona vuelve al día siguiente, no aparece, y
 * hay que darla de alta otra vez con alguien esperando adelante. La entrada del
 * evento vale los dos días para todos los demás canales; no hay razón para que
 * la de puerta valga menos.
 *
 * Se arma desde `DIAS` y no a mano para que corregir una fecha siga siendo
 * tocar un solo archivo. Da "Jue 6 + Vie 7", que es el mismo texto que usan el
 * importador y la vista.
 */
const DIAS_EVENTO = DIAS.map(d => `${d.label} ${Number(d.fecha.slice(-2))}`).join(' + ')

/**
 * Por qué se dio de alta. Termina en `acreditacion.entrada`, así que se ve en la
 * lista, en la ficha y en el CSV sin tocar el esquema.
 *
 * "Compró, no figura" es el que importa: no se cobra nada en el check-in —la
 * compra se hace afuera— pero hay que poder marcar a quien dice haber comprado
 * y no aparece, para buscar su orden después.
 */
const MOTIVOS = {
  invitacion: 'Invitación',
  prensa: 'Prensa',
  speaker: 'Speaker',
  staff: 'Staff',
  comprada: 'Compró, no figura',
}
const MOTIVO_DEFAULT = 'Alta en check-in'

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return
  if (rejectSinSesion(req, res)) return

  const body = readBody(req)
  const id = String(body.id || '')
  const nombre = String(body.nombre || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const telefono = String(body.telefono || '').trim()
  const empresa = String(body.empresa || '').trim()
  const motivo = MOTIVOS[String(body.motivo || '')] || MOTIVO_DEFAULT

  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })
  if (nombre.length < 2) return json(res, 400, { error: 'nombre_requerido' })
  // El mail es opcional, pero si lo escribieron tiene que ser uno.
  if (email && !esMailValido(email)) return json(res, 400, { error: 'email_invalido' })

  const d = buscarDia(body.dia)
  if (!d) return json(res, 400, { error: 'dia_invalido' })

  try {
    // `dias` guarda el día concreto para el que se dio el alta ("Jue 6"), no los
    // dos días: a quien entra por la puerta se lo habilita para hoy, no para el
    // resto del evento. Si vuelve mañana, se lo agrega de nuevo.
    const fila = {
      id,
      origen: 'puerta',
      evento: eventoDe(d),
      nombre,
      // Vacío queda NULL, no cadena vacía: el índice único trata a los NULL como
      // distintos, así que varios altas sin mail conviven.
      email: email || null,
      estado: 'alta en check-in',
      estado_norm: 'confirmado',
      dias: DIAS_EVENTO,
      ticket: motivo,
      registrado_en: new Date().toISOString(),
      // Las claves son las que ya lee la vista `acreditacion` para los CSV de
      // Luma y Startup Grind: así el alta de puerta se muestra igual que el resto.
      extra: {
        ...(empresa ? { company: empresa } : {}),
        ...(telefono ? { phone: telefono } : {}),
      },
    }

    // `ignoreDuplicates` = el reintento de la cola offline no crea dos personas.
    const { error } = await db()
      .from('asistentes_externos')
      .upsert(fila, { onConflict: 'id', ignoreDuplicates: true })

    // 23505 = ya había un alta de hoy con ese mail, con OTRO id. En la puerta eso
    // no es un error: quiere decir «esta persona ya está en la lista», y lo que
    // sigue es acreditarla. Abajo se relee la que está y se devuelve esa.
    //
    // Contestar 5xx acá era peor que inútil. La cola offline da los 5xx por
    // reintentables y `vaciarCola()` corta en el primero (ver
    // backoffice/src/lib/acreditar.ts), así que este alta se quedaba en la cabeza
    // de la cola trabando TODOS los ingresos encolados detrás: una persona
    // repetida y la puerta entera dejaba de sincronizar. Una constraint que va a
    // fallar siempre igual nunca puede devolver un error que invita a reintentar.
    if (error && error.code !== '23505') throw error

    // Se devuelve como la ve la lista, para que la pantalla la agregue sin
    // tener que recargar todo.
    let persona = await leerDeAcreditacion(id)

    if (!persona && fila.email) {
      // No está por su id: el alta chocó con una anterior, que tiene otro id. Se
      // la busca por donde chocó —(origen, evento, email), que es el índice
      // único— y de paso se la reconfirma: si alguien le había dado de baja, que
      // el staff la esté dando de alta en la puerta es la decisión más nueva.
      const { data: previa, error: errPrevia } = await db()
        .from('asistentes_externos')
        .update({ nombre: fila.nombre, dias: fila.dias, estado_norm: 'confirmado' })
        .eq('origen', 'puerta')
        .eq('evento', fila.evento)
        .eq('email', fila.email)
        .select('id')
        .maybeSingle()
      if (errPrevia) throw errPrevia
      if (previa) persona = await leerDeAcreditacion(previa.id)
    }

    if (!persona) return json(res, 500, { error: 'alta_no_visible' })

    json(res, 201, { persona })
  } catch (err) {
    console.error('[puerta-agregar]', err)
    json(res, 500, { error: 'alta_fallo' })
  }
}

/** La fila como la ve la lista de la puerta, o null si todavía no está ahí. */
async function leerDeAcreditacion(id) {
  const { data, error } = await db()
    .from('acreditacion')
    .select(CAMPOS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data || null
}
