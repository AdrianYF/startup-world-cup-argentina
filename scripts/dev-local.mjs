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

let status
try {
  status = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
} catch {
  console.error('\n  ✗ El Supabase local no está corriendo. Levantalo con:\n\n      supabase start\n')
  process.exit(1)
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

spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: { ...process.env, SUPABASE_URL: url, SUPABASE_SECRET_KEY: key },
}).on('exit', code => process.exit(code ?? 0))
