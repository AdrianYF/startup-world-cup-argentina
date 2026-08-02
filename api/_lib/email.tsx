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
/** Una por asistente: su nombre y los tres links de SU entrada. */
type EntradaMail = {
  nombre: string | null
  ticketUrl: string
  pdfUrl: string
  qrUrl: string
}

export async function enviarEntrada({
  orden,
  tierNombre,
  entradas,
}: {
  orden: Orden
  tierNombre: string
  entradas: EntradaMail[]
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
  const varias = entradas.length > 1
  const unidades = varias ? `${entradas.length} entradas` : '1 entrada'
  const fechas = '5, 6 y 7 de agosto en Buenos Aires'
  const money = (v: number) => formatARS(v, { centavos: true })

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: orden.buyer_email,
      replyTo: process.env.RESEND_REPLY_TO || undefined,
      subject: varias
        ? `Tus ${entradas.length} entradas para Startup World Cup Argentina 2026 · ${tierNombre}`
        : `Tu entrada para Startup World Cup Argentina 2026 · ${tierNombre}`,
      react: (
        <EntradaEmail
          nombre={orden.buyer_name}
          tierNombre={tierNombre}
          unidades={unidades}
          subtotal={money(subtotal)}
          cargo={money(cargo)}
          total={money(total)}
          ordenId={orden.id}
          entradas={entradas}
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
        ...entradas.flatMap((e, i) => [
          varias ? `Entrada ${i + 1}${e.nombre ? ` — ${e.nombre}` : ''}:` : 'Tu entrada:',
          `  Descargar: ${e.pdfUrl}`,
          `  Ver en el sitio: ${e.ticketUrl}`,
          '',
        ]),
        varias ? 'Cada persona entra con SU código: reenviale el suyo a cada una.' : '',
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
