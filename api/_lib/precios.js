// Cargo de servicio.
//
// Espeja el de Startup Grind para que comprar por acá cueste exactamente lo
// mismo que por allá: si un canal saliera más barato, competiríamos con nuestro
// propio partner.
//
// La fórmula se despejó de los dos precios que publica Startup Grind, y los
// reproduce al centavo:
//
//   $35.000 → $1.952,27      35000 × 0,05575 + 1,02 = 1952,27  ✓
//   $65.000 → $3.624,77      65000 × 0,05575 + 1,02 = 3624,77  ✓
//
// Es por entrada, no por compra: dos entradas pagan dos cargos.
const PORCENTAJE = 0.05575
const FIJO = 1.02

/** Cargo de UNA entrada de ese precio, redondeado al centavo. */
export function cargoServicio(precioArs) {
  return Math.round((precioArs * PORCENTAJE + FIJO) * 100) / 100
}

/**
 * Desglose de una compra. Es lo que se le muestra al comprador y lo que se le
 * manda a Mercado Pago, así que sale de un solo lugar: si el modal y el cobro
 * calcularan cada uno lo suyo, tarde o temprano dirían cosas distintas.
 */
export function desglose(precioArs, cantidad = 1) {
  const cargoUnitario = cargoServicio(precioArs)
  const subtotal = precioArs * cantidad
  const cargo = Math.round(cargoUnitario * cantidad * 100) / 100
  return {
    precioUnitario: precioArs,
    cargoUnitario,
    subtotal,
    cargo,
    total: Math.round((subtotal + cargo) * 100) / 100,
  }
}
