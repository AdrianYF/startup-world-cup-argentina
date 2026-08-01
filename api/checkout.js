// POST /api/checkout — arranca una compra.
//
// Crea la orden en estado `pending` y devuelve el `preferenceId` con el que el
// front renderiza el Wallet Brick.
//
// El cliente manda SÓLO { tier, quantity, buyer }. El precio nunca viaja en el
// request: sale de la tabla `tiers`. Si lo tomáramos del body, cualquiera
// compraría un VIP a $1 editando el fetch desde el devtools.
//
// Esta función NO acredita nada. La orden queda pendiente hasta que
// /api/mp-webhook confirme el pago contra Mercado Pago.
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { db, stockDisponible } from './_lib/db.js'
import { json, rejectMethod, readBody, siteUrl, esMailValido } from './_lib/http.js'

/** Minutos que una orden pendiente mantiene reservado su cupo. */
const RESERVA_MINUTOS = 30

/** Tope por compra, alineado con el CHECK de la tabla. */
const MAX_UNIDADES = 5

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    console.error('[checkout] falta MP_ACCESS_TOKEN')
    return json(res, 503, { error: 'checkout_no_configurado' })
  }

  const body = readBody(req)
  const tierId = String(body.tier || '').trim()
  // `??` y no `||`: con `||`, un `quantity: 0` explícito caía al default de 1 y
  // se colaba como compra válida en vez de rechazarse.
  const quantity = Number(body.quantity ?? 1)
  const buyer = body.buyer || {}
  const nombre = String(buyer.nombre || '').trim()
  const email = String(buyer.email || '').trim().toLowerCase()
  const dni = String(buyer.dni || '').trim()

  if (!tierId) return json(res, 400, { error: 'tier_requerido' })
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_UNIDADES) {
    return json(res, 400, { error: 'cantidad_invalida' })
  }
  if (nombre.length < 2) return json(res, 400, { error: 'nombre_requerido' })
  if (!esMailValido(email)) return json(res, 400, { error: 'email_invalido' })

  try {
    const { data: tier, error: tierErr } = await db()
      .from('tiers')
      .select('id, nombre, price_ars, activo')
      .eq('id', tierId)
      .single()

    if (tierErr || !tier || !tier.activo) {
      return json(res, 404, { error: 'tier_no_disponible' })
    }

    // Chequeo de stock ANTES de crear la orden. No es una garantía absoluta
    // contra dos requests simultáneos, pero la ventana es de milisegundos y la
    // orden pendiente que se crea abajo reserva el cupo por 30 minutos, así que
    // el segundo comprador rebota acá.
    const libre = await stockDisponible(tierId)
    if (libre < quantity) {
      return json(res, 409, { error: 'sin_stock', disponible: Math.max(0, libre) })
    }

    const expiresAt = new Date(Date.now() + RESERVA_MINUTOS * 60_000)

    const { data: orden, error: ordenErr } = await db()
      .from('orders')
      .insert({
        tier_id: tier.id,
        quantity,
        unit_price_ars: tier.price_ars, // precio congelado: la fuente es la base
        buyer_name: nombre,
        buyer_email: email,
        buyer_dni: dni || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (ordenErr) throw ordenErr

    const base = siteUrl(req)
    const mp = new MercadoPagoConfig({ accessToken })

    const preference = await new Preference(mp).create({
      body: {
        items: [
          {
            id: tier.id,
            title: `Startup World Cup Argentina 2026 — ${tier.nombre}`,
            quantity,
            unit_price: tier.price_ars,
            currency_id: 'ARS',
          },
        ],
        payer: { name: nombre, email },
        // Es el hilo que une el pago de MP con nuestra orden: el webhook lo lee
        // para saber qué acreditar.
        external_reference: orden.id,
        back_urls: {
          success: `${base}/gracias?orden=${orden.id}`,
          pending: `${base}/gracias?orden=${orden.id}`,
          failure: `${base}/gracias?orden=${orden.id}`,
        },
        auto_return: 'approved',
        notification_url: `${base}/api/mp-webhook`,
        statement_descriptor: 'SWC ARGENTINA',
        // Coherente con la reserva: si no pagó en 30 minutos, el cupo se libera
        // y la preferencia tampoco debería seguir viva.
        expires: true,
        expiration_date_to: expiresAt.toISOString(),
      },
    })

    await db()
      .from('orders')
      .update({ mp_preference_id: preference.id })
      .eq('id', orden.id)

    return json(res, 201, { orderId: orden.id, preferenceId: preference.id })
  } catch (err) {
    console.error('[checkout]', err)
    return json(res, 500, { error: 'checkout_fallo' })
  }
}
