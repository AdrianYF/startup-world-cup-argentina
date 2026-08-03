#!/usr/bin/env node
/**
 * Una compra de punta a punta contra la base DE PRODUCCIÓN, sin plata.
 *
 *   node scripts/prueba-produccion.mjs            ← simulacro, no toca nada
 *   node scripts/prueba-produccion.mjs --correr   ← la hace
 *   node scripts/prueba-produccion.mjs --limpiar  ← borra lo que dejó
 *
 * Para qué: los tests de integración corren contra el Postgres local. Prueban el
 * código, no el entorno real — no dicen nada de si la base de la nube tiene el
 * esquema que hace falta, si Resend entrega, ni si el mail sale con los links
 * correctos. Esto sí, porque usa la base de verdad.
 *
 * ─── Qué se falsea y qué no ─────────────────────────────────────────────────
 *
 *   REAL      la base de la nube: la orden, las entradas y los tokens se
 *             escriben ahí, y se leen de la vista `acreditacion` como los lee
 *             la puerta.
 *   REAL      el mail: sale por Resend, con el remitente y el template de
 *             verdad.
 *   FALSO     el pago. NO se cobra nada: se llama a `acreditar()` con un pago
 *             aprobado sintético, que es exactamente lo que le llegaría del
 *             webhook. Mercado Pago no participa.
 *
 * ─── Las dos cosas que hace a propósito y hay que saber ─────────────────────
 *
 * 1. ESCRIBE EN LA BASE DEL EVENTO. Deja una orden real que ocupa un cupo. Por
 *    eso `--limpiar` existe y por eso el mail lleva una marca: para poder sacarlo
 *    sin dudar de qué se está borrando.
 *
 * 2. USA LA KEY DE RESEND DE PRODUCCIÓN CON CREDENCIALES DE PRUEBA DE MERCADO
 *    PAGO. Eso rompe a mano la regla de `entorno.js`, que dice que todo conmuta
 *    junto. Es deliberado y es el único punto del proyecto donde se hace: la
 *    gracia es verificar el mail DE VERDAD sin que el checkout cobre. El cerrojo
 *    de Mercado Pago sigue intacto — de hecho abajo se corta si `ENTORNO` es
 *    producción.
 */
import { argv, env, exit } from 'node:process'

const CORRER = argv.includes('--correr')
const LIMPIAR = argv.includes('--limpiar')

/**
 * La marca que hace reconocible lo que deja esta prueba.
 *
 * Va en `buyer_name` y NO en el mail, aunque un `+tag` sería lo natural: con el
 * remitente de sandbox, Resend compara la dirección EXACTA del dueño de la cuenta
 * y rechaza `alguien+loquesea@gmail.com` con un 403. O sea que marcar por mail
 * hacía fallar el envío por una razón que no es la que se está probando.
 */
const MARCA = 'PRUEBA-E2E'

try { process.loadEnvFile('.env.local') } catch { /* puede venir del ambiente */ }

/* ── Cerrojos ─────────────────────────────────────────────────────────────── */

// Al revés que los tests de integración: éste QUIERE la nube. Contra la local no
// prueba nada que los tests no prueben ya, y mejor.
const SUPABASE_URL = env.SUPABASE_URL || ''
if (/127\.0\.0\.1|localhost/.test(SUPABASE_URL)) {
  console.error('\n  ✗ SUPABASE_URL apunta al Postgres local.')
  console.error('    Esta prueba es contra la base de la nube — para el local están los tests.\n')
  exit(1)
}

// Lo único que no se negocia: acá no se cobra. Con `ENTORNO=production`,
// `acreditar()` y el checkout tomarían las credenciales que mueven plata.
if ((env.ENTORNO || '').trim().toLowerCase() === 'production') {
  console.error('\n  ✗ ENTORNO=production. Esta prueba no cobra y no quiere poder hacerlo.')
  console.error('    Correla con ENTORNO=development (o sacá la variable).\n')
  exit(1)
}
env.ENTORNO = 'development'
env.VENTA_PROPIA = 'on'

