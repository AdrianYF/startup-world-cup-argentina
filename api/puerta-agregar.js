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
import { dia as buscarDia, rejectSinSesion } from './_lib/puerta.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CAMPOS = 'id, origen, nombre, email, telefono, empresa, entrada, dias'

/** Todos los altas de puerta viven bajo el mismo "evento". */
const EVENTO = 'puerta'

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return
  if (rejectSinSesion(req, res)) return

  const body = readBody(req)
  const id = String(body.id || '')
  const nombre = String(body.nombre || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const empresa = String(body.empresa || '').trim()

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
      evento: EVENTO,
      nombre,
      // Vacío queda NULL, no cadena vacía: el índice único trata a los NULL como
      // distintos, así que varios altas sin mail conviven.
      email: email || null,
      estado: 'alta en puerta',
      estado_norm: 'confirmado',
      dias: `${d.label} ${Number(d.fecha.slice(-2))}`,
      ticket: 'Alta en puerta',
      registrado_en: new Date().toISOString(),
      extra: empresa ? { company: empresa } : {},
    }

    // `ignoreDuplicates` = el reintento de la cola offline no crea dos personas.
    const { error } = await db()
      .from('asistentes_externos')
      .upsert(fila, { onConflict: 'id', ignoreDuplicates: true })

    if (error) throw error

    // Se devuelve como la ve la lista, para que la pantalla la agregue sin
    // tener que recargar todo.
    const { data: persona, error: errLeer } = await db()
      .from('acreditacion')
      .select(CAMPOS)
      .eq('id', id)
      .maybeSingle()

    if (errLeer) throw errLeer
    if (!persona) return json(res, 500, { error: 'alta_no_visible' })

    json(res, 201, { persona })
  } catch (err) {
    console.error('[puerta-agregar]', err)
    json(res, 500, { error: 'alta_fallo' })
  }
}
