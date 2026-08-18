import config from '../content/config.json'
import etapas from '../content/etapas.json'
import camino from '../content/camino.json'
import tickets from '../content/tickets.json'
import pitchBattle from '../content/pitchBattle.json'
import apoyan from '../content/apoyan.json'
import faqs from '../content/faqs.json'
import agenda from '../content/agenda.json'
import speakers from '../content/speakers.json'
import comite from '../content/comite.json'
import participan from '../content/participan.json'
import blog from '../content/blog.json'

/**
 * Datos que usa el landing (y que por lo tanto viven en el bundle inicial).
 *
 * `perks` y `startups` NO están acá a propósito: los consume código que sólo se
 * carga en rutas lazy, y al estar en este objeto se bundleaban igual en el
 * landing — KB de JSON que ningún visitante de la home necesita. Cada consumidor
 * los importa directo desde `src/content/`, así caen en el chunk de su ruta.
 *
 * `partners` y `buildersArena` estaban en esa misma lista: se fueron con sus
 * componentes, que no los importaba nadie.
 */
export const content = {
  config,
  etapas,
  camino,
  tickets,
  pitchBattle,
  apoyan,
  faqs,
  agenda,
  speakers,
  comite,
  participan,
  blog,
}

// Los tipos de perks/startups/partners viven en sus consumidores: derivarlos acá
// obligaría a importar el JSON como valor y volvería a meterlo en este bundle.
export type TicketPlan = (typeof tickets)[number]

// La agenda no se puede derivar con `typeof`: los slots sin speakers tienen
// `"speakers": []`, que TS tipa `never[]`, y la unión con los que sí tienen
// rompe el `.map()` en el componente. Se declara a mano.
export type AgendaSpeaker = { nombre: string; empresa: string; img: string }

/** Inscripción propia de un bloque (ej. los side events del día 1, con su Luma). */
export type AgendaCta = { label: string; url: string }

export type AgendaSlot = {
  hora: string
  titulo: string
  categoria: string
  speakers: AgendaSpeaker[]
  /**
   * La inscripción de ESTE bloque.
   *
   * Vive en el slot y no en el día porque los side events del miércoles son dos
   * eventos distintos, cada uno con su Luma: agrupados en el header del día,
   * había que leer los dos títulos y adivinar cuál botón correspondía a cuál.
   */
  cta?: AgendaCta
}

export type AgendaDay = {
  id: string
  fecha: string
  label: string
  subtitulo: string
  slots: AgendaSlot[]
}
export const agendaDias = agenda.dias as AgendaDay[]
export type Speaker = (typeof speakers)[number]
export type ComiteMiembro = (typeof comite)[number]
export type Participante = (typeof participan)[number]
