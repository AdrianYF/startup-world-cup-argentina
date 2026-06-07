import config from '../content/config.json'
import etapas from '../content/etapas.json'
import camino from '../content/camino.json'
import tickets from '../content/tickets.json'
import pitchBattle from '../content/pitchBattle.json'
import buildersArena from '../content/buildersArena.json'
import partners from '../content/partners.json'
import apoyan from '../content/apoyan.json'
import faqs from '../content/faqs.json'
import agenda from '../content/agenda.json'
import speakers from '../content/speakers.json'

export const content = {
  config,
  etapas,
  camino,
  tickets,
  pitchBattle,
  buildersArena,
  partners,
  apoyan,
  faqs,
  agenda,
  speakers,
}

export type TicketPlan = (typeof tickets)[number]
export type Partner = (typeof partners)[number]
export type AgendaSlot = (typeof agenda.dias)[number]['slots'][number]
export type AgendaDay = (typeof agenda.dias)[number]
export type Speaker = (typeof speakers)[number]
