// POST /api/puerta-checkin — anotar un ingreso, o deshacerlo.
//
//   { checkin, dia, origen, ref, por }   desde el buscador
//   { checkin, dia, token, por }         desde el escáner
//   { …, forzar: true }                  acreditar en un día que la entrada no habilita
//   { anular }                           deshacer
//
// `checkin` es el uuid de la fila, y lo genera el CLIENTE. Es lo que hace que la
// cola offline pueda reintentar sin miedo: el mismo ingreso mandado tres veces
// se inserta una sola.
import { db } from './_lib/db.js'
import { json, rejectMethod, readBody } from './_lib/http.js'
import { dia as buscarDia, habilitaDia, rejectSinSesion } from './_lib/puerta.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/
const CAMPOS = 'id, origen, nombre, email, telefono, empresa, entrada, dias'

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return
  if (rejectSinSesion(req, res)) return

  const body = readBody(req)

  try {
    if (body.anular) return await anular(res, body.anular)
    return await anotar(res, body)
  } catch (err) {
    console.error('[puerta-checkin]', err)
    json(res, 500, { error: 'checkin_fallo' })
  }
}

/* -------------------------------------------------------------------------- */

async function anotar(res, body) {
  const { checkin, dia: diaId, origen, ref, token, por, forzar } = body

  if (!UUID_RE.test(String(checkin || ''))) {
    return json(res, 400, { error: 'checkin_invalido' })
  }

  const d = buscarDia(diaId)
  if (!d) return json(res, 400, { error: 'dia_invalido' })

  // Resolver a quién se acredita: por token (escáner) o por origen + id (lista).
  let fila
  if (token) {
    if (!TOKEN_RE.test(String(token))) return json(res, 400, { error: 'token_invalido' })
    const { data, error } = await db()
      .from('entradas')
      .select('id, orders(status)')
      .eq('token', token)
      .maybeSingle()
    if (error) throw error
    if (!data || data.orders?.status !== 'paid') {
      return json(res, 404, { error: 'entrada_inexistente' })
    }
    fila = await traerPersona('web', data.id)
  } else {
    if (!UUID_RE.test(String(ref || ''))) return json(res, 400, { error: 'ref_invalido' })
    fila = await traerPersona(origen, ref)
  }

  if (!fila) return json(res, 404, { error: 'persona_inexistente' })

  // Que la entrada habilite ESTE día.
  //
  // La lista ya viene filtrada por día, así que por el buscador no debería
  // pasar. Por el escáner sí: hasta acá alcanzaba con que el token existiera y
  // la orden estuviera paga, y una entrada de "Jue 6 + Vie 7" leída el miércoles
  // se acreditaba igual.
  //
  // No es un rechazo: se devuelve a la persona para que la pantalla muestre
  // quién es y ofrezca acreditar igual. En la puerta hay casos legítimos —una
  // cortesía, un cambio de día— y quien decide es el staff, no la validación.
  if (!forzar && !habilitaDia(fila.dias, d.label)) {
    return json(res, 409, { error: 'dia_no_habilitado', persona: fila, dia: d })
  }

  const esWeb = fila.origen === 'web'
  const nuevo = {
    id: checkin,
    origen: fila.origen,
    entrada_id: esWeb ? fila.id : null,
    externo_id: esWeb ? null : fila.id,
    dia: d.fecha,
    por: typeof por === 'string' && por.trim() ? por.trim().slice(0, 40) : null,
  }

  // `ignoreDuplicates` = el reintento de la cola offline no duplica el ingreso.
  const { data: insertado, error } = await db()
    .from('checkins')
    .upsert(nuevo, { onConflict: 'id', ignoreDuplicates: true })
    .select('id, por, anulado_en, creado_en')
    .maybeSingle()
  if (error) throw error

  // Sin filas = ese ingreso ya estaba, o sea que esto es el reintento de la cola.
  //
  // Se relee el que quedó guardado en vez de armar uno con `new Date()`: la hora
  // del ingreso original es justamente el dato que la cola existe para no perder,
  // y contestar `anuladoEn: null` sobre un ingreso que mientras tanto se anuló lo
  // resucitaba en la pantalla de la puerta.
  const guardado = insertado || await leerCheckin(checkin)
  if (!guardado) throw new Error(`el checkin ${checkin} no quedó guardado`)

  // Sólo si el ingreso está vigente: reponer `usada_en` sobre uno anulado sería
  // volver a marcar como usada una entrada que alguien deshizo a propósito.
  if (!guardado.anulado_en) await marcarPrimerIngreso(fila)

  json(res, insertado ? 201 : 200, {
    checkin: {
      id: guardado.id,
      ref: fila.id,
      origen: fila.origen,
      por: guardado.por,
      anuladoEn: guardado.anulado_en,
      creadoEn: guardado.creado_en,
    },
    persona: fila,
  })
}

/** El ingreso ya guardado, para no inventar sus datos en el reintento. */
async function leerCheckin(id) {
  const { data, error } = await db()
    .from('checkins')
    .select('id, por, anulado_en, creado_en')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data || null
}

async function anular(res, id) {
  if (!UUID_RE.test(String(id))) return json(res, 400, { error: 'anular_invalido' })

  const { data, error } = await db()
    .from('checkins')
    .update({ anulado_en: new Date().toISOString() })
    .eq('id', id)
    .is('anulado_en', null)
    .select('id, origen, entrada_id, externo_id, anulado_en')
    .maybeSingle()
  if (error) throw error

  // Ya estaba anulado: no es un error, es el reintento de la cola.
  if (!data) return json(res, 200, { ok: true, yaEstaba: true })

  await limpiarSiNoQuedaNinguno(data)
  json(res, 200, { ok: true, checkin: { id: data.id, anuladoEn: data.anulado_en } })
}

/* -------------------------------------------------------------------------- */

/** La fila de `acreditacion`, que es la lista real de la puerta. */
async function traerPersona(origen, id) {
  const q = db().from('acreditacion').select(CAMPOS).eq('id', id)
  const { data, error } = await (origen ? q.eq('origen', origen) : q).maybeSingle()
  if (error) throw error
  return data || null
}

/**
 * `entradas.usada_en` y `asistentes_externos.checkin_en` siguen existiendo: los
 * leen `/entrada/:token` y `scripts/lista-puerta.mjs`. Se escriben en el primer
 * ingreso y nada más — el `.is(null)` se encarga.
 */
async function marcarPrimerIngreso(fila) {
  const ahora = new Date().toISOString()
  const { error } = fila.origen === 'web'
    ? await db().from('entradas')
        .update({ usada_en: ahora }).eq('id', fila.id).is('usada_en', null)
    : await db().from('asistentes_externos')
        .update({ checkin_en: ahora }).eq('id', fila.id).is('checkin_en', null)
  if (error) throw error
}

/**
 * Al deshacer el ÚNICO ingreso de alguien hay que borrar también la marca, o su
 * entrada le sigue diciendo "ya acreditada" a alguien que nunca entró.
 */
async function limpiarSiNoQuedaNinguno(checkin) {
  const ref = checkin.entrada_id || checkin.externo_id
  const columna = checkin.entrada_id ? 'entrada_id' : 'externo_id'

  const { count, error } = await db()
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq(columna, ref)
    .is('anulado_en', null)
  if (error) throw error
  if (count) return

  const { error: errLimpiar } = checkin.entrada_id
    ? await db().from('entradas').update({ usada_en: null }).eq('id', ref)
    : await db().from('asistentes_externos').update({ checkin_en: null }).eq('id', ref)
  if (errLimpiar) throw errLimpiar
}
