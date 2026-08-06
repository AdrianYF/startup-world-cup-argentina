/**
 * En qué bloque de la agenda estamos.
 *
 * Es lo que decide qué fila se marca «Ahora» y a dónde salta la pantalla
 * durante el evento. Se equivoca de dos maneras y las dos son visibles: marcar
 * el bloque de al lado, o marcar el correcto pero en la hora de quien mira en
 * vez de la del Konex.
 */
import { describe, expect, it } from 'vitest'
import { estadoDeBloque, momentoDe, rangoDeHora } from '../src/lib/momento.ts'

describe('rangoDeHora', () => {
  it('lee el formato de la agenda', () => {
    expect(rangoDeHora('16:00 - 20:00')).toEqual({ desde: 960, hasta: 1200 })
    expect(rangoDeHora('13:00 - 13:30')).toEqual({ desde: 780, hasta: 810 })
  })

  it('aguanta el guion largo y los espacios de más', () => {
    expect(rangoDeHora(' 9:00 – 10:30 ')).toEqual({ desde: 540, hasta: 630 })
  })

  it('devuelve null si el texto no tiene esa forma', () => {
    // Es contenido que se edita a mano: una hora mal escrita tiene que dejar
    // ese bloque sin marcar, no romper la agenda entera.
    for (const malo of ['', 'A confirmar', '16:00', '16:00 a 20:00', 'todo el día']) {
      expect(rangoDeHora(malo)).toBeNull()
    }
  })

  it('rechaza un bloque que termina antes de empezar', () => {
    // No es un bloque que cruza la medianoche: la agenda cierra 22:00.
    expect(rangoDeHora('20:00 - 16:00')).toBeNull()
  })
})

describe('estadoDeBloque', () => {
  const jueves = '2026-08-06'
  const a = (h, m) => ({ fecha: jueves, minutos: h * 60 + m })

  it('marca el bloque que está corriendo', () => {
    expect(estadoDeBloque(jueves, '14:30 - 15:00', a(14, 45))).toBe('ahora')
  })

  it('el borde de arranque ya es «ahora», el de cierre ya es «pasado»', () => {
    // Dos bloques seguidos no pueden estar los dos en curso a las 15:00 en
    // punto: el que termina cede, el que empieza toma.
    expect(estadoDeBloque(jueves, '14:30 - 15:00', a(14, 30))).toBe('ahora')
    expect(estadoDeBloque(jueves, '14:30 - 15:00', a(15, 0))).toBe('pasado')
    expect(estadoDeBloque(jueves, '15:00 - 15:30', a(15, 0))).toBe('ahora')
  })

  it('los otros días quedan enteros de un lado', () => {
    expect(estadoDeBloque('2026-08-05', '16:00 - 20:00', a(14, 45))).toBe('pasado')
    expect(estadoDeBloque('2026-08-07', '13:00 - 13:30', a(14, 45))).toBe('futuro')
  })

  it('una hora ilegible no se marca nunca', () => {
    expect(estadoDeBloque(jueves, 'A confirmar', a(14, 45))).toBe('futuro')
  })
})

describe('momentoDe', () => {
  it('devuelve la hora de Buenos Aires, no la de quien mira', () => {
    // 2026-08-06 20:00 UTC son las 17:00 en Buenos Aires (UTC-3). Si esto
    // devolviera la hora local, alguien mirando desde Madrid vería marcado un
    // bloque que en el evento todavía no empezó.
    const m = momentoDe(new Date('2026-08-06T20:00:00Z'))
    expect(m).toEqual({ fecha: '2026-08-06', minutos: 17 * 60 })
  })

  it('el cambio de día también es el de Buenos Aires', () => {
    // 2026-08-07 02:00 UTC todavía es el 6 a la noche en Argentina: el Pitch
    // Battle del viernes no puede quedar marcado mientras corre el jueves.
    const m = momentoDe(new Date('2026-08-07T02:00:00Z'))
    expect(m).toEqual({ fecha: '2026-08-06', minutos: 23 * 60 })
  })
})
