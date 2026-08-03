/**
 * El parser de CSV.
 *
 * Lo comparten tres consumidores —las funciones de `api/`, los scripts del CLI y
 * el export del backoffice— y es por donde entran las listas de Luma y de Startup
 * Grind. Un CSV mal parseado el día del evento es gente que no aparece en la
 * puerta, así que los casos de acá son los que de verdad llegan: exports de
 * Excel, comas adentro de los nombres de empresa, y saltos de línea embebidos.
 */
import { describe, expect, it } from 'vitest'
import { aCSV, parseCSV, parseCSVObjetos } from '../api/_lib/csv.js'

describe('parseCSV', () => {
  it('parte filas y columnas', () => {
    expect(parseCSV('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('se come el BOM que mete Excel', () => {
    // Sin esto la primera columna se llama '﻿email' y no matchea con ningún
    // alias del importador, así que la columna del mail «no existe».
    const [cabecera] = parseCSV('﻿email,nombre\nana@x.com,Ana')
    expect(cabecera[0]).toBe('email')
  })

  it('respeta las comas adentro de las comillas', () => {
    // El caso real: "Acme, S.A." en la columna de empresa. Un split por comas
    // parte esa fila al medio y corre todas las columnas siguientes, en silencio.
    expect(parseCSV('nombre,empresa\nAna,"Acme, S.A."')).toEqual([
      ['nombre', 'empresa'],
      ['Ana', 'Acme, S.A.'],
    ])
  })

  it('respeta los saltos de línea adentro de las comillas', () => {
    expect(parseCSV('a,b\n"uno\ndos",tres')).toEqual([['a', 'b'], ['uno\ndos', 'tres']])
  })

  it('las comillas se escapan duplicándolas', () => {
    expect(parseCSV('a\n"dijo ""hola"""')).toEqual([['a'], ['dijo "hola"']])
  })

  it('aguanta CRLF, que es lo que exporta Windows', () => {
    expect(parseCSV('a,b\r\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })
})

describe('parseCSVObjetos', () => {
  it('devuelve columnas y filas como objetos', () => {
    const r = parseCSVObjetos('email,nombre\nana@x.com,Ana\nbeto@x.com,Beto')
    expect(r.columnas).toEqual(['email', 'nombre'])
    expect(r.filas).toEqual([
      { email: 'ana@x.com', nombre: 'Ana' },
      { email: 'beto@x.com', nombre: 'Beto' },
    ])
  })
})

describe('aCSV', () => {
  it('vuelve a citar lo que hace falta, así el ida y vuelta cierra', () => {
    const csv = aCSV(['nombre', 'empresa'], [{ nombre: 'Ana', empresa: 'Acme, S.A.' }])
    expect(parseCSV(csv)).toEqual([['nombre', 'empresa'], ['Ana', 'Acme, S.A.']])
  })
})
