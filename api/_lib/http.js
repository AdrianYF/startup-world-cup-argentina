// Utilidades compartidas por las funciones de la API.
import { valorDe, enProduccion, ErrorDeEntorno } from './entorno.js'

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
 *
 * El orden importa, y no es preferencia de estilo: este origen termina adentro
 * del QR de la entrada, en los links del mail de confirmación y en las
 * `back_urls` / `notification_url` de Mercado Pago. Quien lo elige NO puede ser
 * el que manda el request.
 *
 *   1. La variable del entorno activo (PUBLIC_TEST_SITE_URL en desarrollo, que
 *      es donde vive el túnel de Cloudflare). La configuró una persona.
 *   2. Las que inyecta Vercel. Un cliente no las puede escribir, y son las que
 *      hacen que un preview ande sin configurar nada.
 *   3. Los headers del proxy — **sólo en desarrollo**. `x-forwarded-host` lo
 *      manda quien quiera, y `GET /api/orden` es público y dispara el mail: con
 *      el fallback abierto, un tercero podía reescribir el dominio de los links
 *      que le llegan al comprador.
 *
 * En producción, sin (1) ni (2), corta. Mismo criterio que el cerrojo de
 * `entorno.js`: preferimos no poder cobrar antes que mandar a alguien a pagar a
 * un dominio que eligió otro.
 */
export function siteUrl(req) {
  const fromEnv = valorDe('PUBLIC_SITE_URL', { obligatoria: false })
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const deVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (deVercel) return `https://${deVercel}`

  if (enProduccion) {
    throw new ErrorDeEntorno(
      'no sé cuál es la URL pública del sitio: falta PUBLIC_SITE_URL y tampoco hay '
      + 'VERCEL_PROJECT_PRODUCTION_URL. En producción no se cae a los headers del '
      + 'request, que los escribe el cliente.',
    )
  }

  const proto = first(req.headers['x-forwarded-proto']) || 'http'
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
