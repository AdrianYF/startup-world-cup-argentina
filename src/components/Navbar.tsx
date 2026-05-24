import { useState, useEffect } from 'react'
import { openTicketing } from '../lib/ticketing'

const links = [
  { href: '#ruta', label: 'Ruta de Evolución' },
  { href: '#pitch', label: 'Pitch Battle' },
  { href: '#builders', label: 'Builders Arena' },
  { href: '#agenda', label: 'Agenda' },
  { href: '#startups', label: 'Startups' },
  { href: '#voluntarios', label: 'Voluntarios' },
  { href: '#partners', label: 'Partners' },
  { href: '#speakers', label: 'Speakers' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // IntersectionObserver para marcar la sección activa (Don Norman: mapping)
  useEffect(() => {
    const sections = links.map(l => document.querySelector(l.href)).filter(Boolean) as HTMLElement[]
    if (!sections.length) return
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(`#${visible.target.id}`)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75] },
    )
    sections.forEach(s => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[#5848c4]/30
      ${scrolled ? 'bg-[#020618]/95 backdrop-blur-md h-14' : 'bg-[#020618]/60 backdrop-blur-sm h-16'}`}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

        <a href="#top" className="flex items-center gap-3" aria-label="Ir al inicio">
          <img
            src="/SWC-logo.png"
            alt="Startup World Cup Argentina"
            className={`w-auto transition-all duration-300 ${scrolled ? 'h-8' : 'h-10'}`}
          />
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-5 font-semibold">
          {links.map(l => {
            const isActive = activeSection === l.href
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? 'location' : undefined}
                className={`transition-colors relative ${scrolled ? 'text-xs' : 'text-sm'} ${
                  isActive ? 'text-[#75AADB]' : 'text-white hover:text-[#6c5ce7]'
                }`}
              >
                {l.label}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#75AADB]" />
                )}
              </a>
            )
          })}
          <button
            onClick={() => openTicketing('navbar')}
            aria-label="Conseguir tickets (abre en una nueva pestaña)"
            className={`bg-[#6c5ce7] text-white rounded-full hover:bg-[#5848c4] active:scale-95 transition-all cursor-pointer font-black ${scrolled ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
          >
            Tickets <span aria-hidden>↗</span>
          </button>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="lg:hidden text-white p-2 -mr-2 active:scale-95 transition-transform"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-drawer"
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <span className={`block h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-drawer"
          className="lg:hidden absolute top-full left-0 right-0 bg-[#020618]/98 backdrop-blur-md border-t border-[#5848c4]/30 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="flex flex-col p-4 gap-1">
            {links.map(l => {
              const isActive = activeSection === l.href
              return (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`transition-colors py-3 px-3 rounded-lg font-semibold text-base border-b border-white/5 ${
                    isActive
                      ? 'text-[#75AADB] bg-white/5'
                      : 'text-white hover:text-[#6c5ce7] hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </a>
              )
            })}
            <button
              onClick={() => { setMobileOpen(false); openTicketing('navbar-mobile') }}
              aria-label="Conseguir tickets (abre en una nueva pestaña)"
              className="mt-3 bg-[#6c5ce7] hover:bg-[#5848c4] active:scale-95 text-white rounded-full font-black py-3 cursor-pointer uppercase tracking-wide transition-all"
            >
              Conseguir Tickets <span aria-hidden>↗</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
