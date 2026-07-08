import { content } from './content'
import { trackEvent } from './analytics'
import { toast } from './toast'

export function openTicketing(source: string = 'web') {
  const base = content.config.links.startupGrindUrl
  if (!base) {
    toast('El ticketing estará disponible muy pronto.', { tone: 'warn' })
    return
  }
  const url = `${base}?showtickets=true&r=tickets&utm_source=${encodeURIComponent(source)}`
  trackEvent('ticket_click', { source })
  window.open(url, '_blank', 'noopener,noreferrer')
}

function openExternal(url: string | undefined | null, fallbackMsg: string) {
  if (!url) {
    toast(fallbackMsg, { tone: 'warn' })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function scrollToAgenda(source: string = 'convocatoria_cerrada') {
  trackEvent('ver_agenda_click', { source })
  // defer: si venimos del drawer mobile, dejar que se libere el lock de scroll
  // (body overflow:hidden) antes de scrollear, sino el scroll queda trabado.
  setTimeout(() => {
    document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' })
  }, 0)
}

export function openStartupForm() {
  if (!content.config.convocatoria.startupsAbierta) {
    scrollToAgenda('convocatoria_cerrada')
    return
  }
  const url = content.config.links.formStartup
  trackEvent('apply_startup_click', { has_form: Boolean(url) })
  openExternal(url, 'La aplicación de startups abre pronto. Volvé en unos días.')
}

export function openVolunteerForm() {
  const url = content.config.links.formVoluntario
  trackEvent('apply_volunteer_click', { has_form: Boolean(url) })
  openExternal(url, 'El formulario de voluntarios abre pronto. ¡Gracias por querer sumarte!')
}

export function openPartnerForm() {
  const url = content.config.links.formPartner
  trackEvent('apply_partner_click', { has_form: Boolean(url) })
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  window.location.href = `mailto:${content.config.links.emailPartners}?subject=Quiero ser Partner`
}
