import { useState } from 'react'
import { content } from '../lib/content'
import { openStartupForm } from '../lib/ticketing'
import { WorldCupTicket } from './ui/WorldCupTicket'
import { Modal } from './ui/Modal'

function PitchBattle() {
  const [popupIndex, setPopupIndex] = useState<number | null>(null)
  const stats = content.pitchBattle

  return (
    <section id="pitch" className="relative py-24 bg-[#020618]">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Columna izquierda */}
          <div>
            <span className="inline-block border border-white/20 text-gray-400 text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Competencia Principal
            </span>

            <h2 className="text-6xl lg:text-7xl font-black uppercase mb-6">
              <span className="text-[#75AADB]">PITCH</span>
              <span className="text-white"> BATTLE</span>
            </h2>

            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              La batalla final donde las 10 mejores startups pre-seleccionadas de Argentina se enfrentarán ante un jurado internacional. El ganador obtendrá un pase directo a la gran final en Silicon Valley para ser el próximo unicornio.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              {stats.map((stat, i) => (
                <button
                  key={i}
                  onClick={() => setPopupIndex(i)}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-left hover:border-[#6c5ce7]/50 hover:bg-white/10 transition-all cursor-pointer w-full"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-black">{stat.titulo}</p>
                    <p className={`${stat.subtituloColor} font-bold text-sm`}>{stat.subtitulo}</p>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => openStartupForm()}
              className="inline-block bg-[#6c5ce7] hover:bg-[#5848c4] text-white font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer"
            >
              Aplicá como Startup →
            </button>
          </div>

          {/* Columna derecha — Ticket de Mundial */}
          <div className="relative">
            <WorldCupTicket variant="full" />
          </div>

        </div>
      </div>

      {popupIndex !== null && (
        <Modal onClose={() => setPopupIndex(null)} titleId="pitch-modal-title">
          <div className="text-4xl mb-4" aria-hidden>{stats[popupIndex].icon}</div>
          <h3 id="pitch-modal-title" className="text-white font-black text-2xl mb-3">{stats[popupIndex].titulo}</h3>
          <p className="text-gray-200 leading-relaxed mb-6">{stats[popupIndex].popup}</p>
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

export default PitchBattle
