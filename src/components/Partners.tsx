import { useState } from 'react'
import { content } from '../lib/content'
import { openPartnerForm } from '../lib/ticketing'
import { Modal } from './ui/Modal'

/**
 * Partners — cards estilo Tickets: grid 1/2/5, sin emojis,
 * primer tier destacado con badge "DESTACADO" y CTA "Ver detalle" por card.
 */

function Partners() {
  const partners = content.partners
  const [popup, setPopup] = useState<number | null>(null)

  return (
    <section id="partners" className="relative py-16 sm:py-24 bg-[#020618] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
            <span className="text-white">QUIERO SER </span>
            <span className="text-[#75AADB]">PARTNER</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada categoría combina visibilidad, innovación abierta y oportunidades reales de negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
          {partners.map((p, i) => {
            const isHighlight = i === 0
            return (
              <div key={i} className="relative">
                <div
                  className={`relative h-full flex flex-col rounded-2xl p-6 sm:p-7 border-[0.5px] transition-all ${
                    isHighlight
                      ? 'bg-white/10 border-[#75AADB]/35 sm:scale-105 mt-4 sm:mt-0 shadow-[0_0_20px_-6px_rgba(117,170,219,0.2)]'
                      : 'bg-white/5 border-[#75AADB]/10 hover:border-[#75AADB]/25 shadow-[0_0_14px_-8px_rgba(117,170,219,0.1)] hover:shadow-[0_0_18px_-6px_rgba(117,170,219,0.15)]'
                  }`}
                >
                  {isHighlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-[#75AADB] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                        Destacado
                      </span>
                    </div>
                  )}

                  <span className="text-[#75AADB] text-[10px] uppercase tracking-widest font-bold block mb-2">
                    {p.categoria}
                  </span>
                  <h3 className="text-white font-black text-xl leading-tight mb-2">
                    {p.titulo}
                  </h3>
                  <p className="text-gray-400 text-sm leading-snug mb-5 min-h-[2.5em]">
                    {p.descripcion}
                  </p>

                  <ul className="flex flex-col gap-2 mb-6">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-gray-300 text-xs leading-snug">
                        <span className="text-[#75AADB] flex-shrink-0 mt-0.5" aria-hidden>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setPopup(i)}
                    aria-label={`Ver detalle de ${p.titulo}`}
                    className={`mt-auto block w-full text-center font-black py-2.5 rounded-full uppercase tracking-wide text-sm transition-all cursor-pointer active:scale-95 ${
                      isHighlight
                        ? 'bg-[#75AADB] hover:bg-[#5a93c5] text-white'
                        : 'border border-white/30 hover:border-[#75AADB] text-white'
                    }`}
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
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
          <span className="text-[#75AADB] text-xs uppercase tracking-widest font-bold mb-2 block">
            {partners[popup].categoria}
          </span>
          <h3 id="partner-modal-title" className="text-white font-black text-2xl mb-3">
            {partners[popup].titulo}
          </h3>
          <ul className="flex flex-col gap-2 mb-4">
            {partners[popup].features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-200 text-sm">
                <span className="text-[#75AADB] mt-0.5" aria-hidden>✓</span>{f}
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
