import { content } from './content'

type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: GtagFn
  }
}

let initialized = false

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  const gaId = content.config.analytics?.googleAnalyticsId?.trim()
  if (!gaId) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', gaId, {
    anonymize_ip: content.config.analytics?.anonymizeIp ?? true,
    send_page_view: true,
  })

  initialized = true
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

/**
 * Vista de página en navegación client-side. `gtag('config')` sólo manda el
 * page_view de la carga inicial, así que sin esto las rutas a las que se llega
 * navegando (ej. /mystery-box desde la home) no se cuentan.
 */
export function trackPageView(path: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}
