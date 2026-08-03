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
