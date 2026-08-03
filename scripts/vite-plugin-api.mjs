/**
 * Plugin de Vite que ejecuta las funciones de `api/` dentro del dev server.
 *
 * Sin esto, `vite dev` no conoce `/api/*` y cae al fallback de la SPA: un GET
 * devuelve el index.html con 200 y un **POST devuelve 404**, porque el fallback
 * sólo aplica a GET/HEAD. Ese 404 es el que rompía el checkout en local, y era
 * indistinguible de un bug del código.
 *
 * En producción no participa de nada: Vercel resuelve `api/` por su cuenta y
 * este plugin sólo corre en `configureServer`, que es dev-only.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
// Sólo las dos funciones puras: reciben el entorno por parámetro, así que
// importarlas antes de leer el `.env.local` no tiene el problema de orden que sí
// tendría usar el `ENTORNO` que el módulo resuelve al cargarse.
import { nombreEn, diagnosticoMP } from '../api/_lib/entorno.js'

/**
 * Cuántas tandas hay a la venta en la base a la que apunta ESTE server.
 *
 * Está acá, al lado del entorno, porque para que el sitio ofrezca pagar con
 * Mercado Pago hacen falta DOS cosas y sólo una vive en el `.env`:
 * `VENTA_PROPIA=on` y al menos un tier con `activo = true`. Sin la segunda,
 * `/api/tiers` devuelve una lista vacía y el botón se va a Startup Grind con la
 * variable en `on` — que es exactamente el síntoma que hizo perder una mañana.
 *
 * `null` si no se pudo preguntar: es un dato para el cartel, no una precondición
 * para arrancar. Nada de esto puede impedir que el dev server levante.
 */
