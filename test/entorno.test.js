/**
 * El cerrojo de las credenciales. Es el test más importante del repo.
 *
 * Existe por un hecho, no por una hipótesis: las pruebas del checkout se
 * corrieron con las credenciales de producción y movieron AR$147.809,08 de plata
 * real, que después hubo que devolver pago por pago. `api/_lib/entorno.js` es el
 * arreglo. Esto es lo que hace que el arreglo no se pueda deshacer sin querer.
 *
 * Cada `it` de acá abajo es una forma distinta de volver a cobrar sin querer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Un token con la forma real: el último segmento es el id de cuenta. */
const APP_USR = 'APP_USR-1234-010101-abcdef0123456789-987654321'
const TEST = 'TEST-1234567890123456-010101-abcdef-987654321'

/**
 * `entorno.js` resuelve ENTORNO al cargarse, así que cada caso necesita el módulo
 * fresco. Es la misma razón por la que el plugin del dev server importa sólo las
 * funciones puras.
 */
async function cargar(env) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  return import('../api/_lib/entorno.js')
}

const envOriginal = { ...process.env }

beforeEach(() => {
  for (const k of Object.keys(process.env)) {
    if (/^(ENTORNO|VERCEL_ENV|MP_)/.test(k)) delete process.env[k]
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env = { ...envOriginal }
})

/** La respuesta de `GET /users/me` de Mercado Pago, que es quien decide. */
function mercadoPagoDice({ tags = [], ok = true } = {}) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, json: async () => ({ tags }) })))
}

describe('ENTORNO', () => {
  it('un preview de Vercel cae en desarrollo, no en producción', async () => {
    // El default importa: es donde se probó con el túnel y donde se gastaron los
    // $147.809. `VERCEL_ENV` en un preview vale 'preview'.
    const { ENTORNO } = await cargar({ VERCEL_ENV: 'preview', ENTORNO: undefined })
    expect(ENTORNO).toBe('development')
  })

  it('sólo `VERCEL_ENV=production` o el ENTORNO explícito dan producción', async () => {
    expect((await cargar({ VERCEL_ENV: 'production', ENTORNO: undefined })).ENTORNO)
      .toBe('production')
    expect((await cargar({ VERCEL_ENV: 'preview', ENTORNO: 'production' })).ENTORNO)
      .toBe('production')
  })

  it('un ENTORNO que no es ninguno de los dos no habilita producción', async () => {
    const { ENTORNO } = await cargar({ ENTORNO: 'staging', VERCEL_ENV: undefined })
    expect(ENTORNO).toBe('development')
  })
})

describe('nombreEn', () => {
  it('mete el TEST_ después del servicio, que es como están cargadas en Vercel', async () => {
    const { nombreEn } = await cargar({ ENTORNO: 'development' })
    expect(nombreEn('MP_ACCESS_TOKEN', 'development')).toBe('MP_TEST_ACCESS_TOKEN')
    expect(nombreEn('RESEND_API_KEY', 'development')).toBe('RESEND_TEST_API_KEY')
    expect(nombreEn('PUERTA_PIN', 'development')).toBe('PUERTA_TEST_PIN')
    expect(nombreEn('MP_ACCESS_TOKEN', 'production')).toBe('MP_ACCESS_TOKEN')
  })
})

describe('valorDe', () => {
  it('NO cae al valor del otro entorno cuando falta el propio', async () => {
    // Es su razón de ser. Que falte la key de prueba y el mail salga con la de
    // producción es la misma clase de silencio que cobró los $147.809.
    const { valorDe } = await cargar({
      ENTORNO: 'development',
      MP_ACCESS_TOKEN: 'la-de-produccion',
      MP_TEST_ACCESS_TOKEN: undefined,
    })
    expect(() => valorDe('MP_ACCESS_TOKEN')).toThrow(/MP_TEST_ACCESS_TOKEN/)
  })
})

describe('credencialesMP · el cerrojo', () => {
  it('en desarrollo, una credencial de una cuenta REAL corta', async () => {
    // El caso exacto de los $147.809: `APP_USR-` de una cuenta que cobra, pegada
    // en la variable de prueba.
    mercadoPagoDice({ tags: [] })
    const { credencialesMP } = await cargar({
      ENTORNO: 'development',
      MP_TEST_ACCESS_TOKEN: APP_USR,
    })
    await expect(credencialesMP()).rejects.toThrow(/NO es\s+de prueba|no es de prueba/i)
  })

  it('en desarrollo, una cuenta de prueba de Mercado Pago pasa', async () => {
    // Los test users emiten `APP_USR-` igual que las cuentas que cobran, así que
    // el prefijo no alcanza para decidir. Rechazarlos dejaba el checkout local
    // sin forma de probarse.
    mercadoPagoDice({ tags: ['test_user'] })
    const { credencialesMP } = await cargar({
      ENTORNO: 'development',
      MP_TEST_ACCESS_TOKEN: APP_USR,
    })
    await expect(credencialesMP()).resolves.toMatchObject({ accessToken: APP_USR })
  })

  it('si Mercado Pago no contesta, NO se asume que es de prueba', async () => {
    // Fail-closed. Preferimos no poder cobrar antes que cobrarle a alguien sin
    // querer.
    mercadoPagoDice({ ok: false })
    const { credencialesMP } = await cargar({
      ENTORNO: 'development',
      MP_TEST_ACCESS_TOKEN: APP_USR,
    })
    await expect(credencialesMP()).rejects.toThrow(/no pude confirmar/i)
  })

  it('en producción, una credencial de PRUEBA corta', async () => {
    // El espejo: no cobraría nada y la gente se llevaría la entrada gratis. El
    // evento se enteraría en la puerta.
    const { credencialesMP } = await cargar({
      ENTORNO: 'production',
      MP_ACCESS_TOKEN: TEST,
    })
    await expect(credencialesMP()).rejects.toThrow(/PRUEBA/)
  })

  it('en producción no se le pregunta nada a Mercado Pago', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { credencialesMP } = await cargar({
      ENTORNO: 'production',
      MP_ACCESS_TOKEN: APP_USR,
    })
    await expect(credencialesMP()).resolves.toMatchObject({ accessToken: APP_USR })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('ventaPropiaAbierta', () => {
  it('apagada por omisión: un deploy que se la olvidó vende por Startup Grind', async () => {
    const { ventaPropiaAbierta } = await cargar({ VENTA_PROPIA: undefined })
    expect(ventaPropiaAbierta()).toBe(false)
  })

  it('sólo la prenden los valores que decimos que la prenden', async () => {
    const { ventaPropiaAbierta } = await cargar({ VENTA_PROPIA: 'on' })
    for (const v of ['on', 'ON', ' true ', '1']) {
      process.env.VENTA_PROPIA = v
      expect(ventaPropiaAbierta()).toBe(true)
    }
    for (const v of ['off', 'no', 'si', '', '0', 'yes']) {
      process.env.VENTA_PROPIA = v
      expect(ventaPropiaAbierta()).toBe(false)
    }
  })
})
