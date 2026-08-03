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
const MP_TOKEN = env.MP_ACCESS_TOKEN

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n  ✗ Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY.\n')
  exit(1)
}
if (!MP_TOKEN) {
  console.error('\n  ✗ Falta MP_ACCESS_TOKEN: sin eso no se puede verificar si la plata volvió.\n')
  exit(1)
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

for (const o of conPago) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${o.mp_payment_id}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  })
  /** @type {any} */
  const p = await res.json()

  if (!res.ok) {
    console.log(`   ? ${o.mp_payment_id} — no se pudo consultar (${p.message || res.status})`)
    // No se puede verificar ⇒ se trata como "no devuelto". Preferimos no borrar
    // por las dudas antes que borrar el registro de una plata que sigue afuera.
    sinDevolver.push({ id: o.mp_payment_id, motivo: 'no se pudo consultar' })
    continue
  }

  const cobrado = Number(p.transaction_amount || 0)
  const devuelto = Number(p.transaction_amount_refunded || 0)
  // `cancelled` es el pago que nunca llegó a acreditarse: no hay nada que
  // devolver. `refunded` con el total devuelto es el caso feliz.
  const cerrado = p.status === 'cancelled' || p.status === 'rejected' || devuelto >= cobrado

  console.log(`   ${cerrado ? '✓' : '✗'} ${o.mp_payment_id} | ${String(p.status).padEnd(9)}`
    + ` | cobrado ${pesos(cobrado)} | devuelto ${pesos(devuelto)}`)

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

console.log('\n  ✓ Toda la plata volvió.')

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
