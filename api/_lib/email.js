// Mail de confirmación con la entrada y su QR (Resend).
//
// El HTML va con tablas y estilos inline a propósito: los clientes de mail no
// soportan flex/grid y Gmail descarta los <style> del <head>. La paleta es la
// del sitio (#020618 de fondo, #75AADB de acento).
import { Resend } from 'resend'
import { formatARS } from './http.js'

/**
 * Manda la confirmación. Devuelve true si salió.
 *
 * Nunca tira: un fallo del mail no puede hacer que el webhook devuelva error,
 * porque Mercado Pago reintentaría y el pago YA está acreditado. Se loguea y se
 * sigue; el comprador siempre tiene su entrada en /gracias.
 */
export async function enviarEntrada({ orden, tierNombre, ticketUrl, qrUrl }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) {
    console.warn('[email] sin RESEND_API_KEY o RESEND_FROM: no se manda el mail')
    return false
  }

  const total = orden.unit_price_ars * orden.quantity
  const unidades = orden.quantity === 1 ? '1 entrada' : `${orden.quantity} entradas`

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: orden.buyer_email,
      replyTo: process.env.RESEND_REPLY_TO || undefined,
      subject: `Tu entrada para Startup World Cup Argentina 2026 · ${tierNombre}`,
      html: plantilla({ orden, tierNombre, ticketUrl, qrUrl, total, unidades }),
      text: [
        `¡Listo, ${orden.buyer_name}! Tu compra está confirmada.`,
        '',
        `${tierNombre} — ${unidades}`,
        `Total: ${formatARS(total)}`,
        `Orden: ${orden.id}`,
        '',
        'Startup World Cup Argentina 2026',
        '5, 6 y 7 de agosto · Buenos Aires',
        '',
        `Mostrá este link en la puerta: ${ticketUrl}`,
      ].join('\n'),
    })

    if (error) {
      console.error('[email] Resend rechazó el envío:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[email]', err)
    return false
  }
}

function plantilla({ orden, tierNombre, ticketUrl, qrUrl, total, unidades }) {
  const fila = (label, valor) => `
    <tr>
      <td style="padding:6px 0;color:#9ca3af;font-size:13px;">${label}</td>
      <td style="padding:6px 0;color:#ffffff;font-size:13px;font-weight:700;text-align:right;">${valor}</td>
    </tr>`

  return `<!doctype html>
<html lang="es-AR">
<body style="margin:0;padding:0;background:#020618;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#020618;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0f172b;border:1px solid rgba(117,170,219,0.25);border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">

        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0;color:#75AADB;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Startup World Cup Argentina</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">¡Listo, ${escapar(orden.buyer_name)}!</h1>
          <p style="margin:10px 0 0;color:#9ca3af;font-size:15px;line-height:1.5;">Tu compra está confirmada. Nos vemos el <strong style="color:#ffffff;">5, 6 y 7 de agosto</strong> en Buenos Aires.</p>
        </td></tr>

        <tr><td style="padding:24px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(117,170,219,0.15);border-radius:12px;">
            <tr><td style="padding:18px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${fila('Entrada', escapar(tierNombre))}
                ${fila('Cantidad', unidades)}
                ${fila('Total', formatARS(total))}
                ${fila('Orden', `<span style="font-family:monospace;font-size:11px;">${orden.id}</span>`)}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:26px 28px 0;">
          <p style="margin:0 0 14px;color:#9ca3af;font-size:13px;">Mostrá este código en la puerta</p>
          <div style="display:inline-block;background:#ffffff;padding:12px;border-radius:12px;">
            <img src="${qrUrl}" width="180" height="180" alt="Código QR de tu entrada" style="display:block;width:180px;height:180px;" />
          </div>
        </td></tr>

        <tr><td align="center" style="padding:24px 28px 0;">
          <a href="${ticketUrl}" style="display:inline-block;background:#75AADB;color:#0f172b;font-size:14px;font-weight:800;text-decoration:none;padding:13px 30px;border-radius:999px;">Ver mi entrada</a>
        </td></tr>

        <tr><td style="padding:22px 28px 28px;">
          <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;text-align:center;">
            Si el código no se ve, abrí <a href="${ticketUrl}" style="color:#75AADB;">tu entrada en el sitio</a>.<br />
            Guardá este mail: es tu comprobante.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** El nombre lo escribe el comprador: se escapa antes de meterlo en el HTML. */
function escapar(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}
