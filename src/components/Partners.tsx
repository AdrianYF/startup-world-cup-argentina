import { useRef, useState } from 'react'
import partnersJson from '../content/partners.json'
import { openPartnerForm } from '../lib/ticketing'
import { Modal } from './ui/Modal'

/**
 * Partners — grid de 5 tiers visible al toque en desktop (sin carousel).
 * Mobile: stack vertical para no apretar.
 * Cada card muestra TODOS los features (no "+N más"). Highlight diferenciado por tier.
 */

// Color por tier — patrón SWC.com (cada tier tiene su color brand)
const TIER_COLORS = [
  { hex: '#ff7675', name: 'coral' },   // Premium / Presenting
  { hex: '#6c5ce7', name: 'purple' },  // Pro / Premier
  { hex: '#007bff', name: 'blue' },    // Platinum
  { hex: '#cbd5e1', name: 'slate' },   // Gold
] as const

function Partners() {
  const partners = partnersJson
  const [popup, setPopup] = useState<number | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  function slide(dir: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section id="partners" className="relative py-16 sm:py-24 bg-[#020618] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
            <span className="text-white">QUIERO SER </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'var(--gradient-cta)' }}
            >
              PARTNER
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada categoría combina visibilidad, innovación abierta y oportunidades reales de negocio.
          </p>
        </div>

        {/* Slider horizontal con snap + arrows */}
        <div className="relative">
          {/* Botón prev */}
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="Anterior"
            className="hidden sm:flex absolute -left-2 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#020618]/80 backdrop-blur-sm border border-[#75AADB]/30 hover:border-[#75AADB]/70 hover:bg-[#020618] text-white items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#75AADB]/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          {/* Botón next */}
          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="Siguiente"
            className="hidden sm:flex absolute -right-2 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#020618]/80 backdrop-blur-sm border border-[#75AADB]/30 hover:border-[#75AADB]/70 hover:bg-[#020618] text-white items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg shadow-[#75AADB]/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-2 [justify-content:safe_center] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
          {partners.map((p, i) => {
            const color = (TIER_COLORS[i] ?? TIER_COLORS[TIER_COLORS.length - 1]).hex
            return (
              <div
                key={i}
                className="relative snap-center shrink-0 w-[85%] sm:w-[48%] lg:w-[400px]"
              >
                <div
                  className="relative group flex flex-col justify-between h-full p-6 md:p-10 rounded-3xl border border-white/10 overflow-hidden"
                  style={{ background: `linear-gradient(to bottom, ${color}33, transparent)` }}
                >
                <div>
                  {/* Icon arriba sin box — directo con color del tier */}
                  <div className="flex justify-between items-start mb-6">
                    <div style={{ color }}>
                      <TierIcon name={p.icon} className="w-8 h-8" />
                    </div>
                  </div>

                  {/* Título — usa la categoría en Title Case */}
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 normal-case">
                    {p.categoria
                      .toLowerCase()
                      .replace(/\b\w/g, c => c.toUpperCase())}
                  </h3>

                  {p.descripcion && (
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">{p.descripcion}</p>
                  )}

                  {/* Features con dots violeta uniformes */}
                  <ul className="space-y-4 mb-10 text-slate-300">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-3 text-sm leading-snug">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#75AADB] mt-1.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                </div>

              </div>
            )
          })}
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => openPartnerForm()}
            aria-label="Quiero ser Partner (contactanos por mail)"
            style={{ backgroundImage: 'var(--gradient-cta)' }}
            className="inline-block active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black px-8 py-3 rounded-full uppercase tracking-wide cursor-pointer transition-all hover:scale-105 shadow-lg shadow-[#6c5ce7]/30"
          >
            Quiero ser Partner
          </button>
        </div>
      </div>

      {popup !== null && (
        <Modal onClose={() => setPopup(null)} titleId="partner-modal-title">
          <div className="mb-3">
            <TierIcon name={partners[popup].icon} className="w-10 h-10 text-white" />
          </div>
          <span className="text-[#bcd5ea] text-xs uppercase tracking-widest font-bold mb-2 block">{partners[popup].categoria}</span>
          <h3 id="partner-modal-title" className="text-white font-black text-2xl mb-3">{partners[popup].titulo}</h3>
          <ul className="flex flex-col gap-2 mb-4">
            {partners[popup].features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-200 text-sm">
                <span className="text-[#bcd5ea] mt-0.5" aria-hidden>✓</span>{f}
              </li>
            ))}
          </ul>
          <p className="text-gray-300 leading-relaxed mb-6 text-sm">{partners[popup].popup}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setPopup(null); openPartnerForm() }}
              aria-label="Contactar para ser partner"
              className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-6 py-2 rounded-full transition-all text-sm cursor-pointer"
            >
              Contactar
            </button>
            <button
              onClick={() => setPopup(null)}
              className="border border-white/30 text-white hover:border-white/60 active:scale-95 font-bold px-6 py-2 rounded-full transition-all text-sm cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

/**
 * TierIcon — íconos Lucide (line-style) en blanco vía currentColor.
 * Mapea el campo `icon` del JSON al SVG correspondiente.
 */
function TierIcon({ name, className }: { name: string; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor' as const,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
  }
  switch (name) {
    case 'crown':
      return (
        <svg {...common}>
          <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
          <path d="M5 21h14" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      )
    case 'gem':
      return (
        <svg {...common}>
          <path d="M6 3h12l4 6-10 13L2 9Z" />
          <path d="M11 3 8 9l4 13 4-13-3-6" />
          <path d="M2 9h20" />
        </svg>
      )
    case 'award':
      return (
        <svg {...common}>
          <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
          <circle cx="12" cy="8" r="6" />
        </svg>
      )
    default:
      return null
  }
}

export default Partners
