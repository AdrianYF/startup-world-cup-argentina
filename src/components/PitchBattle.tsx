import { useState } from 'react'
import { content } from '../lib/content'
import { openStartupForm } from '../lib/ticketing'
import { WorldCupTicket } from './ui/WorldCupTicket'
import { Modal } from './ui/Modal'

function PitchBattle() {
  const [popupIndex, setPopupIndex] = useState<number | null>(null)
  const stats = content.pitchBattle

  return (
    <section id="pitch" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div>
            <h2 className="text-6xl lg:text-7xl font-black uppercase mb-6">
              <span className="text-[#75AADB]">PITCH</span>
              <span className="text-[#020618]"> BATTLE</span>
            </h2>

            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              La batalla final donde las 10 mejores startups pre-seleccionadas de Argentina se enfrentarán ante un jurado internacional. El ganador obtendrá un pase directo a la gran final en Silicon Valley para ser el próximo unicornio.
            </p>

            <div className="flex flex-col gap-3">
              {stats.map((stat, i) => (
                <button
                  key={i}
                  onClick={() => setPopupIndex(i)}
                  className="flex items-center gap-4 bg-[#75AADB] hover:bg-[#5a93c5] border border-[#75AADB] hover:border-[#5a93c5] rounded-xl px-6 py-4 text-left transition-colors cursor-pointer w-full group"
                >
                  <div className="flex-1">
                    <p className="text-white font-black">{stat.titulo}</p>
                    <p className="text-white/85 font-bold text-sm">{stat.subtitulo}</p>
                  </div>
                  <span className="text-white text-sm transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-8">
            <WorldCupTicket variant="full" />

            <button
              onClick={() => openStartupForm()}
              aria-label="Aplicá como Startup (abre formulario en una nueva pestaña)"
              className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-lg px-8 py-3 min-h-[48px] rounded-full transition-[transform,background-color] uppercase tracking-wide cursor-pointer shadow-lg shadow-[#75AADB]/40"
            >
              Aplicá como Startup <span aria-hidden>↗</span>
            </button>
          </div>

        </div>
      </div>

      {popupIndex !== null && (
        <Modal onClose={() => setPopupIndex(null)} titleId="pitch-modal-title">
          <h3 id="pitch-modal-title" className="text-white font-black text-2xl mb-3">{stats[popupIndex].titulo}</h3>
          <p className="text-gray-200 leading-relaxed mb-6">{stats[popupIndex].popup}</p>
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

export default PitchBattle
