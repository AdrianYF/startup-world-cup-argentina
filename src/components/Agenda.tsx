import { useState } from 'react'
import { content } from '../lib/content'

const categoryStyles: Record<string, string> = {
  'Pitch Battle': 'bg-[#75AADB] text-white border-[#75AADB]',
  'Keynote': 'bg-[#75AADB]/15 text-[#75AADB] border-[#75AADB]/40',
  'Workshop': 'bg-[#020618] text-white border-[#020618]',
  'Networking': 'bg-gray-100 text-gray-700 border-gray-300',
  'Side Event': 'bg-[#bcd5ea]/50 text-[#020618] border-[#bcd5ea]',
  'Builders Arena': 'bg-white text-[#020618] border-[#020618]',
}

function Agenda() {
  const dias = content.agenda.dias
  const [dia, setDia] = useState(0)
  const [filter, setFilter] = useState<string | null>(null)

  const slots = dias[dia].slots
  const categorias = Array.from(new Set(slots.map(s => s.categoria)))
  const filtered = filter ? slots.filter(s => s.categoria === filter) : slots

  return (
    <section id="agenda" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-[#020618]">AGENDA </span>
            <span className="text-[#75AADB]">3 DÍAS</span>
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Tres jornadas de competencia, networking y deal flow.
          </p>
        </div>

        {/* Day tabs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 justify-center">
          {dias.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setDia(i); setFilter(null) }}
              className={`px-6 py-3 rounded-xl border font-bold transition-colors cursor-pointer text-left sm:text-center ${
                i === dia
                  ? 'bg-[#75AADB] text-white border-[#75AADB]'
                  : 'bg-gray-50 text-[#020618] border-gray-200 hover:border-[#75AADB]'
              }`}
            >
              <div className="text-xs uppercase tracking-widest opacity-80">{d.label}</div>
              <div className={`text-sm font-black ${i === dia ? '' : 'text-[#75AADB]'}`}>{d.subtitulo}</div>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setFilter(null)}
            className={`text-xs uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              !filter
                ? 'bg-[#020618] text-white border-[#020618]'
                : 'bg-white text-gray-500 border-gray-300 hover:border-[#020618]'
            }`}
          >
            Todo
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c === filter ? null : c)}
              className={`text-xs uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                filter === c
                  ? categoryStyles[c] || 'bg-[#020618] text-white border-[#020618]'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-[#020618]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Slots */}
        <div className="flex flex-col gap-3">
          {filtered.map((slot, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-3 sm:gap-6 bg-gray-50 border border-gray-200 hover:border-[#75AADB] rounded-xl p-5 transition-colors"
            >
              <div className="sm:w-32 flex-shrink-0">
                <div className="text-[#75AADB] font-black text-sm tracking-widest">{slot.hora}</div>
                <div className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">{slot.sala}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-3 flex-wrap mb-1">
                  <h3 className="text-[#020618] font-black text-lg leading-tight">{slot.titulo}</h3>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${categoryStyles[slot.categoria] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                    {slot.categoria}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-xs mt-8 italic">
          * Agenda preliminar — sujeta a cambios.
        </p>
      </div>
    </section>
  )
}

export default Agenda
