/**
 * De dónde sale la URL pública del sitio.
 *
 * No es una cuestión de prolijidad: este origen termina adentro del QR de la
 * entrada, en los links del mail de confirmación y en las `back_urls` y el
 * `notification_url` de Mercado Pago. `GET /api/orden` es público y dispara el
 * mail, así que mientras el fallback a `x-forwarded-host` estuvo abierto, un
 * tercero podía reescribir el dominio de los links que le llegaban al comprador.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function cargar(env) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  return import('../api/_lib/http.js')
}

/** Un request con los headers que puede escribir cualquiera. */
const requestDe = host => ({
  headers: { 'x-forwarded-host': host, 'x-forwarded-proto': 'https' },
})

const envOriginal = { ...process.env }

beforeEach(() => {
  for (const k of Object.keys(process.env)) {
    if (/^(ENTORNO|VERCEL|PUBLIC_)/.test(k)) delete process.env[k]
  }
})

afterEach(() => { process.env = { ...envOriginal } })

describe('siteUrl', () => {
  it('la variable del entorno gana sobre todo lo demás', async () => {
    const { siteUrl } = await cargar({
      ENTORNO: 'production',
      PUBLIC_SITE_URL: 'https://startupworldcup.ar',
      VERCEL_URL: 'algo.vercel.app',
    })
    expect(siteUrl(requestDe('atacante.example'))).toBe('https://startupworldcup.ar')
  })

  it('le saca la barra final, para no armar links con doble barra', async () => {
    const { siteUrl } = await cargar({
      ENTORNO: 'production',
      PUBLIC_SITE_URL: 'https://startupworldcup.ar/',
    })
    expect(siteUrl(requestDe(''))).toBe('https://startupworldcup.ar')
  })

  it('en desarrollo usa la variable de prueba, que es donde vive el túnel', async () => {
    const { siteUrl } = await cargar({
      ENTORNO: 'development',
      PUBLIC_TEST_SITE_URL: 'https://algo.trycloudflare.com',
      PUBLIC_SITE_URL: 'https://startupworldcup.ar',
    })
    expect(siteUrl(requestDe(''))).toBe('https://algo.trycloudflare.com')
  })

  it('sin variable, usa la que inyecta Vercel y NO el header del cliente', async () => {
    const { siteUrl } = await cargar({
      ENTORNO: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'swc.vercel.app',
    })
    expect(siteUrl(requestDe('atacante.example'))).toBe('https://swc.vercel.app')
  })

  it('en producción, sin ninguna de las dos, CORTA en vez de creerle al request', async () => {
    // Mismo criterio que el cerrojo de entorno.js: preferimos no poder cobrar
    // antes que mandar a alguien a pagar a un dominio que eligió otro.
    const { siteUrl } = await cargar({ ENTORNO: 'production' })
    expect(() => siteUrl(requestDe('atacante.example'))).toThrow(/PUBLIC_SITE_URL/)
  })

  it('en desarrollo sí cae a los headers: es lo que hace andar al túnel', async () => {
    const { siteUrl } = await cargar({ ENTORNO: 'development' })
    expect(siteUrl(requestDe('localhost:5173'))).toBe('https://localhost:5173')
  })
})
