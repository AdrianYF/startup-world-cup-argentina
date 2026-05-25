import { useState } from 'react'
import { content } from '../lib/content'
import { openPartnerForm } from '../lib/ticketing'
import { Modal } from './ui/Modal'

/**
 * Partners — grid de 5 tiers visible al toque en desktop (sin carousel).
 * Mobile: stack vertical para no apretar.
 * Cada card muestra TODOS los features (no "+N más"). Highlight diferenciado por tier.
 */

const TIER_ACCENTS = [
  // visualmente distinguibles entre sí — uso de opacidad e intensidad de borde celeste
  { border: 'border-[#75AADB]', bg: 'bg-[#75AADB]/15', label: 'text-[#75AADB]' },
  { border: 'border-[#75AADB]/70', bg: 'bg-[#75AADB]/10', label: 'text-[#bcd5ea]' },
  { border: 'border-[#75AADB]/50', bg: 'bg-white/8', label: 'text-[#bcd5ea]' },
  { border: 'border-[#75AADB]/35', bg: 'bg-white/5', label: 'text-gray-300' },
  { border: 'border-white/15', bg: 'bg-white/[0.03]', label: 'text-gray-400' },
]

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

        {/* Grid: 1 col mobile, 2 cols tablet, 5 cols desktop (uno por tier) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
          {partners.map((p, i) => {
            const accent = TIER_ACCENTS[i] ?? TIER_ACCENTS[TIER_ACCENTS.length - 1]
            return (
              <button
                key={i}
                onClick={() => setPopup(i)}
                aria-label={`Ver detalles de ${p.titulo}`}
                className={`relative flex flex-col text-left rounded-2xl p-5 border ${accent.border} ${accent.bg} hover:bg-white/15 hover:border-[#75AADB] active:scale-[0.98] transition-[transform,background-color,border-color] duration-300 cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl" aria-hidden>{p.icon}</span>
                </div>
                <span className={`${accent.label} text-[10px] uppercase tracking-widest font-bold block mb-1`}>
                  {p.categoria}
                </span>
                <h3 className="text-white font-black text-base sm:text-lg leading-tight mb-2">
                  {p.titulo}
                </h3>
                <p className="text-gray-400 text-xs leading-snug mb-4 min-h-[2.5em]">
                  {p.descripcion}
                </p>

                <ul className="flex flex-col gap-1.5 mt-auto">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-1.5 text-gray-300 text-[11px] leading-snug">
                      <span className="text-[#75AADB] flex-shrink-0 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => openPartnerForm()}
            aria-label="Quiero ser Partner (contactanos por mail)"
            className="inline-block bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-8 py-3 rounded-full uppercase tracking-wide cursor-pointer transition-all"
          >
            Quiero ser Partner
          </button>
        </div>
      </div>

      {popup !== null && (
        <Modal onClose={() => setPopup(null)} titleId="partner-modal-title">
          <div className="text-4xl mb-3" aria-hidden>{partners[popup].icon}</div>
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

export default Partners
