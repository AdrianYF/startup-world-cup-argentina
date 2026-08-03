/**
 * La sesión de la puerta.
 *
 * Un PIN compartido y un token firmado, sin estado en la base. Lo que protege es
 * la lista entera de asistentes —nombre, mail y teléfono de cada persona— y es lo
 * único entre esa lista y cualquiera que abra la URL.
 *
 * El caso que da nombre a la mitad de estos tests: el vencimiento era una FECHA
 * FIJA, así que pasada esa fecha `firmarSesion()` emitía tokens ya vencidos y el
 * backoffice quedaba con 401 permanente, imposible de abrir aun sabiendo el PIN.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECRETO = 'un-secreto-de-prueba-largo'
const PIN = 'un-pin-largo-de-prueba'

const DIA = 24 * 60 * 60 * 1000

async function cargar(env = {}) {
  vi.resetModules()
  process.env.ENTORNO = 'development'
  process.env.PUERTA_TEST_SECRET = SECRETO
  process.env.PUERTA_TEST_PIN = PIN
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  return import('../api/_lib/puerta.js')
}

const envOriginal = { ...process.env }
beforeEach(() => { process.env = { ...envOriginal } })
afterEach(() => { process.env = { ...envOriginal } })

describe('firmarSesion · el vencimiento ya no es una fecha fija', () => {
  it('NUNCA emite un token vencido, aunque el reloj pase la vieja fecha fija', async () => {
    // El bug, escrito como test — y hay que mover el RELOJ, no el argumento:
    // `sesionValida()` compara contra `Date.now()` real, así que pasarle una
    // fecha futura a `firmarSesion()` no prueba nada mientras hoy siga siendo
    // anterior al 9 de agosto de 2026.
    //
    // Con aquella constante clavada, acá `firmarSesion()` devolvía un token ya
    // vencido: el backoffice quedaba con 401 permanente y no lo abría ni el PIN
    // correcto.
    const { firmarSesion, sesionValida } = await cargar()
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-08-10T12:00:00Z')) // un día después
      expect(sesionValida(firmarSesion())).toBe(true)

      vi.setSystemTime(new Date('2027-03-01T12:00:00Z')) // y meses después
      expect(sesionValida(firmarSesion())).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('el token de hoy sirve, y sigue sirviendo pasados los tres días del evento', async () => {
    // Quien entra el miércoles no se puede quedar afuera el viernes.
    const { firmarSesion, sesionValida } = await cargar()
    const haceTresDias = Date.now() - 3 * DIA
    expect(sesionValida(firmarSesion(haceTresDias))).toBe(true)
  })

  it('pero caduca: uno de hace ocho días ya no entra', async () => {
    const { firmarSesion, sesionValida } = await cargar()
    expect(sesionValida(firmarSesion(Date.now() - 8 * DIA))).toBe(false)
  })
})

describe('sesionValida · sólo pasa lo que firmamos nosotros', () => {
  it('rechaza un payload manoseado', async () => {
    const { firmarSesion, sesionValida } = await cargar()
    const [, sig] = firmarSesion().split('.')
    // Un vencimiento inventado, con la firma del original.
    const falso = Buffer.from(JSON.stringify({ exp: Date.now() + 99 * DIA }))
      .toString('base64url')
    expect(sesionValida(`${falso}.${sig}`)).toBe(false)
  })

  it('rechaza una firma manoseada', async () => {
    const { firmarSesion, sesionValida } = await cargar()
    const [payload] = firmarSesion().split('.')
    expect(sesionValida(`${payload}.firmaInventada`)).toBe(false)
  })

  it('rechaza el token firmado con OTRO secreto: rotarlo revoca todo', async () => {
    const { firmarSesion } = await cargar()
    const ajeno = firmarSesion()
    const { sesionValida } = await cargar({ PUERTA_TEST_SECRET: 'otro-secreto-distinto' })
    expect(sesionValida(ajeno)).toBe(false)
  })

  it('rechaza basura sin romperse', async () => {
    const { sesionValida } = await cargar()
    for (const v of ['', 'x', 'a.b', '.', null, undefined, 42, {}]) {
      expect(sesionValida(v)).toBe(false)
    }
  })

  it('sin PUERTA_SECRET no valida nada, en vez de tirar', async () => {
    const { firmarSesion } = await cargar()
    const token = firmarSesion()
    const { sesionValida } = await cargar({ PUERTA_TEST_SECRET: undefined })
    expect(sesionValida(token)).toBe(false)
  })
})

describe('pinValido', () => {
  it('acepta el PIN y rechaza cualquier otro', async () => {
    const { pinValido } = await cargar()
    expect(pinValido(PIN)).toBe(true)
    expect(pinValido(PIN + 'x')).toBe(false)
    expect(pinValido('')).toBe(false)
    expect(pinValido(undefined)).toBe(false)
  })

  it('sin PIN configurado NO deja entrar', async () => {
    // Un `if (!esperado) return true` acá dejaría la lista de asistentes abierta
    // en cuanto alguien se olvide de cargar la variable.
    const { pinValido } = await cargar({ PUERTA_TEST_PIN: undefined })
    expect(pinValido('lo-que-sea')).toBe(false)
    expect(pinValido('')).toBe(false)
  })
})
