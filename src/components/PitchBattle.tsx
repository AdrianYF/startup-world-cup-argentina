import { useState } from 'react'

const stats = [
  {
    icon: '🏆',
    titulo: 'Inversión Final',
    subtitulo: 'US$ 1M para el ganador global',
    subtituloColor: 'text-yellow-400',
    popup: 'El ganador del Pitch Battle Argentina obtiene un pase directo a la gran final global en Silicon Valley, donde competirá por una inversión de US$ 1.000.000 del fondo Pegasus Tech Ventures.',
  },
  {
    icon: '🌎',
    titulo: 'Jurado Internacional',
    subtitulo: 'Inversores y referentes de Silicon Valley',
    subtituloColor: 'text-gray-400',
    popup: 'El panel de jurados estará compuesto por inversores de venture capital, founders de unicornios y referentes del ecosistema tecnológico global. Cada startup tendrá minutos para presentar y recibir feedback en vivo.',
  },
  {
    icon: '🚀',
    titulo: 'Top 10 Startups',
    subtitulo: 'Pre-seleccionadas de toda Argentina',
    subtituloColor: 'text-gray-400',
    popup: 'A través de un proceso de selección riguroso, las 10 mejores startups de Argentina serán elegidas para competir en el Pitch Battle. El proceso incluye evaluación de modelo de negocio, tracción y potencial de escalabilidad.',
  },
]

function PitchBattle() {
  const [popupIndex, setPopupIndex] = useState<number | null>(null)

  return (
    <section id="pitch" className="relative py-24 bg-zinc-950">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

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
                  className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-left hover:border-yellow-500/50 hover:bg-white/10 transition-all cursor-pointer w-full"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-black">{stat.titulo}</p>
                    <p className={`${stat.subtituloColor} font-bold text-sm`}>{stat.subtitulo}</p>
                  </div>
                  <span className="text-gray-500 text-sm">→</span>
                </button>
              ))}
            </div>

            <a href="#tickets" className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide">
              Aplicá como Startup →
            </a>
          </div>

          {/* Columna derecha - Cheque */}
          <div className="relative">
            <div className="bg-gradient-to-br from-yellow-500/20 to-[#75AADB]/20 rounded-3xl p-1">
              <div className="bg-zinc-950 rounded-3xl p-8 text-center">
                <p className="text-gray-400 text-sm uppercase tracking-widest mb-4">Startup World Cup 2026 Champion</p>
                <div className="border-2 border-yellow-500/50 rounded-2xl p-8 mb-4">
                  <p className="text-gray-400 text-sm mb-2">Pegasus Tech Ventures Fund</p>
                  <p className="text-5xl font-black text-yellow-400 mb-2">$1,000,000</p>
                  <p className="text-2xl font-bold text-white">(USD)</p>
                  <div className="mt-6 h-px bg-yellow-500/30" />
                  <p className="text-gray-500 text-xs mt-3 italic">Startup World Cup 2026</p>
                </div>
                <p className="text-gray-400 text-sm">
                  🇦🇷 Tu startup puede ser la próxima en ganar esto
                </p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#75AADB]/10 rounded-full blur-xl" />
          </div>

        </div>
      </div>

      {/* Popup */}
      {popupIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setPopupIndex(null)}
        >
          <div 
            className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-4">{stats[popupIndex].icon}</div>
            <h3 className="text-white font-black text-2xl mb-3">{stats[popupIndex].titulo}</h3>
            <p className="text-gray-300 leading-relaxed mb-6">{stats[popupIndex].popup}</p>
            <button 
              onClick={() => setPopupIndex(null)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-2 rounded-full transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default PitchBattle