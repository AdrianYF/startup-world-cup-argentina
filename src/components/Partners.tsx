import { useState } from 'react'
import { content } from '../lib/content'
import { openPartnerForm } from '../lib/ticketing'
import { Modal } from './ui/Modal'

/**
 * Partners — grid de 5 tiers visible al toque en desktop (sin carousel).
 * Mobile: stack vertical para no apretar.
 * Cada card muestra TODOS los features (no "+N más"). Highlight diferenciado por tier.
 */

// El primer tier (Premium) es el highlighted — mismo tratamiento que el plan destacado de Tickets.
const HIGHLIGHTED_TIER_INDEX = 0
const HIGHLIGHT_LABEL = 'TOP TIER'

function Partners() {
  const partners = content.partners
  const [popup, setPopup] = useState<number | null>(null)

  return (
    <section id="partners" className="relative py-16 sm:py-24 bg-[#020618] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
            <span className="text-white">QUIERO SER </span>
            <span className="text-[#75AADB]">PARTNER</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada categoría combina visibilidad, innovación abierta y oportunidades reales de negocio.
          </p>
        </div>

        {/* Grid: 1 col mobile, 2 cols tablet, 4 cols desktop (uno por tier) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {partners.map((p, i) => {
            const isHighlighted = i === HIGHLIGHTED_TIER_INDEX
            return (
              <div key={i} className="relative group">
                {/* Halo coloreado detrás — versión delicada (baja opacidad, fade lento) */}
                <div
                  aria-hidden
                  className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-[#75AADB]/15 via-[#6c5ce7]/10 to-[#ff7675]/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out pointer-events-none ${
                    isHighlighted ? 'lg:scale-105 mt-4 lg:mt-0' : ''
                  }`}
                />
                <div
                  className={`relative flex flex-col h-full rounded-2xl p-6 sm:p-8 border-[0.5px] transition-all duration-500 ease-out group-hover:border-[#75AADB]/35 group-hover:-translate-y-0.5 ${
                    isHighlighted
                      ? 'bg-white/10 border-[#75AADB]/35 lg:scale-105 mt-4 lg:mt-0 shadow-[0_0_20px_-6px_rgba(117,170,219,0.2)] group-hover:shadow-[0_6px_24px_-6px_rgba(117,170,219,0.3)] group-hover:bg-white/[0.12]'
                      : 'bg-white/5 border-[#75AADB]/10 shadow-[0_0_14px_-8px_rgba(117,170,219,0.1)] group-hover:shadow-[0_6px_20px_-8px_rgba(117,170,219,0.22)] group-hover:bg-white/[0.07]'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-[#75AADB] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                        {HIGHLIGHT_LABEL}
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <TierIcon name={p.icon} className="w-8 h-8 text-[#75AADB]" />
                  </div>

                  <span className="text-[#75AADB] text-[10px] uppercase tracking-[0.2em] font-black block mb-1">
                    {p.categoria}
                  </span>
                  <h3 className="text-white font-black text-2xl mb-3">{p.titulo}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{p.descripcion}</p>

                  <ul className="flex flex-col gap-3 mb-8">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-gray-300 text-sm leading-snug">
                        <span className="text-[#75AADB] flex-shrink-0 mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              </div>
            )
          })}
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
