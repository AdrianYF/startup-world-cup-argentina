#!/usr/bin/env node
/**
 * Importa a Supabase el CSV de asistentes de un canal externo.
 *
 *   node scripts/importar-asistentes.mjs <archivo.csv> --origen luma --evento quzhnee8
 *   node scripts/importar-asistentes.mjs <archivo.csv> --origen startupgrind --evento 31263
 *
 * Opciones:
 *   --dry                 muestra el mapeo y los estados sin escribir
 *   --dias "Jue 6"        pisa los días por defecto del canal
 *   --map estado=Status   fuerza el mapeo de una columna que no se detectó
 *
 * Las entradas del evento salen por tres lugares —Luma el miércoles, Startup
 * Grind y la venta propia el jueves y viernes— y en la puerta hace falta una
 * sola lista. La venta propia ya está en `orders`; esto trae las otras dos.
 *
 * Ninguna plataforma hace falta pagarle una API: las dos exportan CSV desde su
 * panel de organizador.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { parseCSVObjetos } from './lib/csv.mjs'

process.loadEnvFile('.env.local')

/**
 * Cada plataforma nombra las columnas y los estados a su manera. Todo lo
 * específico de un canal vive acá: sumar uno nuevo es agregar una entrada.
 */
const CANALES = {
  luma: {
    dias: 'Mié 5',
    columnas: {
      externo_id: ['api_id', 'guest_api_id', 'id'],
      nombre: ['name', 'full_name', 'nombre'],
      email: ['email', 'email_address'],
      estado: ['approval_status', 'status'],
      ticket: ['ticket_name', 'ticket_type'],
      registrado_en: ['created_at', 'registered_at'],
      checkin_en: ['checked_in_at', 'checkin_at'],
    },
    confirmado: ['approved', 'going', 'attending'],
    rechazado: ['declined', 'rejected', 'cancelled', 'canceled'],
  },
  startupgrind: {
    dias: 'Jue 6 + Vie 7',
    columnas: {
      externo_id: ['order_id', 'order', 'ticket_id', 'id'],
      // Startup Grind exporta nombre y apellido por separado; si no hay una
      // columna de nombre completo, se arma más abajo con first + last.
      nombre: ['name', 'full_name', 'attendee_name'],
      email: ['email', 'email_address', 'attendee_email'],
      estado: ['status', 'order_status', 'payment_status'],
      ticket: ['ticket_type', 'ticket', 'ticket_name'],
      registrado_en: ['order_date', 'created', 'created_at', 'purchase_date'],
      checkin_en: ['checked_in', 'checkin_date', 'checked_in_at'],
    },
    confirmado: ['completed', 'complete', 'paid', 'confirmed', 'attending', 'active'],
    rechazado: ['refunded', 'cancelled', 'canceled', 'failed', 'declined'],
  },
}

const NOMBRE_PARTIDO = {
  nombre: ['first_name', 'firstname', 'given_name'],
  apellido: ['last_name', 'lastname', 'surname', 'family_name'],
}

const norm = s => s.toLowerCase().replace(/[\s-]+/g, '_')

function detectar(columnas, alias, forzado) {
  const porNombre = new Map(columnas.map(c => [norm(c), c]))
  const mapa = {}
  for (const [destino, nombres] of Object.entries(alias)) {
    if (forzado[destino]) {
      const real = porNombre.get(norm(forzado[destino]))
      if (!real) {
        console.error(`  ✗ --map ${destino}=${forzado[destino]}: esa columna no está en el archivo`)
        process.exit(1)
      }
      mapa[destino] = real
      continue
    }
    const hit = nombres.find(a => porNombre.has(a))
    if (hit) mapa[destino] = porNombre.get(hit)
  }
  // Nombre partido en dos columnas.
  if (!mapa.nombre) {
    const n = NOMBRE_PARTIDO.nombre.find(a => porNombre.has(a))
    const ap = NOMBRE_PARTIDO.apellido.find(a => porNombre.has(a))
    if (n) mapa._nombre = porNombre.get(n)
    if (ap) mapa._apellido = porNombre.get(ap)
  }
  return mapa
}

