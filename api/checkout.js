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
import { credencialesMP, ventaPropiaAbierta } from './_lib/entorno.js'

/** Minutos que una orden pendiente mantiene reservado su cupo. */
const RESERVA_MINUTOS = 30

/** Tope por compra, alineado con el CHECK de la tabla. */
const MAX_UNIDADES = 5

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'POST')) return

  // El interruptor de la venta propia, del lado del servidor. Que el botón no
  // esté en el sitio no alcanza: este endpoint es público y crear preferencias
  // con la venta cerrada es cobrarle a alguien por algo que no está a la venta.
  if (!ventaPropiaAbierta()) {
    return json(res, 403, { error: 'venta_cerrada' })
  }

  // Las credenciales del entorno. En desarrollo son las de prueba, y si son de
  // producción esto tira antes de crear nada — ver `_lib/entorno.js`.
  let credenciales
  try {
    credenciales = await credencialesMP()
  } catch (err) {
    console.error('[checkout]', err.message)
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

    // Si esta misma persona ya venía con una orden pendiente de este modal, se
    // libera antes de contar el stock.
    //
    // Sin esto, volver a «mis datos», cambiar algo y reenviar creaba una orden
    // NUEVA cada vez, y cada una reservaba su cupo por 30 minutos. Con el tope de
    // 5 entradas por compra, un comprador indeciso podía agotar la tanda él solo
    // sin llegar a pagar nada.
    //
    // Va antes del chequeo de stock a propósito: lo que libera tiene que contar
    // para el cálculo de abajo, o quien tenía la última entrada reservada para sí
    // mismo se choca con su propia reserva.
    await liberarPrevia(body.ordenPrevia, email)

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

    // Desde acá la orden EXISTE, y mientras siga `pending` sin vencer le está
    // reservando su cupo por 30 minutos. Si algo de lo que viene abajo falla —el
    // insert de las entradas, o Mercado Pago al crear la preferencia— esa reserva
    // queda tomada por una compra que nadie va a poder pagar nunca: entradas que
    // no se venden y que no figuran en ningún lado. Con la última tanda eso es
    // agotar el evento por un timeout.
    //
    // Por eso todo lo que sigue va adentro de un try que la vence antes de
    // propagar. Es exactamente lo que hace el botón «liberar» del backoffice.
    try {
      // Una fila por asistente, todavía sin token: la credencial se emite cuando
      // el pago se aprueba (ver api/_lib/acreditar.js). Guardar los nombres acá y
      // no al acreditar es lo que permite que el mail y la puerta sepan quién es
      // cada uno sin volver a preguntar.
      const { error: entradasErr } = await db()
        .from('entradas')
        .insert(nombres.map((n, i) => ({ order_id: orden.id, numero: i + 1, nombre: n })))

      if (entradasErr) throw entradasErr

      return await crearPreferencia({
        req, res, orden, tier, quantity, montos, expiresAt, credenciales,
        comprador: { nombre, email },
      })
    } catch (err) {
      await liberarCupo(orden.id)
      throw err
    }
  } catch (err) {
    console.error('[checkout]', err)
    return json(res, 500, { error: 'checkout_fallo' })
  }
}

/**
 * Vence una orden para devolverle el cupo al stock.
 *
 * No se borra nada: `stock_disponible` sólo cuenta las pendientes con
 * `expires_at > now()`, así que vencerla alcanza y queda el rastro de que existió.
 *
 * Su propio fallo se traga a propósito: esto corre compensando otro error, y el
 * que le importa a quien lee los logs es el de arriba.
 */
/**
 * Libera la orden pendiente que este mismo comprador dejó abierta.
 *
 * El filtro por `buyer_email` no es de más: sin él, este endpoint —que es
 * público— dejaría vencer la orden pendiente de cualquiera con sólo saber su id,
 * y ese id viaja en la URL de vuelta de Mercado Pago (`?compra=<id>`). Con el
 * mail, lo único que se puede liberar es lo propio.
 *
 * `pending` también es un cerrojo: una orden ya paga no la toca nadie por acá.
 */
async function liberarPrevia(ordenId, email) {
  const id = String(ordenId || '')
  if (!UUID_RE.test(id)) return

  const { error } = await db()
    .from('orders')
    .update({ status: 'expired', expires_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .eq('buyer_email', email)
  // No corta la compra: si no se pudo liberar, lo peor que pasa es que el cupo
  // siga reservado hasta que venza solo.
  if (error) console.error('[checkout] no pude liberar la orden previa', id, error)
}

async function liberarCupo(ordenId) {
  const { error } = await db()
    .from('orders')
    .update({ status: 'expired', expires_at: new Date().toISOString() })
    .eq('id', ordenId)
    .eq('status', 'pending')
  if (error) console.error('[checkout] no pude liberar el cupo de la orden', ordenId, error)
}

/** La preferencia de Mercado Pago, que es lo que el front necesita para cobrar. */
async function crearPreferencia(
  { req, res, orden, tier, quantity, montos, expiresAt, credenciales, comprador },
) {
  const base = siteUrl(req)
  const mp = new MercadoPagoConfig({ accessToken: credenciales.accessToken })

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
      payer: { name: comprador.nombre, email: comprador.email },
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

  // Chequeado, y no disparado y a otra cosa: sin el `mp_preference_id` la orden
  // queda sin el hilo que la ata a Mercado Pago, y reconciliarla después —que
  // es lo que destraba una compra que el webhook no acreditó— se vuelve
  // adivinanza. Si esto falla, el catch de arriba libera el cupo.
  const { error: errPref } = await db()
    .from('orders')
    .update({ mp_preference_id: preference.id })
    .eq('id', orden.id)
  if (errPref) throw errPref

  // La clave pública viaja acá y ya no se inlinea en el build con `VITE_`.
  // Dos motivos: sigue el mismo flag de entorno que el resto —un preview no
  // puede quedar con la clave de producción— y cambiarla deja de exigir un
  // redeploy.
  return json(res, 201, {
    orderId: orden.id,
    preferenceId: preference.id,
    publicKey: credenciales.publicKey,
  })
}
