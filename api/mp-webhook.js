// POST /api/mp-webhook — Mercado Pago nos avisa que pasó algo con un pago.
//
// Tres reglas, y ninguna es opcional:
//
//  1. Se valida la FIRMA del header `x-signature` (HMAC-SHA256 con
//     MP_WEBHOOK_SECRET). Sin esto, cualquiera que conozca la URL manda un POST
//     y se regala entradas.
//  2. No se le cree NADA al body más allá del id. El estado del pago se le
//     pregunta a Mercado Pago con Payment.get().
//  3. Es idempotente. MP reintenta las notificaciones; acreditar dos veces
//     descontaría el cupo dos veces y mandaría el mail repetido.
//
// El redirect a la pantalla de gracias NO acredita: esa URL se escribe a mano.
// La acreditación en sí vive en _lib/acreditar.js, compartida con la
// reconciliación de /api/orden.
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago'
import { db } from './_lib/db.js'
import { json, first, siteUrl } from './_lib/http.js'
import { traerPago, acreditar } from './_lib/acreditar.js'

/** Ventana de tolerancia del timestamp firmado. Acota los replays. */
const TOLERANCIA_SEG = 300

export default async function handler(req, res) {
  // Mercado Pago tantea la URL con un GET/HEAD antes de dejarte guardarla en el
  // panel, y también para chequear que siga viva. Si le contestamos 405 la
  // rechaza y no se puede configurar la notificación.
  //
  // El OK no toca nada ni devuelve datos: sólo dice "acá hay algo escuchando".
  // Lo que acredita sigue siendo únicamente el POST, y sólo con firma válida.
  if (req.method === 'GET' || req.method === 'HEAD') {
    return json(res, 200, { ok: true, endpoint: 'mp-webhook' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET')
    return json(res, 405, { error: 'method_not_allowed' })
  }

  const secret = process.env.MP_WEBHOOK_SECRET
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!secret || !accessToken) {
    console.error('[webhook] falta MP_WEBHOOK_SECRET o MP_ACCESS_TOKEN')
    // 500 y no 200: que MP reintente cuando esté bien configurado, en vez de
    // dar la notificación por entregada y perder el pago.
    return json(res, 500, { error: 'webhook_no_configurado' })
  }

  const dataId = first(req.query?.['data.id']) || first(req.query?.id)

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers['x-signature'],
      xRequestId: req.headers['x-request-id'],
      dataId,
      secret,
      toleranceSeconds: TOLERANCIA_SEG,
    })
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn('[webhook] firma inválida:', err.reason, 'request-id:', err.requestId)
      return json(res, 401, { error: 'firma_invalida' })
    }
    throw err
  }

  // Sólo interesan las notificaciones de pago.
  const tipo = req.body?.type || first(req.query?.type) || first(req.query?.topic)
  if (tipo && tipo !== 'payment') {
    return json(res, 200, { ignored: tipo })
  }

  const paymentId = req.body?.data?.id || dataId
  if (!paymentId) return json(res, 400, { error: 'sin_payment_id' })

  try {
    const pago = await traerPago(paymentId)

    const ordenId = pago.external_reference
    if (!ordenId) {
      console.warn('[webhook] pago sin external_reference:', paymentId)
      return json(res, 200, { ignored: 'sin_external_reference' })
    }

    const { data: orden, error } = await db().from('orders').select('*').eq('id', ordenId).single()

    if (error || !orden) {
      console.warn('[webhook] orden inexistente:', ordenId)
      // 200 igual: reintentar no la va a hacer aparecer.
      return json(res, 200, { ignored: 'orden_inexistente' })
    }

    const { orden: final, cambio } = await acreditar({ orden, pago, baseUrl: siteUrl(req) })
    return json(res, 200, { ok: true, status: final.status, idempotente: !cambio })
  } catch (err) {
    console.error('[webhook]', err)
    // 500 para que MP reintente: si acá se rompió algo, el pago existe y la
    // orden todavía no está acreditada.
    return json(res, 500, { error: 'webhook_fallo' })
  }
}
