import { content } from '../lib/content'
import { openTicketing, openStartupForm, openPartnerForm } from '../lib/ticketing'

/**
 * Footer dark con cierre fuerte:
 *  1. Final CTA strip (Aplica Startup + Ser Partner) como último punto de conversión.
 *  2. Logo wordmark consistente con navbar (no PNG colorido).
 *  3. 3 columnas: Brand · Navegación · Contacto/Social.
 *  4. Recordatorio fecha+lugar.
 *  5. Línea legal (placeholder hasta que existan las páginas).
 */

const NAV_LINKS = [
  { href: '#ruta', label: 'Ruta' },
  { href: '#pitch', label: 'Pitch Battle' },
  { href: '#agenda', label: 'Agenda' },
  { href: '#speakers', label: 'Speakers' },
  { href: '#partners', label: 'Partners' },
  { href: '#faq', label: 'FAQ' },
] as const

const LEGAL_LINKS = [
  { href: '#bases', label: 'Bases y Condiciones' },
  { href: '#privacidad', label: 'Privacidad' },
  { href: '#terminos', label: 'Términos' },
] as const

function Footer() {
  const cfg = content.config
  const links = cfg.links
  const fechas = cfg.evento.fechas
  const hasSocial = Boolean(links.linkedin || links.instagram || links.twitter)

  return (
    <footer className="relative bg-[#020618] text-white">

      {/* Separador celeste — coherente con el resto de secciones del sitio */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      {/* ═══ FINAL CTA STRIP ═══ */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-2xl sm:text-3xl font-black uppercase leading-tight text-center md:text-left">
              <span className="text-white">¿Listo para el </span>
              <span className="text-[#75AADB]">Mundial</span>
              <span className="text-white">?</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => openStartupForm()}
                aria-label="Aplicá tu Startup (abre formulario en una nueva pestaña)"
                className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-sm sm:text-base px-6 sm:px-7 py-3 min-h-[48px] rounded-full transition-[transform,background-color] uppercase tracking-wide cursor-pointer whitespace-nowrap"
              >
                Aplicá Startup <span aria-hidden>↗</span>
              </button>
              <button
                onClick={() => openPartnerForm()}
                aria-label="Quiero ser Partner (contactanos)"
                className="border border-white/30 hover:border-[#75AADB] hover:bg-white/5 active:scale-95 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 min-h-[48px] rounded-full transition-[transform,background-color,border-color] uppercase tracking-wide cursor-pointer whitespace-nowrap"
              >
                Ser Partner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COLUMNAS ═══ */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-12">

          {/* Brand */}
          <div className="md:col-span-5">
            {/* Wordmark consistente con navbar */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="font-black text-white text-3xl leading-none tracking-tight">SWC</span>
              <span className="font-bold text-[#75AADB] uppercase tracking-[0.2em] leading-none text-xs">
                Argentina·26
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed font-medium max-w-[42ch] mb-6">
              La competencia de startups más grande del mundo aterriza en
              Buenos Aires para potenciar el ecosistema regional.
            </p>

            {/* Recordatorio fecha + lugar */}
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-[#75AADB]">
              <CalendarIcon />
              {fechas}
            </div>
          </div>

          {/* Navegación */}
          <nav className="md:col-span-3" aria-label="Navegación del footer">
            <h4 className="text-gray-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-5">
              Navegación
            </h4>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white hover:text-[#75AADB] text-[15px] font-medium transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-2">
                <button
                  onClick={() => openTicketing('footer')}
                  aria-label="Comprar tickets (abre Startup Grind en nueva pestaña)"
                  className="inline-flex items-center gap-2 text-[#75AADB] hover:text-white text-[15px] font-bold transition-colors duration-200 cursor-pointer"
                >
                  Comprar tickets
                  <span aria-hidden>↗</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Contacto + Social */}
          <div className="md:col-span-4">
            <h4 className="text-gray-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-5">
              Contacto
            </h4>
            <ul className="flex flex-col gap-3 mb-7">
              <li>
                <a
                  href={`mailto:${links.emailGeneral}`}
                  className="inline-flex items-center gap-2 text-white hover:text-[#75AADB] text-[15px] font-medium transition-colors duration-200"
                >
                  <MailIcon />
                  {links.emailGeneral}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${links.emailPartners}`}
                  className="inline-flex items-center gap-2 text-white hover:text-[#75AADB] text-[15px] font-medium transition-colors duration-200"
                >
                  <MailIcon />
                  Partnerships
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-gray-400 text-[15px] font-medium">
                <PinIcon />
                Vedia, Buenos Aires
              </li>
            </ul>

            {hasSocial && (
              <div>
                <h4 className="text-gray-400 text-[11px] uppercase tracking-[0.18em] font-semibold mb-3">
                  Seguinos
                </h4>
                <div className="flex gap-2">
                  {links.linkedin && (
                    <SocialLink href={links.linkedin} label="LinkedIn">
                      <LinkedInIcon />
                    </SocialLink>
                  )}
                  {links.instagram && (
                    <SocialLink href={links.instagram} label="Instagram">
                      <InstagramIcon />
                    </SocialLink>
                  )}
                  {links.twitter && (
                    <SocialLink href={links.twitter} label="X (Twitter)">
                      <XIcon />
                    </SocialLink>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ NEWSLETTER ═══ */}
        <NewsletterSignup />

        {/* ═══ COPYRIGHT + LEGAL ═══ */}
        <div className="pt-6 mt-10 text-xs text-gray-400 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p>© 2026 Startup World Cup Argentina · Todos los derechos reservados</p>
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
            {LEGAL_LINKS.map(l => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="hover:text-[#75AADB] transition-colors duration-200"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

function NewsletterSignup() {
  // Handler placeholder hasta que integremos Mailchimp/Loops
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = data.get('email')
    if (typeof email === 'string' && email.includes('@')) {
      e.currentTarget.reset()
      const status = e.currentTarget.querySelector('[data-status]') as HTMLElement | null
      if (status) {
        status.textContent = '✓ Te avisamos cuando haya novedades.'
        setTimeout(() => { if (status) status.textContent = '' }, 6000)
      }
    }
  }

  return (
    <div className="border-t border-white/10 pt-10 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <h4 className="text-white text-lg sm:text-xl font-black uppercase tracking-tight leading-tight">
            Suscribite al newsletter
          </h4>
          <p className="text-gray-400 text-sm mt-1">
            Novedades del evento, fechas de aplicación y anuncios de speakers.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 w-full"
          aria-label="Suscripción al newsletter"
        >
          <label className="flex-1 relative">
            <span className="sr-only">Email</span>
            <input
              type="email"
              name="email"
              required
              placeholder="tu@email.com"
              className="w-full bg-white/5 border border-white/15 focus:border-[#75AADB] focus:bg-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-[border-color,background-color] duration-200"
            />
          </label>
          <button
            type="submit"
            className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-full transition-[transform,background-color] uppercase tracking-wide cursor-pointer whitespace-nowrap"
          >
            Recibí novedades
          </button>
        </form>
      </div>
      <p
        data-status
        aria-live="polite"
        className="text-[#75AADB] text-xs mt-3 min-h-[1em] font-bold"
      />
    </div>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-[#75AADB] text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
    >
      {children}
    </a>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 18H6V10h2.5v8zM7.25 8.7a1.45 1.45 0 1 1 0-2.9 1.45 1.45 0 0 1 0 2.9zM18 18h-2.5v-4.2c0-1-.02-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V18H10V10h2.4v1.1h.03c.33-.6 1.14-1.3 2.34-1.3 2.5 0 3.23 1.65 3.23 3.8V18z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default Footer
