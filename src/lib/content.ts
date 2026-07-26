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
import perks from '../content/perks.json'
import comite from '../content/comite.json'
import startups from '../content/startups.json'
import participan from '../content/participan.json'

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
  perks,
  comite,
  startups,
  participan,
}

export type TicketPlan = (typeof tickets)[number]
export type Partner = (typeof partners)[number]
export type AgendaSlot = (typeof agenda.dias)[number]['slots'][number]
export type AgendaDay = (typeof agenda.dias)[number]
export type Speaker = (typeof speakers)[number]
export type Perk = (typeof perks)[number]
export type ComiteMiembro = (typeof comite)[number]
export type Startup = (typeof startups)[number]
export type Participante = (typeof participan)[number]
