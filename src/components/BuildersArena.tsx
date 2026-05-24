import { useState } from 'react'
import { content } from '../lib/content'
import { Modal } from './ui/Modal'

function BuildersArena() {
  const cards = content.buildersArena
  const [popupIndex, setPopupIndex] = useState<number | null>(null)

  return (
    <section id="builders" className="relative py-16 sm:py-24 bg-[#020618] text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-7xl font-black uppercase mb-4">
            <span className="text-white">BUILDERS </span>
            <span className="text-[#75AADB]">ARENA</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            El espacio donde comienza todo. Ideal para probar ideas y conectar problemas con soluciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => setPopupIndex(i)}
              className="bg-[#75AADB] hover:bg-[#5a93c5] border border-[#75AADB] hover:border-[#5a93c5] rounded-2xl p-8 transition-colors group text-left w-full cursor-pointer"
            >
              <span className="text-white/85 text-xs uppercase tracking-widest font-bold mb-3 block">
                {card.categoria}
              </span>
              <h3 className="text-white font-black text-2xl mb-3">
                {card.titulo}
              </h3>
              <p className="text-white/85 leading-relaxed mb-4">
                {card.descripcion}
              </p>
              <span className="text-white text-sm inline-flex items-center gap-1 transition-transform group-hover:translate-x-1">
                Ver más <span aria-hidden>→</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {popupIndex !== null && (
        <Modal onClose={() => setPopupIndex(null)} titleId="builders-modal-title">
          <span className="text-[#75AADB] text-xs uppercase tracking-widest font-bold mb-2 block">
            {cards[popupIndex].categoria}
          </span>
          <h3 id="builders-modal-title" className="text-white font-black text-2xl mb-3">
            {cards[popupIndex].titulo}
          </h3>
          <p className="text-gray-200 leading-relaxed mb-6">{cards[popupIndex].popup}</p>
          <button
            onClick={() => setPopupIndex(null)}
            className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black px-6 py-2 rounded-full transition-[transform,background-color] cursor-pointer"
          >
            Cerrar
          </button>
        </Modal>
      )}
    </section>
  )
}

export default BuildersArena
