#!/usr/bin/env node
/**
 * Importa a Supabase el CSV de asistentes de un canal externo.
 *
 *   node scripts/importar-asistentes.mjs <archivo.csv> --origen luma --evento quzhnee8 --dias "Jue 6"
 *   node scripts/importar-asistentes.mjs <archivo.csv> --origen startupgrind --evento 31263
 *
 * Opciones:
 *   --dry                 muestra el mapeo y los estados sin escribir
 *   --dias "Jue 6"        qué días habilita esta tanda (obligatorio en Luma)
 *   --map estado=Status   fuerza el mapeo de una columna que no se detectó
 *
 * Las entradas del evento salen por tres lugares —Luma el miércoles, Startup
 * Grind y la venta propia el jueves y viernes— y en la puerta hace falta una
 * sola lista. La venta propia ya está en `orders`; esto trae las otras dos.
 *
 * Ninguna plataforma hace falta pagarle una API: las dos exportan CSV desde su
 * panel de organizador.
 *
 * La lógica de verdad —qué columna es cuál, cómo se traduce cada estado— vive
 * en `api/_lib/importar.js`, compartida con la sección Importar del backoffice:
 * el CSV tiene que entrar igual desde la terminal que desde el navegador.
 */
import { readFileSync } from 'node:fs'
import { CANALES, importar } from '../api/_lib/importar.js'

process.loadEnvFile('.env.local')

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
const seco = args.includes('--dry')
const origen = (flag('origen') || 'luma').toLowerCase()
const evento = flag('evento')
const dias = flag('dias')
// Etiqueta fija de entrada, para el canal que no la exporta útil: Luma manda
// "Standard" en TODAS sus listas, así que sin esto los invitados VIP y los de
// cortesía llegan a la puerta con el mismo cartel.
const ticket = flag('ticket')
/**
 * --map campo=Columna, repetible.
 *
 * Se recorre por índice y no con `indexOf`: los `--map` son todos el mismo
 * string, así que `indexOf` devolvía SIEMPRE el primero y los cuatro mapeos de
 * un archivo terminaban valiendo el mismo. No fallaba nada — el resumen decía
 * "(no encontrada)" y el import seguía sin la mitad de las columnas.
 */
const forzado = Object.fromEntries(
  args.flatMap((a, i) => {
    if (!a.startsWith('--map')) return []
    const v = a.includes('=') ? a.slice(a.indexOf('=') + 1) : args[i + 1]
    const corte = (v || '').indexOf('=')
    return corte < 0 ? [] : [[v.slice(0, corte), v.slice(corte + 1)]]
  }),
)

if (!archivo || !evento) {
  console.error(`
  Uso: node scripts/importar-asistentes.mjs <archivo.csv> --origen <canal> --evento <id>

    --origen   ${Object.keys(CANALES).join(' | ')}
    --evento   slug de Luma (quzhnee8) o id de Startup Grind (31263)
    --dias     qué días habilita: "Mié 5", "Jue 6", "Vie 7" o su suma con " + ".
               Obligatorio en Luma, que corre un evento por día.
    --ticket   etiqueta fija de entrada, en vez de la columna del archivo.
               Para Luma, que exporta "Standard" en todas sus listas.
    --map      fuerza una columna, ej: --map estado=Order\\ Status
    --dry      no escribe
`)
  process.exit(1)
}

if (!seco) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('\n  ✗ Faltan SUPABASE_URL y/o SUPABASE_SECRET_KEY en .env.local')
    process.exit(1)
  }
}

const r = await importar({
  csv: readFileSync(archivo, 'utf8'),
  origen,
  evento,
  dias,
  ticket,
  seco,
  forzado,
})

if (r.error) {
  console.error(`\n  ✗ ${r.error}`)
  if (r.columnas) console.error(`    Columnas del archivo: ${r.columnas.join(', ')}`)
  process.exit(1)
}

console.log(`\n  archivo   ${archivo}`)
console.log(`  origen    ${origen}`)
console.log(`  evento    ${evento}`)
console.log(`  días      ${r.dias}`)
console.log(`  filas     ${r.resumen.filas}  ·  columnas ${r.columnas.length}\n`)
console.log('  mapeo detectado:')
for (const destino of Object.keys(CANALES[origen].columnas)) {
  let de = r.mapa[destino]
  if (destino === 'nombre' && !de && (r.mapa._nombre || r.mapa._apellido)) {
    de = [r.mapa._nombre, r.mapa._apellido].filter(Boolean).join(' + ')
  }
  console.log(`    ${destino.padEnd(14)} ← ${de || '(no encontrada)'}`)
}

console.log('\n  estados:')
console.log(`    ${String(r.resumen.confirmados).padStart(4)}  confirmado`)
console.log(`    ${String(r.resumen.pendientes).padStart(4)}  pendiente`)
console.log(`    ${String(r.resumen.rechazados).padStart(4)}  rechazado`)

console.log(`\n  → ${r.resumen.confirmados} de ${r.resumen.registros} entran a la lista de la puerta`)
if (r.resumen.sinEmail) console.log(`  → ${r.resumen.sinEmail} fila(s) sin email: se saltean`)
if (r.resumen.repetidos) console.log(`  → ${r.resumen.repetidos} fila(s) con email repetido: queda la última`)

if (!r.escrito) {
  console.log('\n  --dry: no se escribió nada.\n')
  process.exit(0)
}

console.log(`\n  ✓ ${r.resumen.registros} asistentes importados (${origen} / ${evento})\n`)
