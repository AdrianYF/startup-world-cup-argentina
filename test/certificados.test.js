/**
 * Los helpers puros de `scripts/certificados.mjs`.
 *
 * El script lee el rol y el nombre del texto que `pdftotext` saca de cada PDF, y
 * del nombre arma el slug que termina en la URL del certificado y en la clave
 * con la que se actualiza el JSON. Si el parseo se corre una línea, sale un
 * certificado a nombre de «por su participación…»; si el slug cambia entre
 * corridas, la misma persona queda dos veces en el listado.
 */
import { describe, expect, it } from 'vitest'
import { parsearCertificado, slugify, tituloSiMayusculas } from '../scripts/certificados.mjs'

/** El texto crudo de `pdftotext`, recortado a la parte que importa. */
const bloque = (rol, nombre) => `BUENOS AIRES

CERTIFICADO
DE PARTICIPACIÓN
${rol}

SE OTORGA A:

${nombre}
por su participación en la Startup World Cup Argentina.
`

describe('slugify', () => {
  it('saca acentos y ñ, y une las palabras con guiones', () => {
    expect(slugify('Nicolás Pita Pellegrini')).toBe('nicolas-pita-pellegrini')
    expect(slugify('Ñandú Ávila')).toBe('nandu-avila')
  })

  it('no deja guiones en las puntas ni dobles', () => {
    expect(slugify('  Juan  Pérez ')).toBe('juan-perez')
  })
})

describe('tituloSiMayusculas', () => {
  it('pasa a Título sólo lo que viene todo en mayúsculas', () => {
    expect(tituloSiMayusculas('FRANCIS PERELMAN')).toBe('Francis Perelman')
    // Con una minúscula ya viene escrito a mano: se respeta.
    expect(tituloSiMayusculas('Santiago Matías Kunz')).toBe('Santiago Matías Kunz')
    expect(tituloSiMayusculas('Ana McDonald')).toBe('Ana McDonald')
  })
})

describe('parsearCertificado', () => {
  it('lee rol y nombre de un certificado de startup', () => {
    expect(parsearCertificado(bloque('STARTUP', 'Santiago Matías Kunz'))).toEqual({
      nombre: 'Santiago Matías Kunz',
      rol: 'startup',
    })
  })

  it('lee un jurado con el nombre en mayúsculas', () => {
    expect(parsearCertificado(bloque('JURADO', 'FRANCIS PERELMAN'))).toEqual({
      nombre: 'Francis Perelman',
      rol: 'jurado',
    })
  })

  it('corta si el PDF no es de esta plantilla', () => {
    expect(() => parsearCertificado('CERTIFICADO\nDE ASISTENCIA\n\nJuan Pérez')).toThrow(/DE PARTICIPACIÓN/)
    expect(() => parsearCertificado('DE PARTICIPACIÓN\nSTARTUP\n\nJuan Pérez')).toThrow(/SE OTORGA A:/)
  })
})
