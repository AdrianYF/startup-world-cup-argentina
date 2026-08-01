// GET /api/orden?id=<uuid> — estado de una compra.
//
// Lo poletea /gracias mientras espera que llegue el webhook: al volver de
// Mercado Pago la notificación puede tardar unos segundos.
//
// Devuelve lo mínimo para armar la pantalla. NO devuelve el mail, el DNI ni el
// payment_id: el id de la orden viaja en la URL y podría quedar en un historial
// compartido, así que no cuelga datos personales de él.
//
// El `ticket_token` sí va — es lo que necesita el comprador para ver su entrada,
// y sin él la pantalla de éxito no serviría de nada.
import { db } from './_lib/db.js'
import { json, rejectMethod, first } from './_lib/http.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  const id = String(first(req.query?.id) || '')
  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })

  try {
    const { data, error } = await db()
      .from('orders')
      .select('id, tier_id, quantity, unit_price_ars, service_fee_ars, status, ticket_token, buyer_name')
      .eq('id', id)
      .single()

    if (error || !data) return json(res, 404, { error: 'orden_inexistente' })

    const subtotal = data.unit_price_ars * data.quantity
    const cargo = Number(data.service_fee_ars || 0)

    json(res, 200, {
      id: data.id,
      tier: data.tier_id,
      cantidad: data.quantity,
      subtotal,
      cargo,
      total: Math.round((subtotal + cargo) * 100) / 100,
      status: data.status,
      nombre: data.buyer_name,
      ticketToken: data.status === 'paid' ? data.ticket_token : null,
    })
  } catch (err) {
    console.error('[orden]', err)
    json(res, 500, { error: 'orden_fallo' })
  }
}
