// GET /api/entrada?t=<token> — los datos de una entrada, para /entrada/:token.
//
// El token ES la credencial: quien lo tiene, tiene la entrada. Por eso se
// genera con 32 bytes aleatorios y por eso acá se devuelve sólo lo que hace
// falta para mostrar el ticket, sin los datos de contacto del comprador.
import { db } from './_lib/db.js'
import { json, rejectMethod, first } from './_lib/http.js'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  const token = String(first(req.query?.t) || '')
  if (!TOKEN_RE.test(token)) return json(res, 400, { error: 'token_invalido' })

  try {
    const { data, error } = await db()
      .from('orders')
      .select('id, tier_id, quantity, buyer_name, status, ticket_used_at, created_at, tiers(nombre)')
      .eq('ticket_token', token)
      .eq('status', 'paid')
      .maybeSingle()

    if (error) throw error
    if (!data) return json(res, 404, { error: 'entrada_inexistente' })

    json(res, 200, {
      orden: data.id,
      tier: data.tier_id,
      tierNombre: data.tiers?.nombre || data.tier_id,
      cantidad: data.quantity,
      nombre: data.buyer_name,
      usadaEn: data.ticket_used_at,
      compradaEn: data.created_at,
    })
  } catch (err) {
    console.error('[entrada]', err)
    json(res, 500, { error: 'entrada_fallo' })
  }
}
