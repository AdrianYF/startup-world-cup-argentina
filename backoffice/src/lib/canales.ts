/**
 * Los canales por los que una persona llega a la lista.
 *
 * `origen` viaja crudo desde la base —'web', 'luma', 'startupgrind', 'puerta'— y
 * cada pantalla lo traducía por su cuenta: la tabla decía «Venta propia», el chip
 * de la ficha «venta propia» en minúscula, la fila de la puerta «SG» y las
 * métricas mostraban `web` pelado. Cuatro formas de nombrar tres cosas.
 *
 * «web» pasa a llamarse **Mercado Pago**. «Venta propia» decía de quién es la
 * plata, no por dónde entró la persona, y dejaba un bucket que no se podía
 * comparar con nada: quedaban «los nuestros» y «los de afuera». Nombrado por el
 * medio real, los tres canales se leen en la misma unidad y se pueden cruzar
 * entre sí — que es lo que se mira cuando hay que decidir dónde poner las
 * entradas que quedan.
 *
 * «puerta» no es un canal de venta: son las altas que hace el staff en la
 * acreditación. Va último a propósito.
 */
export type Canal = {
  id: string
  nombre: string
  /** Para donde no entra el nombre: la fila de la puerta, con el celular. */
  sigla: string
}

export const CANALES: Canal[] = [
  { id: 'web', nombre: 'Mercado Pago', sigla: 'MP' },
  { id: 'luma', nombre: 'Luma', sigla: 'LUMA' },
  { id: 'startupgrind', nombre: 'Startup Grind', sigla: 'SG' },
  { id: 'puerta', nombre: 'Added at the door', sigla: 'DOOR' },
]

const POR_ID = new Map(CANALES.map(c => [c.id, c]))

/** El origen crudo no se esconde: si aparece uno nuevo, se muestra tal cual. */
export function nombreCanal(origen: string): string {
  return POR_ID.get(origen)?.nombre || origen
}

export function siglaCanal(origen: string): string {
  return POR_ID.get(origen)?.sigla || origen.slice(0, 4).toUpperCase()
}

/**
 * Ordena orígenes como están en `CANALES`.
 *
 * Sin esto el orden salía de `[...new Set()].sort()`, que es alfabético: Luma,
 * Startup Grind, web. Los filtros cambiaban de lugar según qué canales tuviera
 * el evento ese día.
 */
export function ordenarCanales(origenes: string[]): string[] {
  const orden = CANALES.map(c => c.id)
  const peso = (id: string) => {
    const i = orden.indexOf(id)
    return i < 0 ? orden.length : i
  }
  return [...origenes].sort((a, b) => peso(a) - peso(b) || a.localeCompare(b, 'es'))
}
