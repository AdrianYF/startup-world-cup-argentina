import { useState } from 'react'
import { content } from '../lib/content'
import { Modal } from './ui/Modal'

type Participante = (typeof content.participan)[number]

/** Tarjeta de participante: foto circular + nombre + cargo + línea destacada (ticket/rol). */
function ParticipanteCard({ p, compact = false }: { p: Participante; compact?: boolean }) {
  const cargo = 'cargo' in p ? (p as { cargo?: string }).cargo : ''
  const ticket = 'ticket' in p ? (p as { ticket?: string }).ticket : ''
  return (
    <div className={`flex ${compact ? 'flex-row items-center gap-4 text-left' : 'flex-col items-center text-center'}`}>
      <img
        src={p.img}
        alt={p.nombre}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`${compact ? 'h-14 w-14' : 'h-28 w-28 sm:h-32 sm:w-32'} shrink-0 rounded-full object-cover ring-2 ring-[#75AADB]/40`}
      />
      <div className={compact ? 'min-w-0' : 'mt-4'}>
        <h3 className={`font-black text-white ${compact ? 'text-sm' : 'text-xl'} truncate`}>{p.nombre}</h3>
        {cargo ? <p className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'} mt-0.5 truncate`}>{cargo}</p> : null}
        {ticket ? <p className={`text-[#75AADB] font-bold ${compact ? 'text-xs' : 'text-sm'} mt-1.5`}>{ticket}</p> : null}
      </div>
    </div>
  )
}

function Participan() {
  const participan = content.participan
  const destacados = participan.filter(p => 'destacado' in p && (p as { destacado?: boolean }).destacado)
  const otros = participan.filter(p => !('destacado' in p && (p as { destacado?: boolean }).destacado))
  const [modalOpen, setModalOpen] = useState(false)

  // Al cerrar el modal, volver a la sección de Entradas. Se difiere para que el
  // Modal se desmonte y libere el scroll-lock del body antes de scrollear.
  const cerrarModal = () => {
    setModalOpen(false)
    setTimeout(() => {
      document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

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
          {destacados.map(p => (
            <ParticipanteCard key={p.slug} p={p} />
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 text-[#75AADB] hover:text-white font-black text-sm px-7 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer"
          >
            Conocé a los otros speakers
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {modalOpen && (
        <Modal onClose={cerrarModal} titleId="speakers-title" size="lg">
          <div className="text-white">
            <h3 id="speakers-title" className="text-2xl sm:text-3xl font-black uppercase text-center mb-2">
              <span className="text-white">Otros </span>
              <span className="text-[#75AADB]">speakers</span>
            </h3>
            <p className="text-gray-400 text-center text-sm mb-8">
              Inversores, mentores y referentes que participan del evento.
            </p>

            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto swc-scrollbar-simple pr-1">
              {otros.map(p => (
                <ParticipanteCard key={p.slug} p={p} compact />
              ))}
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default Participan
