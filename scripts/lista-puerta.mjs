#!/usr/bin/env node
/**
 * La lista de acreditación, con los tres canales juntos.
 *
 *   node scripts/lista-puerta.mjs              # tabla en pantalla
 *   node scripts/lista-puerta.mjs --csv        # CSV a stdout
 *   node scripts/lista-puerta.mjs --dia mie    # sólo un día (mie|jue|vie)
 *
 * Sale de la vista `acreditacion`: los `orders` pagados de la venta propia más
 * los confirmados de Luma y Startup Grind. Ordena por apellido, que es lo que
 * la gente dice en la puerta.
 */
import { createClient } from '@supabase/supabase-js'
import { aCSV } from './lib/csv.mjs'
// Los días del evento salen del mismo lado que los usa la app de la puerta: si
// se corrige una fecha, se corrige en un solo archivo.
import { dia as buscarDia, habilitaDia, DIAS } from '../api/_lib/puerta.js'

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

let filas = data || []
if (dia) {
  const elegido = buscarDia(dia)
  if (!elegido) {
    console.error(`--dia tiene que ser ${DIAS.map(d => d.id).join(', ')} (recibí "${dia}")`)
    process.exit(1)
  }
  filas = filas.filter(f => habilitaDia(f.dias, elegido.label))
}

// Por apellido: en la puerta la gente dice el apellido, no el nombre.
const apellido = n => (n || '').trim().split(/\s+/).slice(-1)[0].toLowerCase()
filas.sort((a, b) => apellido(a.nombre).localeCompare(apellido(b.nombre), 'es'))

if (comoCSV) {
  const cols = ['nombre', 'email', 'telefono', 'empresa', 'entrada', 'dias', 'origen', 'usada_en']
  console.log(aCSV(cols, filas))
  process.exit(0)
}

if (!filas.length) {
  console.log('\n  La lista está vacía.\n')
  console.log('  · Venta propia: se llena sola con cada compra aprobada.')
  console.log('  · Luma / Startup Grind: node scripts/importar-asistentes.mjs <csv> --origen <canal> --evento <id>\n')
  process.exit(0)
}

// Anchos calculados sobre los datos reales: "startupgrind" y los nombres de
// tanda largos se cortaban con anchos fijos.
const w = (s, n) => String(s ?? '').slice(0, n).padEnd(n)
const ancho = (campo, min) =>
  Math.max(min, ...filas.map(f => String(f[campo] ?? '').length))

const cN = Math.min(ancho('nombre', 6), 26) + 2
const cE = Math.min(ancho('email', 5), 30) + 2
const cF = Math.min(ancho('telefono', 8), 16) + 2
const cC = Math.min(ancho('empresa', 7), 18) + 2
const cT = Math.min(ancho('entrada', 7), 24) + 2
const cD = ancho('dias', 4) + 2
const cO = ancho('origen', 6) + 2
const raya = '─'.repeat(cN + cE + cF + cC + cT + cD + cO)

console.log('')
console.log(`  ${w('NOMBRE', cN)}${w('EMAIL', cE)}${w('TELÉFONO', cF)}${w('EMPRESA', cC)}${w('ENTRADA', cT)}${w('DÍAS', cD)}${w('ORIGEN', cO)}`)
console.log(`  ${raya}`)
for (const f of filas) {
  const usada = f.usada_en ? '✓ usada' : ''
  console.log(`  ${w(f.nombre, cN)}${w(f.email, cE)}${w(f.telefono, cF)}${w(f.empresa, cC)}${w(f.entrada, cT)}${w(f.dias, cD)}${w(f.origen, cO)}${usada}`)
}

// Una fila es una persona, así que filas = entradas. Antes no: la venta propia
// traía una sola fila por compra, con su cantidad al costado.
const porOrigen = filas.reduce((a, f) => ({ ...a, [f.origen]: (a[f.origen] || 0) + 1 }), {})
console.log(`  ${raya}`)
console.log(`  ${filas.length} personas · ` +
  Object.entries(porOrigen).sort().map(([k, v]) => `${k}: ${v}`).join(' · '))

// La misma persona puede estar en varios canales: en Luma por el side event del
// miércoles y en Startup Grind o la web por el evento principal. Aparece una vez
// por canal a propósito (son días distintos), pero conviene tenerlo a la vista
// para no contar dos veces la cabeza — y para detectar a quien pagó dos veces la
// misma entrada, ahora que Startup Grind y la web venden lo mismo.
const { data: ambos } = await db.from('acreditacion_ambos_canales').select('*')
if (ambos?.length) {
  console.log(`\n  ${ambos.length} en más de un canal:`)
  for (const p of ambos) {
    console.log(`    ${w(p.nombre, cN)}${w(p.email, cE)}${p.origenes}`)
  }
  const dobles = ambos.filter(p => (p.origenes || '').includes('startupgrind') && (p.origenes || '').includes('web'))
  if (dobles.length) {
    console.log(`\n  ⚠ ${dobles.length} pagó la MISMA entrada en Startup Grind y en la web — revisar reembolso.`)
  }
}
console.log('')
