#!/usr/bin/env node
/**
 * Dev server que sirve el sitio Y las funciones de `api/` en un solo puerto.
 *
 *   npm run dev:api
 *
 * Existe porque `vite dev` no ejecuta nada de `api/`: devuelve el index.html del
 * fallback de la SPA, así que el checkout no se puede probar. La alternativa
 * oficial es `vercel dev`, pero eso obliga a linkear el proyecto contra la
 * cuenta de Vercel. Esto no necesita cuenta ni linkeo.
 *
 *   /api/*  → el handler de api/<nombre>.js, con el shim de req/res de Vercel
 *   resto   → proxy a vite (incluido el WebSocket del hot reload)
 *
 * Las variables salen de .env.local. Ojo: acá no hay caché de funciones ni
 * cold starts; es para probar el flujo, no para medir performance.
 */
import http from 'node:http'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUERTO = Number(process.env.PORT || 3000)
const VITE = { host: 'localhost', port: Number(process.env.VITE_PORT || 5173) }

// --- variables de entorno ---------------------------------------------------
const envPath = join(RAIZ, '.env.local')
if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
  console.log('  .env.local cargado')
} else {
  console.log('  ⚠ no hay .env.local — copiá .env.example y completalo')
}

// Las funciones lo usan para las back_urls y el link del QR. Si hay un túnel,
// tiene que apuntar al túnel y no a localhost, o Mercado Pago no vuelve.
if (!process.env.PUBLIC_SITE_URL) {
  process.env.PUBLIC_SITE_URL = `http://localhost:${PUERTO}`
}

// --- shim de Vercel ---------------------------------------------------------
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

// --- proxy a vite -----------------------------------------------------------
function proxy(req, res) {
  const upstream = http.request(
    { ...VITE, path: req.url, method: req.method, headers: req.headers },
    r => {
      res.writeHead(r.statusCode || 502, r.headers)
      r.pipe(res)
    },
  )
  upstream.on('error', () => {
    res.statusCode = 502
    res.end(`No hay vite en :${VITE.port}. Levantalo con \`npm run dev\`.`)
  })
  req.pipe(upstream)
}

// --- server -----------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`)

  if (!url.pathname.startsWith('/api/')) return proxy(req, res)

  // /api/foo → api/foo.js. Sin subrutas: las funciones son archivos planos.
  const nombre = url.pathname.slice('/api/'.length)
  const archivo = join(RAIZ, 'api', `${nombre}.js`)

  if (nombre.includes('/') || nombre.startsWith('_') || !existsSync(archivo)) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'function_not_found', nombre }))
  }

  vercelizar(req, res, url)
  req.body = await leerBody(req)

  const t0 = Date.now()
  try {
    // Import fresco en cada request: así se toman los cambios sin reiniciar.
    const mod = await import(`${archivo}?t=${Date.now()}`)
    await mod.default(req, res)
  } catch (err) {
    console.error(`  ✗ ${req.method} ${url.pathname}`, err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'handler_crash', detalle: String(err?.message || err) }))
    }
  }
  console.log(`  ${req.method} ${url.pathname} → ${res.statusCode} (${Date.now() - t0}ms)`)
})

// El hot reload de vite viaja por WebSocket: sin esto, cada cambio obliga a
// recargar a mano.
server.on('upgrade', (req, socket, head) => {
  const upstream = http.request({ ...VITE, path: req.url, headers: req.headers })
  upstream.on('upgrade', (r, s, h) => {
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        Object.entries(r.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n',
    )
    if (h?.length) s.unshift(h)
    s.pipe(socket).pipe(s)
  })
  upstream.on('error', () => socket.destroy())
  if (head?.length) upstream.write(head)
  upstream.end()
})

server.listen(PUERTO, () => {
  console.log(`\n  Sitio + API   http://localhost:${PUERTO}`)
  console.log(`  proxy a vite  http://localhost:${VITE.port}`)
  console.log(`  PUBLIC_SITE_URL = ${process.env.PUBLIC_SITE_URL}\n`)
})
