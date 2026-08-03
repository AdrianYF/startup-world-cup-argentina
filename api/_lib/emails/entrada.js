// Generado por scripts/build-emails.mjs — no editar. La fuente es el .tsx de al lado.
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** @jsxRuntime automatic */
/** @jsxImportSource react */
//
// Las dos líneas de arriba no son decorativas: el tsconfig.json de la raíz es
// sólo un archivo de referencias, sin `compilerOptions`, así que el bundler que
// compila api/ no encuentra ningún `jsx` configurado y cae al transform clásico
// (`React.createElement`) sin importar React. Resultado: "React is not defined",
// en runtime y sólo en producción. Con el pragma, el transform queda fijado acá.
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Row, Column, Section, Text, } from '@react-email/components';
const BG = '#020618';
const CARD = '#0f172b';
const ACENTO = '#75AADB';
const BORDE = 'rgba(117,170,219,0.25)';
export function EntradaEmail({ nombre, tierNombre, unidades, subtotal, cargo, total, ordenId, entradas, fechas, }) {
    const varias = entradas.length > 1;
    return (_jsxs(Html, { lang: "es-AR", children: [_jsx(Head, {}), _jsxs(Preview, { children: ["Tu entrada para Startup World Cup Argentina 2026 \u2014 ", tierNombre] }), _jsx(Body, { style: body, children: _jsxs(Container, { style: card, children: [_jsxs(Section, { style: { padding: '28px 28px 0' }, children: [_jsx(Text, { style: kicker, children: "Startup World Cup Argentina" }), _jsxs(Heading, { as: "h1", style: titulo, children: ["\u00A1Listo, ", nombre, "!"] }), _jsxs(Text, { style: bajada, children: ["Tu compra est\u00E1 confirmada. Nos vemos el ", _jsx("strong", { style: { color: '#ffffff' }, children: fechas }), "."] })] }), _jsx(Section, { style: { padding: '24px 28px 0' }, children: _jsxs(Section, { style: detalle, children: [_jsx(Fila, { label: "Entrada", valor: tierNombre }), _jsx(Fila, { label: "Cantidad", valor: unidades }), _jsx(Fila, { label: "Subtotal", valor: subtotal }), _jsx(Fila, { label: "Cargo de servicio", valor: cargo }), _jsx(Hr, { style: separador }), _jsx(Fila, { label: "Total", valor: total, destacado: true }), _jsx(Fila, { label: "Orden", valor: ordenId, mono: true })] }) }), entradas.map((entrada, i) => (_jsxs(Section, { style: { padding: '26px 28px 0', textAlign: 'center' }, children: [varias && (_jsxs(Text, { style: separadorEntrada, children: ["Entrada ", i + 1, " de ", entradas.length] })), entrada.nombre && (_jsx(Text, { style: nombreAsistente, children: entrada.nombre })), _jsx(Text, { style: { ...bajada, margin: '6px 0 14px', fontSize: '13px' }, children: varias ? 'Este código es sólo de esta persona' : 'Mostrá este código en la puerta' }), _jsx(Img, { src: entrada.qrUrl, width: "180", height: "180", alt: `Código QR de la entrada de ${entrada.nombre || nombre}`, style: qr }), _jsx(Section, { style: { padding: '18px 0 0', textAlign: 'center' }, children: _jsx(Button, { href: entrada.pdfUrl, style: boton, children: "Descargar entrada" }) }), _jsx(Text, { style: { ...pie, margin: '12px 0 0' }, children: _jsx(Link, { href: entrada.ticketUrl, style: { color: ACENTO }, children: "Verla en el sitio" }) })] }, i))), _jsx(Section, { style: { padding: '26px 28px 28px' }, children: _jsxs(Text, { style: pie, children: [varias && (_jsxs(_Fragment, { children: ["Reenviale a cada persona su entrada: en la puerta se acredita una por una.", _jsx("br", {})] })), "Guard\u00E1 este mail: es tu comprobante."] }) })] }) })] }));
}
function Fila({ label, valor, destacado, mono, }) {
    return (_jsxs(Row, { children: [_jsx(Column, { children: _jsx(Text, { style: { ...filaLabel, ...(destacado ? { color: '#ffffff', fontWeight: 700 } : {}) }, children: label }) }), _jsx(Column, { align: "right", children: _jsx(Text, { style: {
                        ...filaValor,
                        ...(destacado ? { fontSize: '15px', fontWeight: 800 } : {}),
                        ...(mono ? { fontFamily: 'monospace', fontSize: '11px', fontWeight: 400 } : {}),
                    }, children: valor }) })] }));
}
/* ---------- estilos ---------- */
const body = {
    margin: 0,
    padding: '32px 16px',
    backgroundColor: BG,
    fontFamily: 'Helvetica, Arial, sans-serif',
};
const card = {
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: CARD,
    border: `1px solid ${BORDE}`,
    borderRadius: '16px',
    overflow: 'hidden',
};
const kicker = {
    margin: 0,
    color: ACENTO,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
};
const titulo = {
    margin: '8px 0 0',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: 800,
    lineHeight: 1.2,
};
const bajada = {
    margin: '10px 0 0',
    color: '#9ca3af',
    fontSize: '15px',
    lineHeight: 1.5,
};
const detalle = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(117,170,219,0.15)',
    borderRadius: '12px',
    padding: '10px 20px',
};
const filaLabel = { margin: '6px 0', color: '#9ca3af', fontSize: '13px' };
const filaValor = {
    margin: '6px 0',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'right',
};
const separador = { borderColor: 'rgba(117,170,219,0.2)', margin: '8px 0' };
const separadorEntrada = {
    margin: '0 0 4px',
    color: ACENTO,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
};
const nombreAsistente = {
    margin: 0,
    color: '#ffffff',
    fontSize: '17px',
    fontWeight: 800,
};
const qr = {
    display: 'block',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '12px',
};
const boton = {
    backgroundColor: ACENTO,
    color: '#0f172b',
    fontSize: '14px',
    fontWeight: 800,
    textDecoration: 'none',
    padding: '13px 30px',
    borderRadius: '999px',
};
const pie = {
    margin: 0,
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: 1.6,
    textAlign: 'center',
};
export default EntradaEmail;