// El destinatario: la casilla dueña de la cuenta de Resend.
//
// No es un detalle de comodidad. Con `onboarding@resend.dev` como remitente,
// Resend SÓLO entrega al dueño de la cuenta y rechaza todo lo demás con un 403.
// Mandarle a cualquier otra dirección haría fallar la prueba por una razón que
// no es la que se está probando.
const DESTINO = env.MAIL_DE_PRUEBA || 'glujan.recalde@gmail.com'

// Resend de producción con Mercado Pago de prueba. Ver la nota del encabezado.
if (!env.RESEND_TEST_API_KEY && env.RESEND_API_KEY) {
  env.RESEND_TEST_API_KEY = env.RESEND_API_KEY
  env.RESEND_TEST_FROM = env.RESEND_FROM || env.RESEND_TEST_FROM
}

const KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) { console.error('\n  ✗ Falta SUPABASE_SECRET_KEY.\n'); exit(1) }

const db = async (ruta, opciones = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
      ...opciones.headers,
    },
  })
  const t = await res.text()
  if (!res.ok) throw new Error(`${ruta} → ${res.status} ${t}`)
  return t ? JSON.parse(t) : []
}

const ok = s => console.log(`   ✓ ${s}`)
const mal = s => console.log(`   ✗ ${s}`)

console.log(`\n  Base: ${SUPABASE_URL}  ⚠ LA NUBE`)
console.log(`  Mail: ${DESTINO}`)
console.log(`  Modo: ${LIMPIAR ? 'LIMPIAR' : CORRER ? '⚠ CORRER (escribe y manda mail)' : 'simulacro'}\n`)

/* ── Limpiar ──────────────────────────────────────────────────────────────── */

if (LIMPIAR) {
  const ordenes = await db(`orders?buyer_name=like.*${MARCA}*&select=id,buyer_name`)
  if (!ordenes.length) { console.log('  No hay nada de esta prueba para borrar.\n'); exit(0) }
  const ids = `(${ordenes.map(o => `"${o.id}"`).join(',')})`
  const entradas = await db(`entradas?order_id=in.${ids}&select=id`)
  if (entradas.length) {
    await db(`checkins?entrada_id=in.(${entradas.map(e => `"${e.id}"`).join(',')})`, { method: 'DELETE' })
  }
  await db(`entradas?order_id=in.${ids}`, { method: 'DELETE' })
  await db(`orders?id=in.${ids}`, { method: 'DELETE' })
  ok(`borradas ${ordenes.length} orden(es) y ${entradas.length} entrada(s) de la prueba`)
  console.log('')
  exit(0)
}

/* ── Qué haría ────────────────────────────────────────────────────────────── */

const tiers = await db('tiers?select=id,nombre,price_ars,activo&activo=eq.true')
if (!tiers.length) {
  mal('no hay ninguna tanda activa: el checkout no tendría qué vender')
  console.log('')
  exit(1)
}
const tier = tiers[0]
ok(`tanda a usar: ${tier.id} · ${tier.nombre} · $${tier.price_ars.toLocaleString('es-AR')}`)

if (!CORRER) {
  console.log('\n  Haría, contra ESA base:')
  console.log('    1. crear una orden pendiente con su entrada (ocupa 1 cupo)')
  console.log('    2. acreditarla con un pago aprobado FALSO — no se cobra nada')
  console.log('    3. emitir el token y mandar el mail de verdad por Resend')
  console.log('    4. verificar que aparece en la vista `acreditacion`, que es la lista de la puerta')
  console.log('\n  Para hacerlo:      node scripts/prueba-produccion.mjs --correr')
  console.log('  Para deshacerlo:   node scripts/prueba-produccion.mjs --limpiar\n')
  exit(0)
}

/* ── Correr ───────────────────────────────────────────────────────────────── */

