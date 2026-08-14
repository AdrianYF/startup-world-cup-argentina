#!/usr/bin/env node
/**
 * Las dos listas del evento, en CSV.
 *
 *   node scripts/exportar-listas.mjs                 # a ./exportes/
 *   node scripts/exportar-listas.mjs --salida ~/csv  # a otra carpeta
 *
 * Salen dos archivos con las MISMAS columnas, para que se puedan comparar fila
 * a fila y pegar uno debajo del otro:
 *
 *   participantes.csv       el padrón entero — todo el que sacó entrada
 *   asistentes-reales.csv   sólo los que efectivamente entraron
 *
 * La diferencia entre los dos es el no-show, que es el número que se pide
 * después del evento y el que nadie tiene anotado en ningún lado.
 *
 * Los dos llevan columna `vip`. Es lo otro que se pregunta siempre —los
 * sponsors quieren saber a cuántos VIP tocaron— y hasta ahora había que
 * deducirlo mirando el texto de `entrada` a ojo.
 *
 * Sale de la vista `acreditacion` (los tres canales juntos) y de `checkins`,
 * igual que `scripts/lista-puerta.mjs` y que la sección Métricas del
 * backoffice: si las tres leyeran distinto, darían números distintos.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { aCSV } from '../api/_lib/csv.js'
// Los días del evento salen del mismo archivo que usa la app de la puerta: si
// se corrige una fecha, se corrige en un solo lugar.
import { DIAS } from '../api/_lib/puerta.js'

// Igual que `prueba-produccion.mjs`: el archivo puede no estar y las variables
// venir del ambiente. Si tampoco están ahí, el chequeo de abajo lo dice con
// nombre y apellido en vez de tirar un ENOENT.
try { process.loadEnvFile('.env.local') } catch { /* puede venir del ambiente */ }

/* ---------- args ---------- */
const args = process.argv.slice(2)
const flag = n => {
  const i = args.findIndex(a => a === `--${n}` || a.startsWith(`--${n}=`))
  if (i < 0) return null
  const a = args[i]
  return a.includes('=') ? a.split('=').slice(1).join('=') : args[i + 1]
}
const salida = flag('salida') || 'exportes'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('\n  ✗ Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY en .env.local\n')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

const [{ data: padron, error }, { data: ingresos, error: errIngresos }] = await Promise.all([
  db.from('acreditacion').select('*'),
  // Los anulados NO cuentan: deshacer en la puerta deja la fila para poder
  // reconstruir qué pasó, pero esa persona no entró.
  db.from('checkins').select('dia, entrada_id, externo_id, creado_en').is('anulado_en', null),
])
if (error) {
  console.error('No se pudo leer el padrón:', error.message)
  process.exit(1)
}
if (errIngresos) {
  console.error('No se pudieron leer los ingresos:', errIngresos.message)
  process.exit(1)
}

/* ---------- quién entró, y qué días ---------- */

// `entrada_id` para la venta propia, `externo_id` para los canales externos:
// los dos apuntan a `acreditacion.id`. Es el mismo cruce que hace `cruzarDias`
// en `api/_lib/admin.js`.
const diasPorPersona = new Map()
const primerIngreso = new Map()
for (const c of ingresos || []) {
  const ref = c.entrada_id || c.externo_id
  if (!ref) continue
  if (!diasPorPersona.has(ref)) diasPorPersona.set(ref, new Set())
  diasPorPersona.get(ref).add(c.dia)

  const previo = primerIngreso.get(ref)
  if (!previo || c.creado_en < previo) primerIngreso.set(ref, c.creado_en)
}

/**
 * VIP se deduce del texto de `entrada`, que es lo único que hay.
 *
 * En la venta propia es exacto: la vista `acreditacion` traduce `tier_id = 'vip'`
 * a 'Entrada VIP'. En Luma y Startup Grind el nombre del ticket es texto libre
 * que escribió quien armó el evento allá ('VIP Pass', 'Entrada VIP', 'vip'), así
 * que la búsqueda es sin acentos ni mayúsculas y por subcadena. El resumen de
 * abajo imprime qué nombres de entrada quedaron marcados, que es la única forma
 * de verificar que el criterio no se comió ni se dejó ninguno.
 */
const esVIP = entrada => /\bvip\b/i.test(String(entrada || ''))

const sn = v => (v ? 'sí' : 'no')

/** El horario en Buenos Aires, que es donde pasó el evento. */
const fecha = iso => (iso
  ? new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  : '')

