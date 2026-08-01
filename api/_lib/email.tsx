// Envío del mail de confirmación (Resend + React Email).
//
// El template vive en emails/entrada.tsx. A Resend se le pasa el componente por
// la prop `react` y él lo renderiza a HTML: no hace falta @react-email/render.
//
// Es .tsx porque acá se instancia el componente. En dev lo transforma Vite (vía
// el plugin de scripts/vite-plugin-api.mjs) y en Vercel su bundler.
/** @jsxRuntime automatic */
/** @jsxImportSource react */
// (ver la nota en emails/entrada.tsx: sin este pragma el bundler usa el
// transform JSX clásico y revienta con "React is not defined" en producción)
import { Resend } from 'resend'
import { formatARS } from './http.js'
import { EntradaEmail } from './emails/entrada.tsx'

type Orden = {
  id: string
  buyer_name: string
  buyer_email: string
  quantity: number
  unit_price_ars: number
  service_fee_ars: number | string | null
}

/**
 * Manda la confirmación. Devuelve true si salió.
 *
 * Nunca tira: un fallo del mail no puede hacer que el webhook devuelva error,
 * porque Mercado Pago reintentaría y el pago YA está acreditado. Se loguea y se
 * sigue; el comprador siempre tiene su entrada en el sitio.
 */
export async function enviarEntrada({
  orden,
  tierNombre,
  ticketUrl,
  pdfUrl,
  qrUrl,
}: {
  orden: Orden
  tierNombre: string
  ticketUrl: string
  pdfUrl: string
  qrUrl: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) {
    console.warn('[email] sin RESEND_API_KEY o RESEND_FROM: no se manda el mail')
    return false
  }

  const subtotal = orden.unit_price_ars * orden.quantity
  const cargo = Number(orden.service_fee_ars || 0)
  const total = Math.round((subtotal + cargo) * 100) / 100
  const unidades = orden.quantity === 1 ? '1 entrada' : `${orden.quantity} entradas`
  const fechas = '5, 6 y 7 de agosto en Buenos Aires'
  const money = (v: number) => formatARS(v, { centavos: true })

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: orden.buyer_email,
      replyTo: process.env.RESEND_REPLY_TO || undefined,
      subject: `Tu entrada para Startup World Cup Argentina 2026 · ${tierNombre}`,
      react: (
        <EntradaEmail
          nombre={orden.buyer_name}
          tierNombre={tierNombre}
          unidades={unidades}
          subtotal={money(subtotal)}
          cargo={money(cargo)}
          total={money(total)}
          ordenId={orden.id}
          ticketUrl={ticketUrl}
          pdfUrl={pdfUrl}
          qrUrl={qrUrl}
          fechas={fechas}
        />
      ),
      // Alternativa en texto plano, para los clientes que no renderizan HTML.
      text: [
        `¡Listo, ${orden.buyer_name}! Tu compra está confirmada.`,
        '',
        `${tierNombre} — ${unidades}`,
        `Subtotal: ${money(subtotal)}`,
        `Cargo de servicio: ${money(cargo)}`,
        `Total: ${money(total)}`,
        `Orden: ${orden.id}`,
        '',
        `Startup World Cup Argentina 2026 — ${fechas}`,
        '',
        `Descargá tu entrada: ${pdfUrl}`,
        `O abrila en el sitio: ${ticketUrl}`,
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
