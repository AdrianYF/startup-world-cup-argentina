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
import { existsSync } from 'node:fs'
import { join } from 'node:path'

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

export function apiFunctions({ raiz }) {
  return {
    name: 'swc:api-functions',
    apply: 'serve',

    config() {
      // Las funciones leen process.env, no import.meta.env: Vite sólo expone las
      // VITE_*, así que el resto hay que cargarlo a mano.
      const env = join(raiz, '.env.local')

      // OJO con la precedencia: `loadEnvFile` NO pisa lo que ya está en el
      // entorno. Si el shell tiene un `export SUPABASE_URL=...`, el archivo se
      // ignora en silencio y la app termina hablándole a OTRA base — con la
      // misma cara, respondiendo 200 y con otros números de stock. Pasó, y
      // costó encontrarlo.
      //
      // Se guarda qué venía del shell para poder avisarlo abajo.
      const antes = { ...process.env }
      if (existsSync(env)) process.loadEnvFile(env)

      if (!process.env.PUBLIC_SITE_URL) {
        process.env.PUBLIC_SITE_URL = 'http://localhost:5173'
      }

      // A qué base y a qué Mercado Pago le está hablando este dev server, en una
      // línea y sin secretos. Es la pregunta que uno se hace cuando los números
      // no cierran.
      const url = process.env.SUPABASE_URL || ''
      const local = /127\.0\.0\.1|localhost/.test(url)
      const pisadas = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'MP_ACCESS_TOKEN', 'PUBLIC_SITE_URL']
        .filter(k => antes[k] !== undefined && antes[k] !== '')

      console.log('')
      console.log(`  base       ${url || '(sin configurar)'}${local ? '  ← Supabase LOCAL, no la de producción' : ''}`)
      console.log(`  mp         ${/^TEST-/.test(process.env.VITE_MP_PUBLIC_KEY || '') ? 'credenciales de test' : (process.env.MP_ACCESS_TOKEN ? 'configurado' : '(sin configurar)')}`)
      console.log(`  sitio      ${process.env.PUBLIC_SITE_URL}`)
      if (pisadas.length) {
        console.log(`\n  ⚠ el shell pisa a .env.local en: ${pisadas.join(', ')}`)
        console.log(`    (loadEnvFile no sobrescribe lo ya exportado — usá \`unset\` si no era a propósito)`)
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
