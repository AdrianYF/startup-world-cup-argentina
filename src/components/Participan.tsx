import { useState } from 'react'
import { content } from '../lib/content'
import { Modal } from './ui/Modal'

type Participante = (typeof content.participan)[number]

/** Tarjeta de participante: foto circular + nombre + cargo + línea destacada (ticket/rol). */
function ParticipanteCard({ p, compact = false }: { p: Participante; compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'flex-row items-center gap-4 text-left' : 'flex-col items-center text-center'}`}>
      <img
        src={p.img}
        alt={p.nombre}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`${compact ? 'h-16 w-16' : 'h-28 w-28 sm:h-32 sm:w-32'} shrink-0 rounded-full object-cover ring-2 ring-[#75AADB]/40`}
      />
      <div className={compact ? '' : 'mt-4'}>
        <h3 className={`font-black text-white ${compact ? 'text-base' : 'text-xl'}`}>{p.nombre}</h3>
        <p className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'} mt-0.5`}>{p.cargo}</p>
        <p className={`text-[#75AADB] font-bold ${compact ? 'text-xs' : 'text-sm'} mt-1.5`}>{p.ticket}</p>
      </div>
    </div>
  )
}

function Participan() {
  const participan = content.participan
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section id="participan" className="relative py-16 sm:py-24 bg-[#020618] text-white">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4 text-white">
            PARTICIPAN
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Inversores y referentes que van a estar en el evento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {participan.map(p => (
            <ParticipanteCard key={p.slug} p={p} />
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 text-[#75AADB] hover:text-white font-black text-sm px-7 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer"
          >
            Conocé a todos los asistentes
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} titleId="asistentes-title" size="2xl">
          <div className="text-white">
            <h3 id="asistentes-title" className="text-2xl sm:text-3xl font-black uppercase text-center mb-2">
              <span className="text-white">Todos los </span>
              <span className="text-[#75AADB]">asistentes</span>
            </h3>
            <p className="text-gray-400 text-center text-sm mb-8">
              Inversores, mentores y referentes confirmados para el evento.
            </p>

            <div className="flex flex-col gap-5">
              {participan.map(p => (
                <ParticipanteCard key={p.slug} p={p} compact />
              ))}
            </div>

            <p className="mt-8 text-center text-gray-500 text-sm uppercase tracking-widest font-bold">
              Más asistentes próximamente
            </p>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default Participan
