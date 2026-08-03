#!/usr/bin/env node
/**
 * Borra las compras de prueba, y sólo después de que la plata haya vuelto.
 *
 *   node scripts/limpiar-prueba.mjs            ← muestra qué haría, no toca nada
 *   node scripts/limpiar-prueba.mjs --borrar   ← borra
 *
 * El problema que resuelve: las pruebas del checkout se hicieron con las
 * credenciales de producción de Mercado Pago (`APP_USR-`), así que cada compra
 * de prueba movió plata real de una tarjeta real. Borrar esas filas antes de
 * devolverla deja pagos en Mercado Pago sin nada que explique de qué eran:
 * `orders` es el único registro local que ata un `mp_payment_id` con quién
 * compró y qué tier.
 *
 * Por eso lo primero que hace es preguntarle a Mercado Pago, pago por pago, si
 * ya se devolvió. Si alguno no volvió entero, no borra nada y dice cuál.
 *
 * ─── Lo que NO toca, nunca ──────────────────────────────────────────────────
 *
 *   · `tiers`               — es configuración: precio, cupo y si está a la
 *                             venta. Borrarla deja el checkout sin nada que
 *                             vender.
 *   · `asistentes_externos` — el padrón de Luma y Startup Grind. Hoy está
 *                             vacío, pero cuando se importe va a tener a toda
 *                             la gente del evento, y este script tiene que
 *                             seguir siendo seguro de correr ese día.
 *
 * Tampoco borra "todo `orders`": borra las órdenes de UN mail, el que se usó
 * para probar. Si el día de mañana hay compras de verdad conviviendo con las de
 * prueba, esto sigue distinguiendo.
 *
 * ─── Lo que no puede saber ──────────────────────────────────────────────────
 *
 * Verifica los pagos que la base conoce. Si algún webhook se perdió y hay un
 * pago aprobado en Mercado Pago que nunca llegó a `orders`, este script no lo
 * ve: eso se busca en el panel de Mercado Pago.
 */
import { argv, env, exit } from 'node:process'

const MAIL_DE_PRUEBA = env.MAIL_DE_PRUEBA || 'glujan.recalde@gmail.com'
const BORRAR = argv.includes('--borrar')

/* ── Entorno ─────────────────────────────────────────────────────────────── */

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin `.env.local` se sigue: puede venir todo del environment.
}

const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Los DOS juegos de credenciales, no sólo el de producción.
 *
 * Miraba únicamente `MP_ACCESS_TOKEN`, y eso lo dejaba inservible justo cuando
 * hacía falta. El motivo es que **Supabase no conmuta con `ENTORNO`**: una sola
 * base para los dos entornos, a propósito. Así que la misma tabla `orders` tiene
 * pagos de la cuenta real Y de la cuenta de prueba, mezclados.
 *
 * Con un solo token, los pagos de la otra cuenta daban «Payment not found», el
 * script los contaba como plata sin devolver y se negaba a borrar nada — para
 * siempre, porque no hay reembolso que arregle un pago que no existe en esa
 * cuenta. Se probaba a mano cuál era y ahí aparecía.
 *
 * Ahora se prueban las dos y gana la que encuentra el pago. De paso queda dicho
 * de qué cuenta es cada uno, que es el dato que separa «hay que devolver
 * $36.952» de «era de prueba, no hay nada afuera».
 */
const TOKENS = [
  { nombre: 'producción', token: env.MP_ACCESS_TOKEN },
  { nombre: 'prueba', token: env.MP_TEST_ACCESS_TOKEN },
].filter(t => t.token)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n  ✗ Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY.\n')
  exit(1)
}
if (TOKENS.length === 0) {
  console.error('\n  ✗ Falta MP_ACCESS_TOKEN y MP_TEST_ACCESS_TOKEN: sin ninguno de los dos')
  console.error('    no se puede verificar si la plata volvió.\n')
  exit(1)
}

/** Las cuentas de cada token, para poder decir si un pago fue de prueba. */
const CUENTAS = new Map()
for (const { nombre, token } of TOKENS) {
  try {
    const r = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) continue
    /** @type {any} */
    const u = await r.json()
    CUENTAS.set(u.id, { nombre, esDePrueba: (u.tags || []).includes('test_user') })
  } catch {
    // Sin red se sigue: abajo cada pago que no se pueda consultar se trata como
    // no devuelto, que es el lado seguro.
  }
}

