// GET /api/entrada?t=<token> — los datos de una entrada, para /entrada/:token.
//
// El token ES la credencial: quien lo tiene, tiene la entrada. Por eso se
// genera con 32 bytes aleatorios y por eso acá se devuelve sólo lo que hace
// falta para mostrar el ticket, sin los datos de contacto del comprador.
//
// Una entrada es una PERSONA, no una compra: el nombre que sale es el del
// asistente, y quien compró tres tiene tres tokens distintos.
import { db } from './_lib/db.js'
import { json, rejectMethod, first } from './_lib/http.js'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  const token = String(first(req.query?.t) || '')
  if (!TOKEN_RE.test(token)) return json(res, 400, { error: 'token_invalido' })

  try {
    const { data, error } = await db()
      .from('entradas')
      .select('id, numero, nombre, usada_en, orders(id, tier_id, quantity, status, created_at, tiers(nombre))')
      .eq('token', token)
      .maybeSingle()

    if (error) throw error
    // Una entrada de una orden que no se pagó no existe para el mundo.
    if (!data || data.orders?.status !== 'paid') {
      return json(res, 404, { error: 'entrada_inexistente' })
    }

    const orden = data.orders

    // El último ingreso, no el primero: la entrada vale dos días y lo que le
    // sirve saber a quien la mira es cuándo la usó la última vez.
    //
    // `entradas.usada_en` queda de respaldo para las marcadas a mano con un
    // update antes de que existiera la tabla de check-ins.
    const { data: ultimo } = await db()
      .from('checkins')
      .select('creado_en')
      .eq('entrada_id', data.id)
      .is('anulado_en', null)
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle()

    json(res, 200, {
      orden: orden.id,
      tier: orden.tier_id,
      tierNombre: orden.tiers?.nombre || orden.tier_id,
      nombre: data.nombre,
      // Para poder decir "Entrada 2 de 3" cuando la compra fue de varias.
      numero: data.numero,
      deTotal: orden.quantity,
      usadaEn: ultimo?.creado_en || data.usada_en,
      compradaEn: orden.created_at,
    })
  } catch (err) {
    console.error('[entrada]', err)
    json(res, 500, { error: 'entrada_fallo' })
  }
}
