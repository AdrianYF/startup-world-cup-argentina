// POST /api/mp-webhook — la única puerta por la que una orden pasa a `paid`.
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
// El redirect a /gracias NO acredita: esa URL se escribe a mano en la barra.
import crypto from 'node:crypto'
import {
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from 'mercadopago'
import { db } from './_lib/db.js'
import { json, first, siteUrl } from './_lib/http.js'
import { enviarEntrada } from './_lib/email.js'

/** Ventana de tolerancia del timestamp firmado. Acota los replays. */
const TOLERANCIA_SEG = 300

export default async function handler(req, res) {
  // MP puede tantear la URL con un GET al configurar la notificación.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
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
    const mp = new MercadoPagoConfig({ accessToken })
    const pago = await new Payment(mp).get({ id: String(paymentId) })

    const ordenId = pago.external_reference
    if (!ordenId) {
      console.warn('[webhook] pago sin external_reference:', paymentId)
      return json(res, 200, { ignored: 'sin_external_reference' })
    }

    const { data: orden, error } = await db()
      .from('orders')
      .select('*')
      .eq('id', ordenId)
      .single()

    if (error || !orden) {
      console.warn('[webhook] orden inexistente:', ordenId)
      // 200 igual: reintentar no la va a hacer aparecer.
      return json(res, 200, { ignored: 'orden_inexistente' })
    }

    // Ya acreditada: cortamos acá. Es el caso normal del reintento de MP.
    if (orden.status === 'paid' && orden.mp_payment_id === String(paymentId)) {
      return json(res, 200, { ok: true, idempotente: true })
    }

    if (pago.status !== 'approved') {
      await db()
        .from('orders')
        .update({
          status: pago.status === 'pending' || pago.status === 'in_process' ? 'pending' : 'rejected',
          mp_payment_id: String(paymentId),
          mp_status_detail: pago.status_detail || pago.status,
        })
        .eq('id', orden.id)
      return json(res, 200, { ok: true, status: pago.status })
    }

    // --- Aprobado ---------------------------------------------------------
    // Se verifica que el monto coincida con lo que la orden dice. Si no, se
    // acredita igual (la plata entró) pero queda logueado para revisarlo: no
    // vamos a dejar a alguien que pagó sin su entrada por un descuadre nuestro.
    const esperado = orden.unit_price_ars * orden.quantity
    if (Number(pago.transaction_amount) !== esperado) {
      console.error(
        `[webhook] monto distinto en la orden ${orden.id}:`,
        `cobrado ${pago.transaction_amount} vs esperado ${esperado}`,
      )
    }

    const token = orden.ticket_token || crypto.randomBytes(32).toString('base64url')

    // El WHERE sobre status evita que dos notificaciones simultáneas escriban
    // las dos: sólo una encuentra la fila todavía en 'pending'.
    const { data: acreditada, error: updErr } = await db()
      .from('orders')
      .update({
        status: 'paid',
        mp_payment_id: String(paymentId),
        mp_status_detail: pago.status_detail || 'accredited',
        ticket_token: token,
      })
      .eq('id', orden.id)
      .neq('status', 'paid')
      .select('*')
      .maybeSingle()

    if (updErr) throw updErr
    if (!acreditada) {
      // Otra ejecución ganó la carrera y ya la acreditó.
      return json(res, 200, { ok: true, idempotente: true })
    }

    // Mail — sólo una vez, y su fallo no invalida la acreditación.
    if (!acreditada.email_sent_at) {
      const { data: tier } = await db()
        .from('tiers')
        .select('nombre')
        .eq('id', acreditada.tier_id)
        .single()

      const base = siteUrl(req)
      const enviado = await enviarEntrada({
        orden: acreditada,
        tierNombre: tier?.nombre || acreditada.tier_id,
        ticketUrl: `${base}/entrada/${acreditada.ticket_token}`,
        qrUrl: `${base}/api/entrada-qr?t=${acreditada.ticket_token}`,
      })
      if (enviado) {
        await db()
          .from('orders')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', acreditada.id)
      }
    }

    return json(res, 200, { ok: true, status: 'approved' })
  } catch (err) {
    console.error('[webhook]', err)
    // 500 para que MP reintente: si acá se rompió algo, el pago existe y la
    // orden todavía no está acreditada.
    return json(res, 500, { error: 'webhook_fallo' })
  }
}