const marcaUnica = `${MARCA}-${Date.now()}`
// El mail va sin tocar: ver la nota de MARCA.
const email = DESTINO
const nombre = `${marcaUnica} No Es Un Asistente`

console.log('\n  ── 1. Crear la orden ──')
const { desglose } = await import('../api/_lib/precios.js')
const montos = desglose(tier.price_ars, 1)
const [creada] = await db('rpc/crear_orden', {
  method: 'POST',
  body: JSON.stringify({
    p_tier: tier.id, p_cantidad: 1, p_precio: tier.price_ars, p_cargo: montos.cargo,
    p_nombre: nombre, p_email: email, p_telefono: '', p_empresa: '',
    p_nombres: [nombre],
    p_expira: new Date(Date.now() + 30 * 60_000).toISOString(),
  }),
})
if (!creada?.orden_id) { mal(`sin cupo (disponible: ${creada?.disponible})`); exit(1) }
ok(`orden ${creada.orden_id.slice(0, 8)} creada · quedan ${creada.disponible}`)
ok('`crear_orden()` existe en la nube — la migración 0011 está aplicada')

console.log('\n  ── 2. Acreditar (pago falso) ──')
const [orden] = await db(`orders?id=eq.${creada.orden_id}&select=*`)
const { acreditar } = await import('../api/_lib/acreditar.js')
// La URL que usaría PRODUCCIÓN, no la del túnel de desarrollo.
//
// De acá salen los links del mail —el QR, el PDF, «verla en el sitio»— y el
// punto de esta prueba es ver lo que le llegaría a un comprador. Tomar
// `PUBLIC_TEST_SITE_URL` mandaba el mail apuntando al túnel de la última sesión,
// que para cuando alguien lo abre ya no existe. Pasó con una compra real.
const base = env.SITIO_DE_PRUEBA
  || env.PUBLIC_SITE_URL
  || 'https://startup-world-cup-argentina.vercel.app'

const r = await acreditar({
  orden,
  // Lo que le llegaría del webhook, sin Mercado Pago de por medio.
  pago: {
    id: `falso-${marcaUnica}`, status: 'approved', status_detail: 'accredited',
    transaction_amount: montos.total,
  },
  baseUrl: base,
})
r.orden.status === 'paid' ? ok('la orden quedó `paid`') : mal(`quedó en ${r.orden.status}`)

console.log('\n  ── 3. La entrada ──')
const entradas = await db(`entradas?order_id=eq.${creada.orden_id}&select=numero,nombre,token`)
entradas[0]?.token
  ? ok(`token emitido: ${entradas[0].token.slice(0, 14)}…`)
  : mal('NO se emitió token')

console.log('\n  ── 4. ¿La ve la puerta? ──')
const enLista = await db(`acreditacion?id=eq.${entradas[0]?.id || '00000000-0000-0000-0000-000000000000'}&select=origen,nombre,dias`)
  .catch(() => [])
const [ent] = await db(`entradas?order_id=eq.${creada.orden_id}&select=id`)
const fila = await db(`acreditacion?id=eq.${ent.id}&select=origen,nombre,dias,token`)
fila.length
  ? ok(`en la lista: [${fila[0].origen}] ${fila[0].nombre} · ${fila[0].dias}`)
  : mal('NO aparece en `acreditacion` — no se podría acreditar en la puerta')
void enLista

console.log('\n  ── 5. El mail ──')
const [final] = await db(`orders?id=eq.${creada.orden_id}&select=email_sent_at`)
if (final.email_sent_at) {
  ok(`salió · ${final.email_sent_at}`)
  console.log(`      revisá ${email}`)
  console.log(`      los links del mail apuntan a ${base}`)
} else {
  mal('NO salió. Mirá el log de arriba: suele ser la key de Resend o el destinatario.')
}

console.log('\n  ── Cómo queda ──')
console.log(`   La orden ${creada.orden_id.slice(0, 8)} queda en la base y ocupa un cupo.`)
console.log('   Para sacarla:  node scripts/prueba-produccion.mjs --limpiar\n')
