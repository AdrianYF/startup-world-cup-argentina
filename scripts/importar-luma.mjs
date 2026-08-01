#!/usr/bin/env node
/**
 * Importa a Supabase el CSV de invitados que exporta Luma.
 *
 *   node scripts/importar-luma.mjs <archivo.csv> [--evento quzhnee8] [--dry]
 *
 * El CSV se baja del panel de Luma: evento → pestaña Guests → ícono Download.
 * Si filtrás la lista antes de bajarla, te deja exportar sólo lo filtrado.
 *
 * Reimportar el mismo archivo actualiza en vez de duplicar (unique evento+email).
 *
 * Las columnas se detectan por nombre y sin distinguir mayúsculas, porque Luma
 * las cambia entre versiones y cada evento suma las suyas. Lo que no se mapea
 * igual se guarda entero en `extra`, así nunca se pierde nada del archivo.
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseCSVObjetos } from './lib/csv.mjs'

process.loadEnvFile('.env.local')

// Alias conocidos de Luma, en orden de preferencia.
const CAMPOS = {
  luma_id: ['api_id', 'guest_api_id', 'id'],
  nombre: ['name', 'full_name', 'nombre'],
  email: ['email', 'email_address', 'correo'],
  estado: ['approval_status', 'status', 'estado'],
  ticket: ['ticket_name', 'ticket_type', 'ticket'],
  registrado_en: ['created_at', 'registered_at', 'registration_date'],
  checkin_en: ['checked_in_at', 'check_in_date', 'checkin_at'],
}

function detectar(columnas) {
  const porNombre = new Map(columnas.map(c => [c.toLowerCase().replace(/[\s-]+/g, '_'), c]))
  const mapa = {}
  for (const [destino, alias] of Object.entries(CAMPOS)) {
    const hit = alias.find(a => porNombre.has(a))
    if (hit) mapa[destino] = porNombre.get(hit)
  }
  return mapa
}

/** Las fechas de Luma vienen ISO; se toleran vacíos y formatos raros. */
function fecha(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const args = process.argv.slice(2)
const archivo = args.find(a => !a.startsWith('--'))
const dry = args.includes('--dry')
const evento =
  (args.find(a => a.startsWith('--evento='))?.split('=')[1]) ||
  (args.includes('--evento') ? args[args.indexOf('--evento') + 1] : null) ||
  basename(archivo || '', '.csv')

if (!archivo) {
  console.error('Uso: node scripts/importar-luma.mjs <archivo.csv> [--evento <slug>] [--dry]')
  process.exit(1)
}

const { columnas, filas } = parseCSVObjetos(readFileSync(archivo, 'utf8'))
if (!filas.length) {
  console.error('El CSV no tiene filas.')
  process.exit(1)
}

const mapa = detectar(columnas)

console.log(`\n  archivo   ${archivo}`)
console.log(`  evento    ${evento}`)
console.log(`  filas     ${filas.length}`)
console.log(`  columnas  ${columnas.length}\n`)
console.log('  mapeo detectado:')
for (const destino of Object.keys(CAMPOS)) {
  console.log(`    ${destino.padEnd(14)} ← ${mapa[destino] || '(no encontrada)'}`)
}

if (!mapa.email) {
  console.error('\n  ✗ No se encontró la columna de email, que es la única imprescindible.')
  console.error(`    Columnas del archivo: ${columnas.join(', ')}`)
  process.exit(1)
}

// Se arman las filas y se deduplica por email: Luma puede traer el mismo mail
// dos veces (registro + lista de espera) y el upsert falla si el lote repite la
// clave única. Gana el último, que es el estado más reciente.
const porEmail = new Map()
let sinEmail = 0

for (const f of filas) {
  const email = (f[mapa.email] || '').toLowerCase().trim()
  if (!email) { sinEmail++; continue }

  // Todo lo que no se mapeó va a `extra`, incluidas las preguntas custom.
  const mapeadas = new Set(Object.values(mapa))
  const extra = Object.fromEntries(
    Object.entries(f).filter(([k, v]) => !mapeadas.has(k) && v !== ''),
  )

  porEmail.set(email, {
    evento,
    email,
    luma_id: mapa.luma_id ? f[mapa.luma_id] || null : null,
    nombre: mapa.nombre ? f[mapa.nombre] || null : null,
    estado: mapa.estado ? f[mapa.estado] || null : null,
    ticket: mapa.ticket ? f[mapa.ticket] || null : null,
    registrado_en: mapa.registrado_en ? fecha(f[mapa.registrado_en]) : null,
    checkin_en: mapa.checkin_en ? fecha(f[mapa.checkin_en]) : null,
    extra,
  })
}

const registros = [...porEmail.values()]
const estados = registros.reduce((acc, r) => {
  const k = r.estado || '(sin estado)'
  acc[k] = (acc[k] || 0) + 1
  return acc
}, {})

console.log('\n  estados en el archivo:')
for (const [k, n] of Object.entries(estados).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(4)}  ${k}`)
}
if (sinEmail) console.log(`\n  ${sinEmail} fila(s) sin email: se saltean`)
if (filas.length !== registros.length + sinEmail) {
  console.log(`  ${filas.length - registros.length - sinEmail} fila(s) con email repetido: queda la última`)
}

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
  .from('asistentes_luma')
  .upsert(registros, { onConflict: 'evento,email' })

if (error) {
  console.error('\n  ✗ Falló la escritura:', error.message)
  process.exit(1)
}

console.log(`\n  ✓ ${registros.length} asistentes importados al evento "${evento}"\n`)
