import { content } from '../lib/content'
import { openTicketing } from '../lib/ticketing'

/**
 * Footer dark con contraste celeste — 5-color system:
 * bg #020618 · white · celeste #75AADB · muted gray-400 · border white/10.
 * Layout 3-col (Brand / Nav / Contacto+Social) — Don Norman: jerarquía clara, CTA prominente, sin redundancia.
 */

const NAV_LINKS = [
  { href: '#ruta', label: 'Ruta' },
  { href: '#pitch', label: 'Pitch Battle' },
  { href: '#partners', label: 'Partners' },
  { href: '#faq', label: 'FAQ' },
] as const

function Footer() {
  const links = content.config.links
  const hasSocial = Boolean(links.linkedin || links.instagram || links.twitter)

  return (
    <footer className="bg-[#020618] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <img
              src="/SWC-logo.png"
              alt="Startup World Cup Argentina"
              className="h-14 w-auto mb-5"
            />
            <p className="text-gray-400 text-sm leading-relaxed font-medium max-w-[42ch]">
              La competencia de startups más grande del mundo aterriza en
              Buenos Aires para potenciar el ecosistema regional.
            </p>
          </div>

          {/* Navegación esencial */}
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#75AADB] hover:bg-[#5a93c5] active:scale-[0.97] text-white text-sm font-semibold transition-[transform,background-color] duration-200 cursor-pointer"
                >
                  Comprar tickets
                  <span aria-hidden>→</span>
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

        <div className="pt-6 text-xs text-gray-400 border-t border-white/10">
          <p>© 2026 Startup World Cup Argentina</p>
        </div>
      </div>
    </footer>
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
