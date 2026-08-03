/**
 * El cargo de servicio.
 *
 * Los dos números de abajo no son inventados para el test: están escritos en el
 * comentario de `precios.js` porque son los que publica Startup Grind. La fórmula
 * se despejó de ellos, y la razón de que exista es que comprar por acá cueste
 * exactamente lo mismo que por allá. Si alguna vez dejan de dar, el cargo se
 * separó del canal con el que tiene que coincidir.
 */
import { describe, expect, it } from 'vitest'
import { cargoServicio, desglose } from '../api/_lib/precios.js'

describe('cargoServicio', () => {
  it('reproduce al centavo los precios de Startup Grind', () => {
    expect(cargoServicio(35000)).toBe(1952.27)
    expect(cargoServicio(65000)).toBe(3624.77)
  })
})

describe('desglose', () => {
  it('cobra un cargo por entrada, no uno por compra', () => {
    const una = desglose(35000, 1)
    const tres = desglose(35000, 3)
    expect(tres.cargo).toBe(Math.round(una.cargoUnitario * 3 * 100) / 100)
    expect(tres.subtotal).toBe(35000 * 3)
  })

  it('el total cierra con el subtotal más el cargo', () => {
    for (const cantidad of [1, 2, 3, 4, 5]) {
      const d = desglose(65000, cantidad)
      expect(d.total).toBe(Math.round((d.subtotal + d.cargo) * 100) / 100)
    }
  })

  it('una entrada sola es el caso de la card', () => {
    expect(desglose(35000)).toEqual({
      precioUnitario: 35000,
      cargoUnitario: 1952.27,
      subtotal: 35000,
      cargo: 1952.27,
      total: 36952.27,
    })
  })
})
