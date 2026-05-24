import { useState, useEffect, useRef } from 'react'
import { content } from '../lib/content'
import { openPartnerForm } from '../lib/ticketing'
import { Modal } from './ui/Modal'

const CARD_GAP = 20

function Partners() {
  const partners = content.partners
  const [current, setCurrent] = useState(0)
  const [popup, setPopup] = useState<number | null>(null)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  )
  const trackRef = useRef<HTMLDivElement>(null)
  const n = partners.length

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cardWidth = viewportWidth < 640 ? Math.min(viewportWidth - 64, 280) : 320

  const prev = () => setCurrent(i => (i - 1 + n) % n)
  const next = () => setCurrent(i => (i + 1) % n)

  // Triplicado para loop visual
  const repeated = [...partners, ...partners, ...partners]
  const offset = n + current
  const translateX = -(offset * (cardWidth + CARD_GAP)) + (viewportWidth / 2) - (cardWidth / 2)

  return (
    <section id="partners" className="relative py-16 sm:py-24 bg-[#020618] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-3">
            <span className="text-white">QUIERO SER </span>
            <span className="text-[#75AADB]">PARTNER</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada categoría combina visibilidad, innovación abierta y oportunidades reales de negocio.
          </p>
        </div>
      </div>

      <div className="relative w-full" style={{ height: 300 }}>
        <div
          ref={trackRef}
          className="absolute flex"
          style={{
            gap: CARD_GAP,
            transform: `translateX(${translateX}px)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            top: 0,
          }}
        >
          {repeated.map((p, i) => {
            const isCenter = i === offset
            const dist = Math.abs(i - offset)
            const scale = isCenter ? 1 : dist === 1 ? 0.9 : 0.8
            const opacity = isCenter ? 1 : dist === 1 ? 0.6 : 0.35

            return (
              <div
                key={i}
                onClick={() => {
                  if (isCenter) setPopup(i % n)
                  else if (i < offset) prev()
                  else next()
                }}
                style={{
                  width: cardWidth,
                  flexShrink: 0,
                  transform: `scale(${scale})`,
                  opacity,
                  transition: 'transform 0.5s ease, opacity 0.5s ease',
                  cursor: 'pointer',
                  transformOrigin: 'center center',
                }}
                className={`rounded-2xl p-6 border h-64
                  ${isCenter ? 'bg-white/10 border-[#75AADB]/50' : 'bg-white/5 border-white/10'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[#75AADB] text-xs uppercase tracking-widest font-bold block mb-1">{p.categoria}</span>
                    <h3 className="text-white font-black text-lg">{p.titulo}</h3>
                    <p className="text-gray-400 text-xs mt-1">{p.descripcion}</p>
                  </div>
                  <span className="text-2xl">{p.icon}</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {p.features.slice(0, 3).map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-gray-300 text-xs">
                      <span className="text-[#75AADB]">✓</span>{f}
                    </li>
                  ))}
                  {p.features.length > 3 && (
                    <li className="text-[#75AADB] text-xs font-bold mt-1">+{p.features.length - 3} más →</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={prev} className="text-white bg-white/10 hover:bg-[#5a93c5]/20 border border-white/20 hover:border-[#75AADB]/50 rounded-full w-10 h-10 flex items-center justify-center transition-all text-sm cursor-pointer">←</button>
          <button onClick={next} className="text-white bg-white/10 hover:bg-[#5a93c5]/20 border border-white/20 hover:border-[#75AADB]/50 rounded-full w-10 h-10 flex items-center justify-center transition-all text-sm cursor-pointer">→</button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {partners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === current ? 'bg-[#75AADB] w-6' : 'bg-white/30 w-2'}`} />
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => openPartnerForm()}
            aria-label="Quiero ser Partner (contactanos por mail)"
            className="inline-block bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-8 py-3 rounded-full uppercase tracking-wide cursor-pointer transition-all"
          >
            Quiero ser Partner →
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
              Contactar →
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