const db = async (ruta, opciones = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
  })
  if (!res.ok) throw new Error(`${ruta} → ${res.status} ${await res.text()}`)
  // `json()` viene como `unknown` en los tipos de Node. Acá siempre es una
  // lista de filas de PostgREST, y anotarlo es lo que deja chequear el resto.
  return res.status === 204 ? [] : /** @type {Promise<any[]>} */ (res.json())
}

const pesos = n => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })

/* ── Qué base es ésta ────────────────────────────────────────────────────── */

const esLocal = /127\.0\.0\.1|localhost/.test(SUPABASE_URL)
console.log(`\n  Base: ${SUPABASE_URL}  ${esLocal ? '(LOCAL)' : '⚠  (LA NUBE — es la de producción)'}`)
console.log(`  Mail de prueba: ${MAIL_DE_PRUEBA}`)
console.log(`  Modo: ${BORRAR ? '⚠  BORRAR' : 'simulacro (no toca nada)'}\n`)

/* ── 1. Las órdenes de prueba ────────────────────────────────────────────── */

const ordenes = await db(
  `orders?select=id,status,buyer_name,buyer_email,quantity,unit_price_ars,mp_payment_id,created_at`
  + `&buyer_email=eq.${encodeURIComponent(MAIL_DE_PRUEBA)}&order=created_at`,
)

if (ordenes.length === 0) {
  console.log('  No hay órdenes de ese mail. No hay nada que limpiar.\n')
  exit(0)
}

console.log(`  ── ${ordenes.length} órdenes de prueba ──`)
for (const o of ordenes) {
  console.log(`   · ${o.status.padEnd(8)} | ${String(o.buyer_name).slice(0, 18).padEnd(18)}`
    + ` | ${pesos(o.unit_price_ars * o.quantity).padEnd(13)} | pago: ${o.mp_payment_id || '—'}`)
}

/* ── 2. ¿Volvió la plata? ────────────────────────────────────────────────── */

// Cualquier orden con `mp_payment_id`, no sólo las `paid`: una orden que quedó
// en `pending` porque se perdió el webhook igual puede tener el pago aprobado.
const conPago = ordenes.filter(o => o.mp_payment_id)

console.log(`\n  ── Mercado Pago: ${conPago.length} pagos a verificar ──`)

const sinDevolver = []
/** Los que SÍ movieron plata real, para no decir «volvió» de los de prueba. */
const reales = []

