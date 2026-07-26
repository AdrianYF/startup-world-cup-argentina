import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { openTicketing } from '../lib/ticketing'

// Cada ítem es una ruta propia.
const links = [
  { to: '/road-to-swc', label: 'Road to SWC' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/pitch-battle', label: 'Pitch Battle' },
  { to: '/startups', label: 'Startups' },
  { to: '/voluntarios', label: 'Voluntarios' },
  { to: '/galeria', label: 'Galería' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const esActiva = (to: string) => !to.startsWith('/#') && pathname === to

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const ctaAria = 'Conseguir entradas (abre Startup Grind en una nueva pestaña)'

  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[#5a93c5]/30
      ${scrolled ? 'bg-[#020618]/95 backdrop-blur-md h-14' : 'bg-[#020618]/60 backdrop-blur-sm h-16'}`}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            aria-label="Startup World Cup Argentina - ir al inicio"
            className="flex items-baseline gap-2"
          >
            <span
              className={`font-black text-white leading-none tracking-tight transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}
            >
              SWC
            </span>
            <span
              className={`text-[#75AADB] font-bold uppercase tracking-[0.2em] leading-none transition-all duration-300 ${scrolled ? 'text-[10px]' : 'text-xs'}`}
            >
              Argentina 26
            </span>
          </Link>

          <span
            aria-hidden
            className={`text-white/30 font-light transition-all duration-300 ${scrolled ? 'text-xl' : 'text-2xl'}`}
          >
            |
          </span>

          <a
            href="https://www.startupgrind.com/buenos-aires/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Startup Grind Buenos Aires (abre en nueva pestaña)"
            className="flex items-center"
          >
            <img
              src="/SGBA-logo.png"
              alt="Startup Grind Buenos Aires"
              className={`w-auto transition-all duration-300 ${scrolled ? 'h-12' : 'h-14'}`}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </a>
        </div>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-5 font-semibold">
          {links.map(l => {
            const isActive = esActiva(l.to)
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors relative ${scrolled ? 'text-xs' : 'text-sm'} ${
                  isActive ? 'text-[#75AADB]' : 'text-white hover:text-[#75AADB]'
                }`}
              >
                {l.label}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#75AADB]" />
                )}
              </Link>
            )
          })}
          <button
            onClick={() => openTicketing('navbar')}
            aria-label={ctaAria}
            style={{ backgroundImage: 'var(--gradient-cta)' }}
            className={`text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] rounded-full active:scale-95 transition-all cursor-pointer font-black hover:scale-105 whitespace-nowrap ${scrolled ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
          >
            Entradas
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
          className="lg:hidden absolute top-full left-0 right-0 bg-[#020618]/98 backdrop-blur-md border-t border-[#5a93c5]/30 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <div className="flex flex-col p-4 gap-1">
            {links.map(l => {
              const isActive = esActiva(l.to)
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`transition-colors py-3 px-3 rounded-lg font-semibold text-base border-b border-white/5 ${
                    isActive
                      ? 'text-[#75AADB] bg-white/5'
                      : 'text-white hover:text-[#75AADB] hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
            <button
              onClick={() => { setMobileOpen(false); openTicketing('navbar-mobile') }}
              aria-label={ctaAria}
              style={{ backgroundImage: 'var(--gradient-cta)' }}
              className="mt-3 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] rounded-full font-black py-3 cursor-pointer uppercase tracking-wide transition-all"
            >
              Entradas
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
