#!/usr/bin/env node
/**
 * La lista de acreditación, con los dos canales juntos.
 *
 *   node scripts/lista-puerta.mjs              # tabla en pantalla
 *   node scripts/lista-puerta.mjs --csv        # CSV a stdout
 *   node scripts/lista-puerta.mjs --dia mie    # sólo un día (mie|jue|vie)
 *
 * Sale de la vista `acreditacion`: los `orders` pagados de la venta propia más
 * los aprobados de Luma. Ordena por apellido para buscar rápido en la puerta.
 */
import { createClient } from '@supabase/supabase-js'
import { aCSV } from './lib/csv.mjs'

process.loadEnvFile('.env.local')

const args = process.argv.slice(2)
const comoCSV = args.includes('--csv')
const dia = args.find(a => a.startsWith('--dia='))?.split('=')[1]
  || (args.includes('--dia') ? args[args.indexOf('--dia') + 1] : null)

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY en .env.local')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await db.from('acreditacion').select('*')
if (error) {
  console.error('No se pudo leer la lista:', error.message)
  process.exit(1)
}

const DIAS = { mie: 'Mié', jue: 'Jue', vie: 'Vie' }
let filas = data || []
if (dia) {
  const buscado = DIAS[dia.toLowerCase()]
  if (!buscado) {
    console.error(`--dia tiene que ser mie, jue o vie (recibí "${dia}")`)
    process.exit(1)
  }
  filas = filas.filter(f => (f.dias || '').includes(buscado))
}

// Por apellido: en la puerta la gente dice el apellido, no el nombre.
const apellido = n => (n || '').trim().split(/\s+/).slice(-1)[0].toLowerCase()
filas.sort((a, b) => apellido(a.nombre).localeCompare(apellido(b.nombre), 'es'))

if (comoCSV) {
  const cols = ['nombre', 'email', 'entrada', 'dias', 'cantidad', 'documento', 'origen', 'usada_en']
  console.log(aCSV(cols, filas))
  process.exit(0)
}

if (!filas.length) {
  console.log('\n  La lista está vacía.\n')
  console.log('  · Venta propia: se llena sola con cada compra aprobada.')
  console.log('  · Luma: node scripts/importar-luma.mjs <archivo.csv> --evento <slug>\n')
  process.exit(0)
}

const w = (s, n) => String(s ?? '').slice(0, n).padEnd(n)
console.log('')
console.log(`  ${w('NOMBRE', 26)}${w('EMAIL', 30)}${w('ENTRADA', 16)}${w('DÍAS', 14)}${w('ORIGEN', 7)}`)
console.log(`  ${'─'.repeat(93)}`)
for (const f of filas) {
  const usada = f.usada_en ? ' ✓' : ''
  console.log(`  ${w(f.nombre, 26)}${w(f.email, 30)}${w(f.entrada, 16)}${w(f.dias, 14)}${w(f.origen, 7)}${usada}`)
}

const porOrigen = filas.reduce((a, f) => ({ ...a, [f.origen]: (a[f.origen] || 0) + 1 }), {})
const entradas = filas.reduce((n, f) => n + (f.cantidad || 1), 0)
console.log(`  ${'─'.repeat(93)}`)
console.log(`  ${filas.length} personas · ${entradas} entradas · ` +
  Object.entries(porOrigen).map(([k, v]) => `${k}: ${v}`).join(' · '))

// Quien viene por los dos canales aparece dos veces a propósito (son días
// distintos), pero conviene saberlo para no contarlo dos veces.
const { data: ambos } = await db.from('acreditacion_ambos_canales').select('*')
if (ambos?.length) {
  console.log(`\n  ${ambos.length} en los dos canales (misma persona, días distintos):`)
  for (const p of ambos) console.log(`    ${w(p.nombre, 26)}${p.email}`)
}
console.log('')
