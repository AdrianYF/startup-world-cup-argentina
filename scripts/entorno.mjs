#!/usr/bin/env node
/**
 * Qué tiene cargado cada entorno, en una pantalla.
 *
 *   npm run entorno
 *
 * Existe para contestar «¿por qué no me anda?» sin levantar nada y sin abrir el
 * `.env.local` a leer cuál de los dos juegos de variables está mirando. Muestra
 * los DOS entornos a la vez: la mitad de los problemas de acá son mirar el
 * juego equivocado.
 *
 * No imprime ningún secreto. De los valores sólo se dice si están, y de los que
 * no son secretos (la URL del sitio) se muestra el valor, que es justo el que
 * uno quiere confirmar.
 */
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENV = join(RAIZ, '.env.local')

if (!existsSync(ENV)) {
  console.error(`\n  ✗ No hay .env.local. Copiá .env.example y completalo.\n`)
  process.exit(1)
}
process.loadEnvFile(ENV)

// Después de cargar el archivo: `entorno.js` resuelve ENTORNO al importarse, y
// las dos funciones que se usan acá reciben el entorno por parámetro igual.
const { nombreEn, diagnosticoMP } = await import('../api/_lib/entorno.js')

/**
 * Lo que conmuta. `pista` es lo que hay que hacer cuando falta — que es la
 * única razón por la que alguien corre esto.
 */
const VARIABLES = [
  { nombre: 'MP_ACCESS_TOKEN', pista: 'panel de MP → Credenciales', secreta: true },
  { nombre: 'MP_PUBLIC_KEY', pista: 'panel de MP → Credenciales', secreta: true },
  { nombre: 'MP_WEBHOOK_SECRET', pista: 'panel de MP → Webhooks → revelar clave', secreta: true },
  { nombre: 'MP_USER_ID', pista: 'informativo: de quién es el token', opcional: true },
  { nombre: 'PUERTA_PIN', pista: 'el PIN que se le pasa al staff', secreta: true },
  { nombre: 'PUERTA_SECRET', pista: 'openssl rand -base64 32', secreta: true },
  {
    nombre: 'RESEND_API_KEY',
    pista: e => (e === 'development' ? 'sin key no sale mail, a propósito' : 'resend.com/api-keys'),
    secreta: true,
    opcional: true,
  },
  { nombre: 'RESEND_FROM', pista: 'remitente verificado en Resend', opcional: true },
  {
    nombre: 'PUBLIC_SITE_URL',
    pista: e => (e === 'development' ? 'npm run tunel' : 'el dominio del sitio'),
    opcional: true,
  },
]

const pistaDe = (v, entorno) => (typeof v.pista === 'function' ? v.pista(entorno) : v.pista)

/** Lo que NO conmuta, para que se vea que es a propósito y no un olvido. */
const COMPARTIDAS = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY']

const OK = '✓'
const MAL = '✗'
const NADA = '—'

function estado(v, entorno) {
  const clave = nombreEn(v.nombre, entorno)
  const valor = process.env[clave]

  // Mercado Pago no alcanza con «está»: una credencial de la cuenta equivocada
  // está y aun así corta.
  if (valor && v.nombre === 'MP_ACCESS_TOKEN') {
    const d = diagnosticoMP(valor, entorno)
    return { signo: d.ok ? OK : MAL, texto: d.texto, clave }
  }

  if (valor) return { signo: OK, texto: v.secreta ? 'cargada' : valor, clave }
  return {
    signo: v.opcional ? NADA : MAL,
    texto: `${v.opcional ? 'vacía' : 'falta'} · ${pistaDe(v, entorno)}`,
    clave,
  }
}

const activo = (process.env.ENTORNO || '').trim().toLowerCase() === 'production'
  ? 'production'
  : 'development'

console.log('')
for (const entorno of ['development', 'production']) {
  console.log(`  ${entorno}${entorno === activo ? '   ← el que corre con este .env.local' : ''}`)
  if (entorno === 'production') {
    console.log('    (estos valores viven en Vercel; acá abajo se ve lo que hay en el archivo)')
  }
  for (const v of VARIABLES) {
    const { signo, texto, clave } = estado(v, entorno)
    console.log(`    ${signo} ${clave.padEnd(26)} ${texto}`)
  }
  console.log('')
}

console.log('  las dos puntas comparten')
for (const nombre of COMPARTIDAS) {
  const valor = process.env[nombre]
  console.log(`    ${valor ? OK : MAL} ${nombre.padEnd(26)} ${valor && !/KEY|SECRET/.test(nombre) ? valor : (valor ? 'cargada' : 'falta')}`)
}
console.log('\n    Supabase no conmuta a propósito: una sola base para los dos.')
console.log('    Para no escribir en la del evento: npm run dev:local\n')

/**
 * Lo único que se le pregunta a la red, y es la misma pregunta que hace el
 * cerrojo antes de dejar cobrar: ¿de quién es este token?
 *
 * Las cuentas de prueba de Mercado Pago emiten credenciales `APP_USR-` igual que
 * las que cobran, así que por el prefijo no se distinguen. Mercado Pago sí sabe
 * —los test users vienen con el tag `test_user`— y contesta gratis.
 */
const tokenDev = process.env.MP_TEST_ACCESS_TOKEN
if (tokenDev?.startsWith('APP_USR-')) {
  try {
    const r = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${tokenDev}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const cuenta = await r.json()
    const esDePrueba = (cuenta.tags || []).includes('test_user')
    console.log('  la cuenta de desarrollo, según Mercado Pago')
    console.log(`    ${esDePrueba ? OK : MAL} ${String(cuenta.id).padEnd(26)} ${cuenta.nickname}`
      + `${esDePrueba ? ' · cuenta de prueba, no cobra' : ' · CUENTA REAL: el checkout va a cortar'}`)
    console.log('')
  } catch (err) {
    console.log(`  (no pude confirmarlo con Mercado Pago: ${err.message})\n`)
  }
}
