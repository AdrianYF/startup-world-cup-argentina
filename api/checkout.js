// POST /api/checkout — arranca una compra.
//
// Crea la orden en estado `pending` y devuelve el `preferenceId` con el que el
// front renderiza el Wallet Brick.
//
// El cliente manda SÓLO { tier, quantity, buyer, asistentes }. El precio nunca
// viaja en el request: sale de la tabla `tiers`. Si lo tomáramos del body,
// cualquiera compraría un VIP a $1 editando el fetch desde el devtools.
//
// `asistentes` son los nombres, uno por entrada. Se guardan ya en `entradas`,
// todavía sin token: la credencial se emite recién cuando el pago se aprueba.
//
// Esta función NO acredita nada. La orden queda pendiente hasta que
// /api/mp-webhook confirme el pago contra Mercado Pago.
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { db, stockDisponible } from './_lib/db.js'
import { desglose } from './_lib/precios.js'
import { json, rejectMethod, readBody, siteUrl, esMailValido } from './_lib/http.js'
import { credencialesMP } from './_lib/entorno.js'

/** Minutos que una orden pendiente mantiene reservado su cupo. */
const RESERVA_MINUTOS = 30

/** Tope por compra, alineado con el CHECK de la tabla. */
const MAX_UNIDADES = 5

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return

  // Las credenciales del entorno. En desarrollo son las de prueba, y si son de
  // producción esto tira antes de crear nada — ver `_lib/entorno.js`.
  let credenciales
  try {
    credenciales = await credencialesMP()
  } catch (err) {
    console.error('[checkout]', err.message)
    return json(res, 503, { error: 'checkout_no_configurado' })
  }
  const { accessToken } = credenciales

  const body = readBody(req)
  const tierId = String(body.tier || '').trim()
  // `??` y no `||`: con `||`, un `quantity: 0` explícito caía al default de 1 y
  // se colaba como compra válida en vez de rechazarse.
  const quantity = Number(body.quantity ?? 1)
  const buyer = body.buyer || {}
  const nombre = String(buyer.nombre || '').trim()
  const email = String(buyer.email || '').trim().toLowerCase()
  const telefono = String(buyer.telefono || '').trim()
  const empresa = String(buyer.empresa || '').trim()

  if (!tierId) return json(res, 400, { error: 'tier_requerido' })
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_UNIDADES) {
    return json(res, 400, { error: 'cantidad_invalida' })
  }
  if (nombre.length < 2) return json(res, 400, { error: 'nombre_requerido' })
  if (!esMailValido(email)) return json(res, 400, { error: 'email_invalido' })

  // Un nombre por entrada. El primero es el del comprador: si no vino (una
  // compra de una sola entrada desde una versión vieja del modal), se completa
  // con `nombre` en vez de rechazar la compra.
  const asistentes = Array.isArray(body.asistentes) ? body.asistentes : []
  const nombres = Array.from({ length: quantity }, (_, i) =>
    String(asistentes[i] ?? (i === 0 ? nombre : '')).trim(),
  )
  if (nombres.some(n => n.length < 2)) {
    return json(res, 400, { error: 'asistente_requerido' })
  }

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
    // Precio y cargo se congelan en la orden: si mañana cambian, esta compra
    // tiene que seguir mostrando lo que la persona efectivamente pagó.
    const montos = desglose(tier.price_ars, quantity)

    const { data: orden, error: ordenErr } = await db()
      .from('orders')
      .insert({
        tier_id: tier.id,
        quantity,
        unit_price_ars: tier.price_ars, // la fuente del precio es la base, nunca el request
        service_fee_ars: montos.cargo,
        buyer_name: nombre,
        buyer_email: email,
        buyer_telefono: telefono || null,
        buyer_empresa: empresa || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (ordenErr) throw ordenErr

    // Una fila por asistente, todavía sin token: la credencial se emite cuando
    // el pago se aprueba (ver api/_lib/acreditar.js). Guardar los nombres acá y
    // no al acreditar es lo que permite que el mail y la puerta sepan quién es
    // cada uno sin volver a preguntar.
    const { error: entradasErr } = await db()
      .from('entradas')
      .insert(nombres.map((n, i) => ({ order_id: orden.id, numero: i + 1, nombre: n })))

    if (entradasErr) throw entradasErr

    const base = siteUrl(req)
    const mp = new MercadoPagoConfig({ accessToken })

    // `auto_return` hace que MP vuelva solo al aprobar, pero exige que
    // back_urls.success sea una URL pública: con localhost la creación de la
    // preferencia falla entera con `invalid_auto_return`. En local se omite —
    // se pierde el redirect automático, no el pago.
    const publica = !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(base)

    const preference = await new Preference(mp).create({
      body: {
        // Dos ítems para que el comprador vea el desglose también dentro de
        // Mercado Pago, y no un total redondo que no puede explicarse.
        items: [
          {
            id: tier.id,
            title: `Startup World Cup Argentina 2026 — ${tier.nombre}`,
            quantity,
            unit_price: montos.precioUnitario,
            currency_id: 'ARS',
          },
          {
            id: `${tier.id}-cargo`,
            title: 'Cargo de servicio',
            quantity,
            unit_price: montos.cargoUnitario,
            currency_id: 'ARS',
          },
        ],
        payer: { name: nombre, email },
        // Es el hilo que une el pago de MP con nuestra orden: el webhook lo lee
        // para saber qué acreditar.
        external_reference: orden.id,
        // Se vuelve al landing con `?compra=<id>`, que abre el modal de
        // felicitaciones ahí mismo. El id es lo único que viaja: el estado del
        // pago se lo pregunta el backend a MP, nunca se lee de esta URL.
        back_urls: {
          success: `${base}/?compra=${orden.id}`,
          pending: `${base}/?compra=${orden.id}`,
          failure: `${base}/?compra=${orden.id}`,
        },
        ...(publica ? { auto_return: 'approved' } : {}),
        ...(publica ? { notification_url: `${base}/api/mp-webhook` } : {}),
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

    // La clave pública viaja acá y ya no se inlinea en el build con `VITE_`.
    // Dos motivos: sigue el mismo flag de entorno que el resto —un preview no
    // puede quedar con la clave de producción— y cambiarla deja de exigir un
    // redeploy.
    return json(res, 201, {
      orderId: orden.id,
      preferenceId: preference.id,
      publicKey: credenciales.publicKey,
    })
  } catch (err) {
    console.error('[checkout]', err)
    return json(res, 500, { error: 'checkout_fallo' })
  }
}
