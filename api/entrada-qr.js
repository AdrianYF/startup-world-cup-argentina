// GET /api/entrada-qr?t=<token> — el QR de una entrada, en PNG.
//
// Existe para el mail: los clientes de correo no ejecutan JS, así que el QR que
// el sitio dibuja con qrcode.react no les sirve y necesitan una imagen.
//
// El QR codifica la URL de la entrada. Escanearlo en la puerta abre
// /entrada/<token>, que muestra el ticket y si ya fue usado.
import QRCode from 'qrcode'
import { db } from './_lib/db.js'
import { json, rejectMethod, first, siteUrl } from './_lib/http.js'

/** Los tokens son 32 bytes en base64url. */
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

export default async function handler(req, res) {
  if (rejectMethod(req, res, 'GET')) return

  const token = String(first(req.query?.t) || '')
  if (!TOKEN_RE.test(token)) return json(res, 400, { error: 'token_invalido' })

  try {
    // Se verifica que exista antes de dibujar nada: así el endpoint no es un
    // generador de QR gratis para cualquier string.
    const { data, error } = await db()
      .from('orders')
      .select('id')
      .eq('ticket_token', token)
      .eq('status', 'paid')
      .maybeSingle()

    if (error) throw error
    if (!data) return json(res, 404, { error: 'entrada_inexistente' })

    const png = await QRCode.toBuffer(`${siteUrl(req)}/entrada/${token}`, {
      type: 'png',
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#020618ff', light: '#ffffffff' },
    })

    res.setHeader('Content-Type', 'image/png')
    // Cache privada: la imagen identifica una entrada concreta, no puede quedar
    // en un CDN compartido. Gmail igual la proxea del lado del destinatario.
    res.setHeader('Cache-Control', 'private, max-age=3600')
    res.status(200).send(png)
  } catch (err) {
    console.error('[entrada-qr]', err)
    json(res, 500, { error: 'qr_fallo' })
  }
}
