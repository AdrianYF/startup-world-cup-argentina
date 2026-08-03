// Generado por scripts/build-emails.mjs — no editar. La fuente es el .tsx de al lado.
import { jsx as _jsx } from "react/jsx-runtime";
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
import { Resend } from 'resend';
import { formatARS } from './http.js';
import { ENTORNO, valorDe } from './entorno.js';
// Con extensión `.js` y no `.tsx`: TypeScript resuelve el `.tsx` igual, y así
// el specifier ya apunta al archivo compilado que es lo que corre en Vercel.
// Ver scripts/build-emails.mjs.
import { EntradaEmail } from './emails/entrada.js';
export async function enviarEntrada({ orden, tierNombre, entradas, }) {
    // Del entorno activo: en desarrollo son RESEND_TEST_*. Es lo que separa
    // "probé el checkout" de "le mandé un mail a alguien con el remitente real".
    const apiKey = valorDe('RESEND_API_KEY', { obligatoria: false });
    const from = valorDe('RESEND_FROM', { obligatoria: false });
    if (!apiKey || !from) {
        // No tira: mandar el mail es lo último del webhook y el pago YA está
        // acreditado. Avisa con el nombre de la variable del entorno en que corre,
        // que si no en desarrollo se busca la que no es.
        console.warn(`[email] sin credenciales de Resend en ${ENTORNO}: no se manda el mail`);
        return false;
    }
    const subtotal = orden.unit_price_ars * orden.quantity;
    const cargo = Number(orden.service_fee_ars || 0);
    const total = Math.round((subtotal + cargo) * 100) / 100;
    const varias = entradas.length > 1;
    const unidades = varias ? `${entradas.length} entradas` : '1 entrada';
    const fechas = '5, 6 y 7 de agosto en Buenos Aires';
    const money = (v) => formatARS(v, { centavos: true });
    try {
        const { error } = await new Resend(apiKey).emails.send({
            from,
            to: orden.buyer_email,
            replyTo: valorDe('RESEND_REPLY_TO', { obligatoria: false }) || undefined,
            subject: varias
                ? `Tus ${entradas.length} entradas para Startup World Cup Argentina 2026 · ${tierNombre}`
                : `Tu entrada para Startup World Cup Argentina 2026 · ${tierNombre}`,
            react: (_jsx(EntradaEmail, { nombre: orden.buyer_name, tierNombre: tierNombre, unidades: unidades, subtotal: money(subtotal), cargo: money(cargo), total: money(total), ordenId: orden.id, entradas: entradas, fechas: fechas })),
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
        });
        if (error) {
            console.error('[email] Resend rechazó el envío:', error);
            return false;
        }
        return true;
    }
    catch (err) {
        console.error('[email]', err);
        return false;
    }
}