const filas = (padron || []).map(f => {
  const vistos = diasPorPersona.get(f.id) || new Set()
  return {
    nombre: f.nombre || '',
    email: f.email || '',
    telefono: f.telefono || '',
    empresa: f.empresa || '',
    entrada: f.entrada || '',
    vip: sn(esVIP(f.entrada)),
    dias: f.dias || '',
    origen: f.origen,
    registrado_en: fecha(f.registrado_en),
    entro: sn(vistos.size > 0),
    dias_presente: vistos.size,
    // Una columna por día del evento: sin esto, "cuántos vinieron el viernes"
    // vuelve a ser una consulta a la base.
    ...Object.fromEntries(DIAS.map(d => [`presente_${d.id}`, sn(vistos.has(d.fecha))])),
    primer_ingreso: fecha(primerIngreso.get(f.id)),
  }
})

// Por apellido, igual que la lista de la puerta: es como se busca a la gente.
const apellido = n => (n || '').trim().split(/\s+/).slice(-1)[0].toLowerCase()
filas.sort((a, b) => apellido(a.nombre).localeCompare(apellido(b.nombre), 'es'))

const COLUMNAS = [
  'nombre', 'email', 'telefono', 'empresa', 'entrada', 'vip', 'dias', 'origen',
  'registrado_en', 'entro', 'dias_presente',
  ...DIAS.map(d => `presente_${d.id}`),
  'primer_ingreso',
]

const asistieron = filas.filter(f => f.entro === 'sí')

mkdirSync(salida, { recursive: true })
const archivos = [
  { archivo: 'participantes.csv', datos: filas },
  { archivo: 'asistentes-reales.csv', datos: asistieron },
]
for (const { archivo, datos } of archivos) {
  // Con BOM: sin él, Excel en Windows abre "Muñoz" como "MuÃ±oz". `parseCSV` lo
  // saca al leer, así que un archivo que sale de acá vuelve a entrar por el
  // importador sin tocarlo.
  writeFileSync(join(salida, archivo), '﻿' + aCSV(COLUMNAS, datos) + '\n', 'utf8')
}

/* ---------- resumen ---------- */

const cuenta = (xs, clave) => [...xs.reduce((m, x) => {
  const k = clave(x)
  return m.set(k, (m.get(k) || 0) + 1)
}, new Map())].sort((a, b) => b[1] - a[1])

const vip = filas.filter(f => f.vip === 'sí')
const vipEntraron = vip.filter(f => f.entro === 'sí').length
const tasa = (a, b) => (b ? ` (${Math.round((a / b) * 100)}%)` : '')

console.log('')
for (const { archivo, datos } of archivos) {
  console.log(`  ${join(salida, archivo).padEnd(34)}${String(datos.length).padStart(4)} filas`)
}
console.log('')
console.log(`  Participantes  ${filas.length}`)
console.log(`  Asistieron     ${asistieron.length}${tasa(asistieron.length, filas.length)}`)
console.log(`  No-show        ${filas.length - asistieron.length}`)
console.log(`  VIP            ${vip.length} — entraron ${vipEntraron}${tasa(vipEntraron, vip.length)}`)
console.log('')

for (const d of DIAS) {
  const n = filas.filter(f => f[`presente_${d.id}`] === 'sí').length
  console.log(`  ${d.nombre.padEnd(14)}${n}`)
}

console.log('\n  Por canal:')
for (const [canal, total] of cuenta(filas, f => f.origen)) {
  const entraron = filas.filter(f => f.origen === canal && f.entro === 'sí').length
  console.log(`    ${canal.padEnd(14)}${String(total).padStart(4)} · entraron ${entraron}${tasa(entraron, total)}`)
}

// Qué nombres de entrada quedaron de un lado y del otro del criterio VIP. Es
// para leerlo, no para decorar: si un canal externo llamó "Premium" a su VIP,
// acá se ve que quedó afuera y se corrige el regex de `esVIP`.
console.log('\n  Entradas marcadas VIP:')
const nombresVIP = cuenta(vip, f => f.entrada)
if (!nombresVIP.length) console.log('    (ninguna)')
for (const [entrada, total] of nombresVIP) console.log(`    ${entrada} — ${total}`)

console.log('\n  Entradas NO marcadas VIP:')
for (const [entrada, total] of cuenta(filas.filter(f => f.vip === 'no'), f => f.entrada)) {
  console.log(`    ${entrada} — ${total}`)
}

// La misma persona puede estar en dos canales (Luma por el side event del
// miércoles, la web por el evento principal). Son dos entradas de verdad, así
// que van dos filas — pero contar cabezas sumando filas daría de más.
const porMail = new Map()
for (const f of filas) {
  if (!f.email) continue
  porMail.set(f.email, (porMail.get(f.email) || 0) + 1)
}
const repetidos = [...porMail.values()].filter(n => n > 1).length
if (repetidos) {
  console.log(`\n  ⚠ ${repetidos} mails aparecen en más de una fila (misma persona, varios canales o varias entradas).`)
  console.log('    Las filas son entradas, no personas: para contar cabezas, deduplicar por email.')
}
console.log('')
