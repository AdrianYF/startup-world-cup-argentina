// GET /api/orden?id=<uuid> — estado de una compra.
//
// Lo consulta la pantalla de éxito al volver de Mercado Pago.
//
// Si la orden sigue `pending`, le PREGUNTA A MERCADO PAGO por ella y la acredita
// en el acto si el pago está aprobado. Eso hace que el flujo no dependa del
// webhook: en local MP no alcanza localhost y la notificación no llega nunca, y
// en producción puede demorar o fallar. Sin esto, alguien que pagó se queda
// mirando "confirmando tu pago" para siempre.
//
// Sigue siendo seguro: el estado se lo pedimos a MP con nuestro access token. El
// cliente sólo aporta el id de la orden — nunca dice si pagó.
//
// No devuelve el mail, el DNI ni el payment_id: el id de la orden viaja en la
// URL y podría quedar en un historial compartido. El `ticket_token` sí, porque
// sin él la pantalla de éxito no serviría de nada.
import { db } from './_lib/db.js'
import { json, rejectMethod, first, siteUrl } from './_lib/http.js'
import { buscarPagoDeOrden, acreditar } from './_lib/acreditar.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `ana@ejemplo.com` → `an•••@ejemplo.com`. */
function enmascarar(mail) {
  const [usuario, dominio] = String(mail || '').split('@')
  if (!dominio) return ''
  const visible = usuario.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(1, usuario.length - 2))}@${dominio}`
}

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  const id = String(first(req.query?.id) || '')
  if (!UUID_RE.test(id)) return json(res, 400, { error: 'id_invalido' })

  try {
    const { data, error } = await db().from('orders').select('*').eq('id', id).single()
    if (error || !data) return json(res, 404, { error: 'orden_inexistente' })

    let orden = data

    if (orden.status === 'pending' && process.env.MP_ACCESS_TOKEN) {
      try {
        const pago = await buscarPagoDeOrden(orden.id)
        if (pago) {
          const r = await acreditar({ orden, pago, baseUrl: siteUrl(req) })
          orden = r.orden
        }
      } catch (err) {
        // Que falle la consulta a MP no puede romper la pantalla: se devuelve el
        // estado que tenemos y el front sigue poleteando.
        console.error('[orden] no se pudo reconciliar contra MP:', err?.message || err)
      }
    }

    const subtotal = orden.unit_price_ars * orden.quantity
    const cargo = Number(orden.service_fee_ars || 0)

    json(res, 200, {
      id: orden.id,
      tier: orden.tier_id,
      cantidad: orden.quantity,
      subtotal,
      cargo,
      total: Math.round((subtotal + cargo) * 100) / 100,
      status: orden.status,
      detalle: orden.status === 'rejected' ? orden.mp_status_detail : null,
      nombre: orden.buyer_name,
      // Enmascarado: sirve para confirmar a dónde fue el mail sin exponer la
      // casilla, porque el id de la orden viaja en la URL.
      email: enmascarar(orden.buyer_email),
      ticketToken: orden.status === 'paid' ? orden.ticket_token : null,
    })
  } catch (err) {
    console.error('[orden]', err)
    json(res, 500, { error: 'orden_fallo' })
  }
}
