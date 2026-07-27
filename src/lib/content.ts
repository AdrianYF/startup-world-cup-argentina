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

/**
 * Datos que usa el landing (y que por lo tanto viven en el bundle inicial).
 *
 * `perks`, `startups`, `partners` y `buildersArena` NO están acá a propósito:
 * los consume código que sólo se carga en rutas lazy (o componentes hoy sin
 * uso), y al estar en este objeto se bundleaban igual en el landing — 33 KB de
 * JSON que ningún visitante de la home necesita. Cada consumidor los importa
 * directo desde `src/content/`, así caen en el chunk de su propia ruta.
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
}

// Los tipos de perks/startups/partners viven en sus consumidores: derivarlos acá
// obligaría a importar el JSON como valor y volvería a meterlo en este bundle.
export type TicketPlan = (typeof tickets)[number]
export type AgendaSlot = (typeof agenda.dias)[number]['slots'][number]
export type AgendaDay = (typeof agenda.dias)[number]
export type Speaker = (typeof speakers)[number]
export type ComiteMiembro = (typeof comite)[number]
export type Participante = (typeof participan)[number]
