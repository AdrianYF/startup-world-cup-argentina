// GET /api/tiers — precio y disponibilidad reales de los tiers vendibles.
//
// Lo consume el modal de compra. src/content/tickets.json pinta las cards
// (incluidas las tandas agotadas, que son historia), pero el precio que se
// cobra sale siempre de la base: es la única fuente de verdad.
import { tiersActivos } from './_lib/db.js'
import { ventaPropiaAbierta } from './_lib/entorno.js'
import { json, rejectMethod } from './_lib/http.js'

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  try {
    // `ventaPropia` viaja aparte y no se deduce de que la lista venga vacía:
    // vacía puede significar «la venta está cerrada» o «la API no contestó», y
    // el front necesita distinguirlas para saber si el botón manda a Mercado
    // Pago o a Startup Grind.
    const ventaPropia = ventaPropiaAbierta()
    json(res, 200, { ventaPropia, tiers: ventaPropia ? await tiersActivos() : [] })
  } catch (err) {
    console.error('[tiers]', err)
    // El front cae a los precios de tickets.json y deja las cards mostrando
    // "Conseguir Ticket": preferimos eso a una sección rota.
    json(res, 503, { error: 'tiers_unavailable' })
  }
}
