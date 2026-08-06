/** Lo que devuelve `api/puerta.js`. Un solo lugar donde mirar la forma de los datos. */

export type Dia = {
  id: string
  /** ISO corto, `2026-08-06`. Es lo que se guarda en `checkins.dia`. */
  fecha: string
  /** Lo que hay que buscar dentro del texto libre de `dias`: 'Jue'. */
  label: string
  nombre: string
}

/** Una fila de la lista = una persona. Quien compró tres aparece tres veces. */
export type Persona = {
  id: string
  /** 'web' | 'luma' | 'startupgrind' */
  origen: string
  nombre: string | null
  /** El del comprador cuando la compra fue de varias entradas. */
  email: string
  telefono: string | null
  empresa: string | null
  entrada: string
  /** Texto libre del canal: 'Jue 6 + Vie 7', 'Mié 5'. */
  dias: string
  /** Compró la MISMA entrada en Startup Grind y en la web: revisar reembolso. */
  pagoDoble?: boolean
}

/**
 * Si esa entrada es VIP.
 *
 * Por el texto y no por una lista de etiquetas conocidas: cada canal la nombra
 * a su manera —«Entrada VIP» en Startup Grind, «Invitado VIP» en Luma, «Entrada
 * VIP» en la venta propia— y una lista fija se desactualiza en silencio la
 * próxima vez que alguien crea una tanda con otro nombre. Lo que no cambia es
 * que diga VIP.
 *
 * Vive acá y no en cada pantalla porque lo usan la lista, la ficha y Ventas: si
 * una lo decidiera distinto, la misma persona sería VIP en un lado y no en otro.
 */
export const esVip = (entrada: string | null | undefined) => /vip/i.test(entrada || '')

/**
 * Qué dice la chapa dorada: «VIP + comida» o «VIP» a secas.
 *
 * No todos los VIP comen. La comida viene con la Entrada VIP —el producto que
 * se vende, en Startup Grind y en la venta propia— y no con las invitaciones
 * VIP de Luma, que dan acceso pero no cubierto. En la puerta esa diferencia se
 * resuelve en dos segundos si está en la chapa, y en una discusión incómoda si
 * hay que ir a preguntar.
 *
 * Se distingue por «invitado» y no por el precio porque el precio no llega a
 * esta pantalla, y porque tampoco alcanzaría: una Entrada VIP entregada con
 * código de cortesía sale $0 y sigue siendo la entrada que incluye la comida.
 *
 * Devuelve `null` para quien no es VIP: no hay chapa que poner.
 */
export function etiquetaVip(entrada: string | null | undefined): string | null {
  if (!esVip(entrada)) return null
  return /invitad/i.test(entrada || '') ? 'VIP' : 'VIP + comida'
}

export type Checkin = {
  id: string
  /** El `id` de la persona en la lista. */
  ref: string
  origen: string
  por: string | null
  anuladoEn: string | null
  creadoEn: string
}

export type Lista = {
  dia: Dia
  dias: Dia[]
  /** Marca de tiempo para pedir el próximo delta. */
  cursor: string
  personas: Persona[]
  checkins: Checkin[]
  /**
   * Cuántas filas de la lista no caen en NINGÚN día del evento.
   *
   * `dias` es texto libre que escribe cada canal, así que un CSV que exporte
   * "6/8" deja a esa gente invisible en las tres puertas. El número está para
   * que el problema se vea antes de que alguien quede afuera.
   */
  sinDia?: number
}

/** Lo que trae un delta: lo que cambió desde el cursor anterior. */
export type Delta = {
  cursor: string
  checkins: Checkin[]
  personas: Persona[]
}