async function tandasActivas(url, key) {
  if (!url || !key) return null
  try {
    const r = await fetch(`${url}/rest/v1/tiers?select=id&activo=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(3000),
    })
    if (!r.ok) return null
    const filas = await r.json()
    return Array.isArray(filas) ? filas.length : null
  } catch {
    return null
  }
}

/** Vercel agrega status()/send()/json() al `res` de node. Acá se replican. */
function vercelizar(req, res, url) {
  req.query = Object.fromEntries(url.searchParams)

  res.status = code => {
    res.statusCode = code
    return res
  }
  res.send = body => {
    if (body === undefined || body === null) res.end()
    else if (typeof body === 'string' || Buffer.isBuffer(body)) res.end(body)
    else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(body))
    }
    return res
  }
  res.json = body => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
    return res
  }
}

async function leerBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks)
  if (!raw.length) return undefined

  const tipo = req.headers['content-type'] || ''
  const texto = raw.toString('utf8')
  if (tipo.includes('application/json')) {
    try {
      return JSON.parse(texto)
    } catch {
      return texto
    }
  }
  if (tipo.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(texto))
  }
  return texto
}

/**
 * Las claves del `.env.local`, tal como están escritas en el archivo.
 *
 * Parser mínimo a propósito: sólo hace falta para COMPARAR contra `process.env`
 * y avisar cuando difieren. Quien las carga de verdad sigue siendo
 * `process.loadEnvFile`.
 */
function leerEnvCrudo(archivo) {
  const pares = {}
  for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
    const limpia = linea.trim()
    if (!limpia || limpia.startsWith('#')) continue
    const corte = limpia.indexOf('=')
    if (corte === -1) continue
    const clave = limpia.slice(0, corte).trim()
    // Las comillas son del formato del archivo, no del valor: `RESEND_FROM="…"`
    // llega a process.env sin ellas, y sin sacarlas acá daría siempre distinto.
    pares[clave] = limpia.slice(corte + 1).trim().replace(/^["'](.*)["']$/, '$1')
  }
  return pares
}

export function apiFunctions({ raiz }) {
  return {
    name: 'swc:api-functions',
    apply: 'serve',

    async config() {
      // Las funciones leen process.env, no import.meta.env: Vite sólo expone las
      // VITE_*, así que el resto hay que cargarlo a mano.
      const env = join(raiz, '.env.local')

      // OJO con la precedencia: `loadEnvFile` NO pisa lo que ya está en el
      // entorno. Si el shell tiene un `export SUPABASE_URL=...`, el archivo se
      // ignora en silencio y la app termina hablándole a OTRA base — con la
      // misma cara, respondiendo 200 y con otros números de stock. Pasó, y
      // costó encontrarlo.
      if (existsSync(env)) process.loadEnvFile(env)

      // La otra cara de esa misma regla, y la que hace perder horas: cuando Vite
      // se reinicia en caliente porque cambió `.env.local`, el proceso es el
      // MISMO, así que `process.env` sigue con los valores de cuando arrancó.
      // Una clave nueva entra; una que ya existía —aunque estuviera vacía— no se
      // pisa nunca. Editar el archivo parece no hacer nada y no hay forma de
      // darse cuenta mirando.
      const desactualizadas = existsSync(env)
        ? Object.entries(leerEnvCrudo(env))
          .filter(([k, v]) => process.env[k] !== v)
          .map(([k]) => k)
        : []

      // Qué entorno, y por lo tanto qué juego de credenciales.
      //
      // El valor se calcula acá y no se toma del que exporta `entorno.js`: ese
      // módulo lo resuelve cuando se carga, y cuando se carga este archivo el
      // `.env.local` —que es donde vive ENTORNO— todavía no se leyó. La REGLA,
      // en cambio, se importa: `nombreEn` la recibe por parámetro justamente
      // para poder usarla desde acá.
      const entorno = (process.env.ENTORNO || '').trim().toLowerCase() === 'production'
        ? 'production'
        : 'development'
      const clave = nombre => nombreEn(nombre, entorno)
      const del = nombre => process.env[clave(nombre)]

      if (!del('PUBLIC_SITE_URL')) {
        process.env[clave('PUBLIC_SITE_URL')] = 'http://localhost:5173'
      }

      // A qué base y a qué Mercado Pago le está hablando este dev server, en una
      // línea y sin secretos. Es la pregunta que uno se hace cuando los números
      // no cierran.
      //
      // La línea de `mp` dice de antemano lo que el cerrojo de entorno.js va a
      // hacer en el primer checkout. Enterarse al arrancar es gratis; enterarse
      // cuando alguien está pagando, no.
      const url = process.env.SUPABASE_URL || ''
      const local = /127\.0\.0\.1|localhost/.test(url)

      console.log('')
      console.log(`  entorno    ${entorno}${entorno === 'production' ? '  ← cobra de verdad' : ''}`)
      console.log(`  base       ${url || '(sin configurar)'}${local ? '  ← Supabase LOCAL, no la de producción' : ''}`)
      const mp = diagnosticoMP(del('MP_ACCESS_TOKEN'), entorno)
      console.log(`  mp         ${mp.texto}${mp.ok ? '' : '  ←'}`)
      console.log(`  sitio      ${del('PUBLIC_SITE_URL')}`)

      // La venta propia necesita las dos: la variable Y una tanda activa en esa
      // base. Se dicen juntas porque por separado no explican nada — «on» con
      // cero tandas se ve igual que «off»: el botón lleva a Startup Grind.
      const on = ['on', 'true', '1'].includes((process.env.VENTA_PROPIA || '').trim().toLowerCase())
      const tandas = on ? await tandasActivas(url, process.env.SUPABASE_SECRET_KEY) : null
      const venta = !on
        ? 'off · el botón lleva a Startup Grind'
        : tandas === null ? 'on · no pude contar las tandas en esa base'
          : tandas === 0 ? 'on, pero 0 tandas activas  ← el botón lleva a Startup Grind igual'
            : `on · ${tandas} ${tandas === 1 ? 'tanda' : 'tandas'} a la venta`
      console.log(`  venta      ${venta}`)
      if (desactualizadas.length) {
        console.log(`\n  ⚠ el proceso NO tiene lo que dice .env.local en: ${desactualizadas.join(', ')}`)
        console.log('    Puede ser a propósito —`npm run dev:local` inyecta el Supabase de Docker,')
        console.log('    o lo exportaste en el shell— o puede ser que edites el archivo y no pase')
        console.log('    nada: Vite se reinicia pero process.env queda como al arrancar. Si es eso,')
        console.log('    Ctrl-C y levantalo de nuevo.')
      }
      console.log('')
    },

    configureServer(server) {
      // Reiniciar el server ante cualquier cambio en api/.
      //
      // El `?t=` de más abajo sólo invalida el handler, no lo que el handler
      // importa: tocar api/_lib/db.js dejaba corriendo la versión vieja y el
      // endpoint devolvía datos viejos sin ningún error a la vista. Reiniciar es
      // lo único que limpia el caché de módulos entero.
      const dirApi = join(raiz, 'api')
      server.watcher.add(dirApi)
      server.watcher.on('change', archivo => {
        if (!archivo.startsWith(dirApi)) return
        server.config.logger.info(`  api cambió ${archivo.slice(raiz.length + 1)} → reiniciando`)
        server.restart()
      })

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        // /api/foo → api/foo.js. Las funciones son archivos planos; api/_lib/
        // queda fuera del alcance a propósito.
        const nombre = url.pathname.slice('/api/'.length)
        const archivo = join(raiz, 'api', `${nombre}.js`)

        if (nombre.includes('/') || nombre.startsWith('_') || !existsSync(archivo)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'function_not_found', nombre }))
        }

        vercelizar(req, res, url)
        req.body = await leerBody(req)

        const t0 = Date.now()
        try {
          // ssrLoadModule y no import(): pasa por la pipeline de Vite, así que
          // los handlers pueden importar TypeScript y JSX (el template del mail
          // usa React Email). Con `import()` pelado, Node tira
          // "Unknown file extension .tsx".
          const mod = await server.ssrLoadModule(archivo)
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(`  api ${req.method} ${url.pathname}\n${err?.stack || err}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'handler_crash', detalle: String(err?.message || err) }))
          }
        }
        server.config.logger.info(
          `  api ${req.method} ${url.pathname} → ${res.statusCode} (${Date.now() - t0}ms)`,
        )
      })
    },
  }
}
