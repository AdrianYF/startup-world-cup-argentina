#!/usr/bin/env node
/**
 * El dev server contra el Supabase LOCAL, sin tocar `.env.local`.
 *
 *   npm run dev:local
 *
 * `.env.local` suele apuntar al proyecto de la nube —es lo que hace falta para
 * probar Mercado Pago detrás de un túnel— y cambiarlo de ida y vuelta para
 * probar contra el Postgres de Docker es justo el tipo de paso manual que
 * termina en "me quedé sin datos, ¿a qué base estaba escribiendo?".
 *
 * Funciona porque `process.loadEnvFile()` NO pisa lo que ya está en el
 * environment: el plugin de `api/` carga `.env.local`, pero lo que se pasa por
 * acá gana.
 */
import { execSync, spawn } from 'node:child_process'

const estado = () =>
  execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

const dormir = ms => new Promise(r => setTimeout(r, ms))

/**
 * Espera a que la base esté para atender, no a que el comando termine.
 *
 * `supabase start` vuelve —o falla con «is already running»— antes de que el
 * contenedor de Postgres esté healthy, así que preguntar una sola vez pierde por
 * carrera. Lo que decide es `supabase status`: cuando contesta, la base está.
 */
async function esperarBase(segundos = 90) {
  for (let i = 0; i < segundos / 2; i++) {
    try {
      return estado()
    } catch {
      await dormir(2000)
    }
  }
  return null
}

let status
try {
  status = estado()
} catch {
  // Levantarlo acá en vez de mandar a correr `supabase start`: era un paso
  // manual que sólo servía para fallar la primera vez. La primera corrida baja
  // las imágenes y tarda; las siguientes son segundos.
  console.log('\n  El Supabase local no estaba corriendo. Levantándolo…\n')
  // El fallo de `start` no es concluyente: también dice que falla cuando ya hay
  // otro arranque en curso, que es el caso en que sólo hay que esperar.
  try {
    execSync('supabase start', { stdio: 'inherit' })
  } catch { /* lo resuelve la espera de abajo */ }

  status = await esperarBase()
  if (!status) {
    console.error('\n  ✗ El Supabase local no llegó a levantar.')
    console.error('    Mirá qué dice:  supabase status   ·   docker ps --filter name=supabase\n')
    process.exit(1)
  }
}

const leer = clave => (status.match(new RegExp(`^${clave}="?([^"\n]+)"?`, 'm')) || [])[1]

const url = leer('API_URL')
const key = leer('SERVICE_ROLE_KEY')
if (!url || !key) {
  console.error('\n  ✗ No pude leer API_URL / SERVICE_ROLE_KEY de `supabase status`.\n')
  process.exit(1)
}

console.log(`\n  Supabase local: ${url}`)
console.log('  (Mercado Pago sigue usando las credenciales de .env.local)\n')

// Igual que `npm run dev`: los templates de mail se compilan antes de levantar,
// porque `acreditar.js` importa el `.js` y no el `.tsx`. Ver build-emails.mjs.
execSync('node scripts/build-emails.mjs', { stdio: 'inherit' })

spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: { ...process.env, SUPABASE_URL: url, SUPABASE_SECRET_KEY: key },
}).on('exit', code => process.exit(code ?? 0))
