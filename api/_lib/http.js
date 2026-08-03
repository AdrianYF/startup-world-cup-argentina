// Utilidades compartidas por las funciones de la API.
import { valorDe } from './entorno.js'

/** Respuesta JSON sin caché. Nada de lo que devuelve esta API se puede cachear. */
export function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).send(JSON.stringify(body))
}

/**
 * Corta si el método no es el esperado. Devuelve true si ya respondió.
 * Sin esto, un GET a /api/checkout entraría al handler con `req.body` vacío.
 */
export function rejectMethod(req, res, allowed) {
  if (req.method === allowed) return false
  res.setHeader('Allow', allowed)
  json(res, 405, { error: 'method_not_allowed' })
  return true
}

/**
 * Body como objeto. Vercel ya parsea JSON, pero cuando el content-type no viene
 * o el body llega crudo hay que hacerlo a mano.
 */
export function readBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

/** Primer valor de un header/query que puede venir repetido. */
export function first(value) {
  return Array.isArray(value) ? value[0] : value
}

/**
 * URL pública del sitio, para las back_urls de Mercado Pago y el link del QR.
 * Cae a los headers del proxy cuando PUBLIC_SITE_URL no está seteada, así el
 * flujo sigue andando en los previews de Vercel y detrás de un túnel.
 */
export function siteUrl(req) {
  // Del entorno activo: PUBLIC_TEST_SITE_URL en desarrollo, que es donde vive
  // el túnel de Cloudflare. Opcional a propósito — el fallback de abajo es lo
  // que hace que un preview de Vercel ande sin configurar nada.
  const fromEnv = valorDe('PUBLIC_SITE_URL', { obligatoria: false })
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const proto = first(req.headers['x-forwarded-proto']) || 'https'
  const host = first(req.headers['x-forwarded-host']) || req.headers.host || ''
  return `${proto}://${host}`
}

/** Validación mínima de mail: alcanza para atajar tipeos, no pretende más. */
export function esMailValido(mail) {
  return typeof mail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.trim())
}

/**
 * Formato de precio.
 *
 * `centavos: true` fuerza los dos decimales, que es lo que corresponde en un
 * desglose: con "$35.000 / $1.952,27 / $36.952,27" las columnas no alinean y
 * parece que el subtotal fuera aproximado.
 */
export function formatARS(pesos, { centavos = false } = {}) {
  return '$' + Number(pesos).toLocaleString('es-AR', {
    minimumFractionDigits: centavos ? 2 : 0,
    maximumFractionDigits: 2,
  })
}
