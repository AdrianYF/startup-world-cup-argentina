import { useState } from 'react'
import { content } from '../lib/content'
import { Modal } from './ui/Modal'

function BuildersArena() {
  const cards = content.buildersArena
  const [popupIndex, setPopupIndex] = useState<number | null>(null)

  return (
    <section id="builders" className="relative py-24 bg-[#020618]">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

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
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#6c5ce7]/50 hover:bg-white/10 transition-all group text-left w-full cursor-pointer"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <span className="text-[#6c5ce7] text-xs uppercase tracking-widest font-bold mb-3 block">
                {card.categoria}
              </span>
              <h3 className="text-white font-black text-2xl mb-3 group-hover:text-[#6c5ce7] transition-colors">
                {card.titulo}
              </h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                {card.descripcion}
              </p>
              <span className="text-gray-400 text-sm">Ver más →</span>
            </button>
          ))}
        </div>

      </div>

      {popupIndex !== null && (
        <Modal onClose={() => setPopupIndex(null)} titleId="builders-modal-title">
          <div className="text-4xl mb-4" aria-hidden>{cards[popupIndex].icon}</div>
          <span className="text-[#a89cf0] text-xs uppercase tracking-widest font-bold mb-2 block">
            {cards[popupIndex].categoria}
          </span>
          <h3 id="builders-modal-title" className="text-white font-black text-2xl mb-3">{cards[popupIndex].titulo}</h3>
          <p className="text-gray-200 leading-relaxed mb-6">{cards[popupIndex].popup}</p>
          <button
            onClick={() => setPopupIndex(null)}
            className="bg-[#6c5ce7] hover:bg-[#5848c4] active:scale-95 text-white font-black px-6 py-2 rounded-full transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </Modal>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />
    </section>
  )
}

export default BuildersArena