function fecha(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Traduce el estado de la plataforma al vocabulario único de la vista. */
function normalizarEstado(valor, canal) {
  const v = (valor || '').toLowerCase().trim()
  // Sin columna de estado, todo lo exportado se toma por bueno: varias
  // plataformas sólo dejan exportar las órdenes ya completadas.
  if (!v) return 'confirmado'
  if (canal.confirmado.some(x => v.includes(x))) return 'confirmado'
  if (canal.rechazado.some(x => v.includes(x))) return 'rechazado'
  return 'pendiente'
}

/* ---------- args ---------- */
const args = process.argv.slice(2)
const flag = n => {
  const i = args.findIndex(a => a === `--${n}` || a.startsWith(`--${n}=`))
  if (i < 0) return null
  const a = args[i]
  return a.includes('=') ? a.split('=').slice(1).join('=') : args[i + 1]
}
const archivo = args.find(a => !a.startsWith('--') && !args.some((x, i) =>
  x.startsWith('--') && !x.includes('=') && args[i + 1] === a))
const dry = args.includes('--dry')
const origen = (flag('origen') || 'luma').toLowerCase()
const evento = flag('evento')
const diasFlag = flag('dias')
// --map campo=Columna, repetible.
const forzado = Object.fromEntries(
  args
    .filter(a => a.startsWith('--map'))
    .map(a => (a.includes('=') ? a.split('=').slice(1).join('=') : args[args.indexOf(a) + 1]))
    .filter(Boolean)
    .map(v => {
      const i = v.indexOf('=')
      return i < 0 ? null : [v.slice(0, i), v.slice(i + 1)]
    })
    .filter(Boolean),
)

if (!archivo || !evento) {
  console.error(`
  Uso: node scripts/importar-asistentes.mjs <archivo.csv> --origen <canal> --evento <id>

    --origen   ${Object.keys(CANALES).join(' | ')}
    --evento   slug de Luma (quzhnee8) o id de Startup Grind (31263)
    --dias     pisa los días por defecto del canal
    --map      fuerza una columna, ej: --map estado=Order\\ Status
    --dry      no escribe
`)
  process.exit(1)
}

const canal = CANALES[origen]
if (!canal) {
  console.error(`  ✗ Canal desconocido "${origen}". Conocidos: ${Object.keys(CANALES).join(', ')}`)
  process.exit(1)
}

const { columnas, filas } = parseCSVObjetos(readFileSync(archivo, 'utf8'))
if (!filas.length) {
  console.error('  ✗ El CSV no tiene filas.')
  process.exit(1)
}

const mapa = detectar(columnas, canal.columnas, forzado)
const dias = diasFlag || canal.dias

console.log(`\n  archivo   ${archivo}`)
console.log(`  origen    ${origen}`)
console.log(`  evento    ${evento}`)
console.log(`  días      ${dias}`)
console.log(`  filas     ${filas.length}  ·  columnas ${columnas.length}\n`)
console.log('  mapeo detectado:')
for (const destino of Object.keys(canal.columnas)) {
  let de = mapa[destino]
  if (destino === 'nombre' && !de && (mapa._nombre || mapa._apellido)) {
    de = [mapa._nombre, mapa._apellido].filter(Boolean).join(' + ')
  }
  console.log(`    ${destino.padEnd(14)} ← ${de || '(no encontrada)'}`)
}

if (!mapa.email) {
  console.error(`\n  ✗ No se encontró la columna de email, que es la única imprescindible.`)
  console.error(`    Columnas del archivo: ${columnas.join(', ')}`)
  console.error(`    Podés forzarla:  --map email="<nombre exacto>"`)
  process.exit(1)
}

const mapeadas = new Set(Object.values(mapa))
const porEmail = new Map()
let sinEmail = 0

for (const f of filas) {
  const email = (f[mapa.email] || '').toLowerCase().trim()
  if (!email) { sinEmail++; continue }

  const nombre = mapa.nombre
    ? f[mapa.nombre]
    : [mapa._nombre && f[mapa._nombre], mapa._apellido && f[mapa._apellido]]
        .filter(Boolean).join(' ').trim()

  porEmail.set(email, {
    origen,
    evento,
    email,
    dias,
    externo_id: mapa.externo_id ? f[mapa.externo_id] || null : null,
    nombre: nombre || null,
    estado: mapa.estado ? f[mapa.estado] || null : null,
    estado_norm: normalizarEstado(mapa.estado ? f[mapa.estado] : '', canal),
    ticket: mapa.ticket ? f[mapa.ticket] || null : null,
    registrado_en: mapa.registrado_en ? fecha(f[mapa.registrado_en]) : null,
    checkin_en: mapa.checkin_en ? fecha(f[mapa.checkin_en]) : null,
    // Todo lo que no se mapeó, incluidas las preguntas custom del evento.
    extra: Object.fromEntries(
      Object.entries(f).filter(([k, v]) => !mapeadas.has(k) && v !== ''),
    ),
  })
}

const registros = [...porEmail.values()]
const cuenta = registros.reduce((a, r) => {
  const k = `${r.estado_norm}  (${r.estado || 'sin columna de estado'})`
  a[k] = (a[k] || 0) + 1
  return a
}, {})

console.log('\n  estados:')
for (const [k, n] of Object.entries(cuenta).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(4)}  ${k}`)
}
const confirmados = registros.filter(r => r.estado_norm === 'confirmado').length
console.log(`\n  → ${confirmados} de ${registros.length} entran a la lista de la puerta`)
if (sinEmail) console.log(`  → ${sinEmail} fila(s) sin email: se saltean`)
const repetidos = filas.length - registros.length - sinEmail
if (repetidos > 0) console.log(`  → ${repetidos} fila(s) con email repetido: queda la última`)

if (dry) {
  console.log('\n  --dry: no se escribió nada.\n')
  process.exit(0)
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('\n  ✗ Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY en .env.local')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })
const { error } = await db
  .from('asistentes_externos')
  .upsert(registros, { onConflict: 'origen,evento,email' })

if (error) {
  console.error('\n  ✗ Falló la escritura:', error.message)
  process.exit(1)
}

console.log(`\n  ✓ ${registros.length} asistentes importados (${origen} / ${evento})\n`)
