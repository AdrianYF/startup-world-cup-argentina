#!/usr/bin/env node
/**
 * El túnel de Cloudflare, con la URL ya cargada en `.env.local`.
 *
 *   npm run tunel           → contra localhost:5173
 *   npm run tunel -- 5175   → contra otro puerto
 *
 * Mercado Pago necesita una URL pública: para volver al sitio después de pagar
 * (`back_urls`, y sin eso ni siquiera acepta `auto_return`) y para mandar el
 * webhook. `localhost` no le sirve.
 *
 * El paso que este script se come es el que siempre se olvida: la URL cambia en
 * cada corrida, y pegarla a mano en `PUBLIC_TEST_SITE_URL` es la diferencia
 * entre que el checkout ande o que al pagar no vuelvas a ningún lado. La de la
 * corrida anterior queda muerta en el archivo y no hay nada que lo diga.
 *
 * Ojo con el puerto: si 5173 está ocupado, Vite se corre a 5174 o 5175 y el
 * túnel tiene que apuntar ahí. Mirá lo que imprime `npm run dev`.
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// La regla de nombres, importada y no repetida: es la misma que usan las
// funciones de `api/` para saber qué variable mirar.
const { nombreEn } = await import('../api/_lib/entorno.js')
const ENV = join(RAIZ, '.env.local')
/**
 * A qué variable se escribe la URL: la del entorno que va a correr.
 *
 * Escribía `PUBLIC_TEST_SITE_URL` fijo, y eso rompía justo el caso para el que
 * existe la escotilla `ENTORNO=production`: hacer una compra real de verificación
 * desde local. En producción `valorDe()` lee `PUBLIC_SITE_URL` —sin `TEST`— así
 * que el túnel dejaba la URL en la variable que nadie iba a mirar, y el checkout
 * cortaba con «no sé cuál es la URL pública del sitio».
 *
 * `ENTORNO` se lee del ambiente y del `.env.local`, en ese orden, porque es
 * exactamente como lo va a resolver el server que se levante después.
 */
const CLAVE = nombreEn('PUBLIC_SITE_URL', entornoActivo())

function entornoActivo() {
  const delShell = (process.env.ENTORNO || '').trim().toLowerCase()
  if (delShell === 'production' || delShell === 'development') return delShell
  const archivo = join(RAIZ, '.env.local')
  try {
    const m = readFileSync(archivo, 'utf8').match(/^ENTORNO=(.*)$/m)
    const v = (m?.[1] || '').trim().toLowerCase().replace(/^["']|["']$/g, '')
    if (v === 'production') return 'production'
  } catch { /* sin archivo, es desarrollo */ }
  return 'development'
}

const puerto = process.argv[2] || '5173'
const URL_TUNEL = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/

/**
 * Escribe la URL en `.env.local` tocando UNA línea.
 *
 * A mano y no con una librería de dotenv porque el archivo es mitad comentarios
 * —qué es cada variable y por qué— y cualquier reescritura completa se los come.
 */
function guardar(url) {
  const antes = readFileSync(ENV, 'utf8')
  const linea = `${CLAVE}=${url}`
  const despues = new RegExp(`^${CLAVE}=.*$`, 'm').test(antes)
    ? antes.replace(new RegExp(`^${CLAVE}=.*$`, 'm'), linea)
    : `${antes.trimEnd()}\n${linea}\n`
  if (despues === antes) return false
  writeFileSync(ENV, despues)
  return true
}

console.log(`\n  Levantando el túnel contra localhost:${puerto}…\n`)

const cf = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${puerto}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
})

cf.on('error', (/** @type {NodeJS.ErrnoException} */ err) => {
  console.error(
    err.code === 'ENOENT'
      ? '\n  ✗ No está cloudflared. Instalalo con `brew install cloudflared`.\n'
      : `\n  ✗ No pude levantar el túnel: ${err.message}\n`,
  )
  process.exit(1)
})

let anunciada = false

// cloudflared escribe todo por stderr, también lo que no es error.
for (const flujo of [cf.stdout, cf.stderr]) {
  flujo.setEncoding('utf8')
  flujo.on('data', texto => {
    const url = !anunciada && texto.match(URL_TUNEL)?.[0]
    if (!url) return
    anunciada = true

    const guardada = guardar(url)
    console.log(`  ${url}\n`)
    console.log(`  ${guardada ? '✓' : '='} ${CLAVE} en .env.local`)
    console.log('')
    console.log('  Falta:')
    console.log(`    1. cargar  ${url}/api/mp-webhook  en el panel de MP (evento Pagos)`)
    console.log('       y copiar la clave que revela a MP_TEST_WEBHOOK_SECRET')
    console.log('    2. reiniciar `npm run dev` — el env se lee al arrancar')
    console.log('')
    console.log('  El túnel es público mientras este proceso viva: cualquiera con')
    console.log('  el link entra a tu máquina. Cortalo cuando termines (Ctrl-C).\n')
  })
}

// Ctrl-C corta el túnel y con eso alcanza: la URL queda en el archivo, muerta,
// pero la próxima corrida la pisa. Borrarla acá sería peor — dejaría el archivo
// a medias si el proceso se muere de otra forma.
process.on('SIGINT', () => cf.kill('SIGINT'))
cf.on('exit', code => process.exit(code ?? 0))