for (const o of conPago) {
  // Se prueban las dos cuentas y gana la que lo encuentra. Ver la nota de TOKENS.
  /** @type {any} */
  let p = null
  let ultimoError = 'no se pudo consultar'
  for (const { token } of TOKENS) {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${o.mp_payment_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    /** @type {any} */
    const cuerpo = await res.json().catch(() => ({}))
    if (res.ok && cuerpo.id) { p = cuerpo; break }
    ultimoError = cuerpo.message || `HTTP ${res.status}`
  }

  if (!p) {
    console.log(`   ? ${o.mp_payment_id} — no aparece en ninguna cuenta (${ultimoError})`)
    // No se puede verificar ⇒ se trata como "no devuelto". Preferimos no borrar
    // por las dudas antes que borrar el registro de una plata que sigue afuera.
    sinDevolver.push({ id: o.mp_payment_id, motivo: 'no aparece en ninguna cuenta' })
    continue
  }

  const cobrado = Number(p.transaction_amount || 0)
  const devuelto = Number(p.transaction_amount_refunded || 0)
  const cuenta = CUENTAS.get(p.collector_id)

  // Un pago cobrado por una cuenta de PRUEBA de Mercado Pago no movió un peso,
  // por más que `live_mode` diga true — los test users operan sobre la
  // infraestructura de producción. Lo que decide es de quién es la cuenta, y eso
  // lo dice el tag `test_user` que devuelve /users/me.
  const dePrueba = cuenta?.esDePrueba === true
  // `cancelled` es el pago que nunca llegó a acreditarse: no hay nada que
  // devolver. `refunded` con el total devuelto es el caso feliz.
  const cerrado = dePrueba || p.status === 'cancelled' || p.status === 'rejected' || devuelto >= cobrado

  const quien = cuenta ? `${cuenta.nombre}${dePrueba ? ' · de prueba' : ''}` : `cuenta ${p.collector_id}`
  console.log(`   ${cerrado ? '✓' : '✗'} ${o.mp_payment_id} | ${String(p.status).padEnd(9)}`
    + ` | ${quien.padEnd(22)} | cobrado ${pesos(cobrado)} | devuelto ${pesos(devuelto)}`)

  if (!dePrueba) reales.push(o.mp_payment_id)
  if (!cerrado) {
    sinDevolver.push({ id: o.mp_payment_id, motivo: `${pesos(cobrado - devuelto)} sin devolver` })
  }
}

if (sinDevolver.length > 0) {
  console.error(`\n  ✗ No borro nada: ${sinDevolver.length} pago(s) con plata todavía afuera.\n`)
  for (const p of sinDevolver) console.error(`      ${p.id} — ${p.motivo}`)
  console.error('\n  Devolvelos primero: en el backoffice, Ventas → «reembolsar»; o desde el')
  console.error('  panel de Mercado Pago. Después volvé a correr esto.\n')
  exit(1)
}

// Decía «toda la plata volvió», que es falso cuando los pagos eran de una cuenta
// de prueba: de ahí nunca salió nada. Se distingue, porque no es lo mismo haber
// reembolsado $147.809 que no haberlos cobrado nunca.
const dePruebaN = conPago.length - reales.length
console.log(reales.length === 0 && dePruebaN > 0
  ? `\n  ✓ Los ${dePruebaN} pagos eran de una cuenta de prueba: no hubo plata real.`
  : '\n  ✓ No queda plata afuera.')

/* ── 3. Qué se lleva puesto ──────────────────────────────────────────────── */

const ids = ordenes.map(o => o.id)
const enLista = `(${ids.map(i => `"${i}"`).join(',')})`

const entradas = await db(`entradas?select=id,nombre,token&order_id=in.${enLista}`)
const checkins = entradas.length
  ? await db(`checkins?select=id,dia,por,creado_en&entrada_id=in.(${entradas.map(e => `"${e.id}"`).join(',')})`)
  : []

console.log('\n  ── Se borra ──')
console.log(`   · ${checkins.length} checkins`)
console.log(`   · ${entradas.length} entradas  (sus QR dejan de funcionar)`)
console.log(`   · ${ordenes.length} órdenes`)
console.log('\n  ── NO se toca ──')
console.log('   · tiers                (precio, cupo y si está a la venta)')
console.log('   · asistentes_externos  (el padrón de Luma y Startup Grind)')

if (!BORRAR) {
  console.log('\n  Simulacro. Para borrar de verdad:\n')
  console.log('      node scripts/limpiar-prueba.mjs --borrar\n')
  exit(0)
}

/* ── 4. Borrar ───────────────────────────────────────────────────────────── */

// El orden importa por las claves foráneas: checkins cuelga de entradas, y
// entradas de orders. Al revés, Postgres lo rechaza.
console.log('\n  Borrando…')

if (checkins.length) {
  const r = await db(`checkins?entrada_id=in.(${entradas.map(e => `"${e.id}"`).join(',')})`, {
    method: 'DELETE', headers: { Prefer: 'return=representation' },
  })
  console.log(`   ✓ ${r.length} checkins`)
}

if (entradas.length) {
  const r = await db(`entradas?order_id=in.${enLista}`, {
    method: 'DELETE', headers: { Prefer: 'return=representation' },
  })
  console.log(`   ✓ ${r.length} entradas`)
}

const r = await db(`orders?id=in.${enLista}`, {
  method: 'DELETE', headers: { Prefer: 'return=representation' },
})
console.log(`   ✓ ${r.length} órdenes`)

/* ── 5. Cómo quedó ───────────────────────────────────────────────────────── */

const contar = async tabla => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?select=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'count=exact' },
  })
  return (res.headers.get('content-range') || '/?').split('/')[1]
}

console.log('\n  ── Cómo quedó la base ──')
for (const t of ['orders', 'entradas', 'checkins', 'asistentes_externos', 'tiers']) {
  console.log(`   · ${t.padEnd(20)} ${await contar(t)}`)
}
console.log('')
