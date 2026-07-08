import { useState } from 'react'
import { content } from '../lib/content'
import { openStartupForm } from '../lib/ticketing'
import { WorldCupTicket } from './ui/WorldCupTicket'
import { Modal } from './ui/Modal'
import { BasesContent } from './Footer'

function PitchBattle() {
  const [popupIndex, setPopupIndex] = useState<number | null>(null)
  const [basesOpen, setBasesOpen] = useState(false)
  const stats = content.pitchBattle

  return (
    <section id="pitch" className="relative py-16 sm:py-24 bg-[#eef4fb] text-[#020618] overflow-x-clip">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />


      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div>
            <h2 className="text-6xl lg:text-7xl font-black uppercase mb-6">
              <span className="text-[#75AADB]">PITCH</span>
              <span className="text-[#020618]"> BATTLE</span>
            </h2>

            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              La batalla final donde las 10 mejores startups seleccionadas de Argentina se enfrentarán ante un jurado internacional.
            </p>
            <p className="text-gray-900 text-lg leading-relaxed font-bold mb-8">
              El ganador obtendrá un pase directo a la gran final en Silicon Valley para ser el próximo unicornio.
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
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-8 lg:gap-16">
            <WorldCupTicket variant="full" />

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => openStartupForm()}
                aria-label={content.config.convocatoria.startupsAbierta
                  ? 'Aplicá como Startup (abre formulario en una nueva pestaña)'
                  : 'Convocatoria de startups cerrada — ver la agenda del evento'}
                style={{ backgroundImage: 'var(--gradient-apply)' }}
                className="inline-flex items-center justify-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 min-h-[48px] rounded-full transition-transform uppercase tracking-wide cursor-pointer shadow-lg shadow-[#75AADB]/40 hover:scale-105"
              >
                {content.config.convocatoria.startupsAbierta ? 'Aplicá como Startup' : content.config.convocatoria.ctaCerrada}
                {content.config.convocatoria.startupsAbierta ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    {/* Lucide plane (filled) — pase a Silicon Valley */}
                    <path d="M21.6 2.4a1.5 1.5 0 0 0-1.6-.35l-18 6a1.5 1.5 0 0 0-.13 2.79l6.99 3.3 3.3 6.99a1.5 1.5 0 0 0 2.79-.13l6-18a1.5 1.5 0 0 0-.35-1.6Z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => setBasesOpen(true)}
                className="text-sm font-bold text-[#5a93c5] hover:text-[#020618] underline underline-offset-4 transition-colors cursor-pointer"
              >
                Bases y Condiciones
              </button>
            </div>
          </div>

        </div>
      </div>

      {basesOpen && (
        <Modal onClose={() => setBasesOpen(false)} titleId="bases-modal-title" size="3xl">
          <BasesContent onClose={() => setBasesOpen(false)} />
        </Modal>
      )}

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
