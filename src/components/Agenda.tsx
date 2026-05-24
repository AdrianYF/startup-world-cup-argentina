import { useState } from 'react'
import { content } from '../lib/content'

const categoryColors: Record<string, string> = {
  'Pitch Battle': 'bg-[#6c5ce7]/20 text-[#a89cf0] border-[#6c5ce7]/40',
  'Keynote': 'bg-[#ff7675]/20 text-[#ff7675] border-[#ff7675]/40',
  'Workshop': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Networking': 'bg-green-500/20 text-green-300 border-green-500/40',
  'Side Event': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  'Builders Arena': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
}

function Agenda() {
  const dias = content.agenda.dias
  const [dia, setDia] = useState(0)
  const [filter, setFilter] = useState<string | null>(null)

  const slots = dias[dia].slots
  const categorias = Array.from(new Set(slots.map(s => s.categoria)))
  const filtered = filter ? slots.filter(s => s.categoria === filter) : slots

  return (
    <section id="agenda" className="relative py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">AGENDA </span>
            <span className="text-[#6c5ce7]">3 DÍAS</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tres jornadas de competencia, networking y deal flow.
          </p>
        </div>

        {/* Day tabs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 justify-center">
          {dias.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setDia(i); setFilter(null) }}
              className={`px-6 py-3 rounded-xl border font-bold transition-all cursor-pointer text-left sm:text-center ${
                i === dia
                  ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]'
                  : 'bg-white/5 text-white border-white/10 hover:border-[#6c5ce7]/50'
              }`}
            >
              <div className="text-xs uppercase tracking-widest opacity-80">{d.label}</div>
              <div className={`text-sm font-black ${i === dia ? '' : 'text-[#6c5ce7]'}`}>{d.subtitulo}</div>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setFilter(null)}
            className={`text-xs uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
              !filter
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
            }`}
          >
            Todo
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c === filter ? null : c)}
              className={`text-xs uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                filter === c
                  ? categoryColors[c] || 'bg-white text-black border-white'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
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
              className="flex flex-col sm:flex-row gap-3 sm:gap-6 bg-white/5 border border-white/10 hover:border-[#6c5ce7]/30 rounded-xl p-5 transition-all"
            >
              <div className="sm:w-32 flex-shrink-0">
                <div className="text-[#6c5ce7] font-black text-sm tracking-widest">{slot.hora}</div>
                <div className="text-gray-400 text-xs uppercase tracking-widest mt-0.5">{slot.sala}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-3 flex-wrap mb-1">
                  <h3 className="text-white font-black text-lg leading-tight">{slot.titulo}</h3>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${categoryColors[slot.categoria] || 'border-white/20 text-gray-400'}`}>
                    {slot.categoria}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8 italic">
          * Agenda preliminar — sujeta a cambios.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />
    </section>
  )
}

export default Agenda
