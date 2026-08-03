/**
 * Los días, que se resuelven con un `includes` sobre texto libre.
 *
 * `acreditacion.dias` lo escribe cada canal ('Jue 6 + Vie 7', 'Mié 5'), así que
 * el match es frágil por diseño. La alarma `sinDia` existe justamente para que se
 * vea cuándo un CSV exportó algo que no matchea — y esa alarma no vale más que
 * estos casos.
 */
import { describe, expect, it } from 'vitest'
import { DIAS, dia, esDiaConocido, etiquetaDia, habilitaDia } from '../api/_lib/puerta.js'

describe('habilitaDia', () => {
  it('una entrada de los dos días sirve para los dos', () => {
    expect(habilitaDia('Jue 6 + Vie 7', 'Jue')).toBe(true)
    expect(habilitaDia('Jue 6 + Vie 7', 'Vie')).toBe(true)
  })

  it('la del side event del miércoles no abre la puerta del jueves', () => {
    expect(habilitaDia('Mié 5', 'Jue')).toBe(false)
  })

  it('sin dato no habilita nada', () => {
    expect(habilitaDia('', 'Jue')).toBe(false)
    expect(habilitaDia(null, 'Jue')).toBe(false)
    expect(habilitaDia(undefined, 'Jue')).toBe(false)
  })
})

describe('esDiaConocido', () => {
  it('reconoce los tres días del evento, los atienda esta puerta o no', () => {
    expect(esDiaConocido('Jue 6 + Vie 7')).toBe(true)
    expect(esDiaConocido('Mié 5')).toBe(true)
  })

  it('un "Jueves 6" pasa, porque el match es por substring', () => {
    // Sale gratis y conviene que esté escrito: el `includes` no pide el formato
    // exacto, así que cualquier cosa que EMPIECE con la abreviatura entra sola.
    expect(esDiaConocido('Jueves 6')).toBe(true)
    expect(habilitaDia('Jueves 6', 'Jue')).toBe(true)
  })

  it('marca lo que no comparte ni la abreviatura', () => {
    // Éste es el agujero real, y el que la alarma `sinDia` tiene que atrapar: un
    // CSV que exporta la fecha en números no comparte ninguna letra con 'Jue', así
    // que esa gente queda invisible en las tres puertas y nadie se entera hasta el
    // día del evento.
    expect(esDiaConocido('6/8')).toBe(false)
    expect(esDiaConocido('2026-08-06')).toBe(false)
    expect(esDiaConocido('Thursday')).toBe(false)
    expect(esDiaConocido('')).toBe(false)
  })
})

describe('etiquetaDia', () => {
  it('arma el texto exacto que después se busca con includes', () => {
    for (const d of DIAS) {
      expect(habilitaDia(etiquetaDia(d), d.label)).toBe(true)
      expect(esDiaConocido(etiquetaDia(d))).toBe(true)
    }
  })
})

describe('dia', () => {
  it('resuelve por id y no se cae con basura', () => {
    expect(dia('jue')?.fecha).toBe('2026-08-06')
    expect(dia('JUE')?.fecha).toBe('2026-08-06')
    expect(dia('sab')).toBe(null)
    expect(dia('')).toBe(null)
    expect(dia(undefined)).toBe(null)
  })
})
