import { content } from '../lib/content'

/**
 * Bloque de estadísticas estilo Token2049.
 * Números masivos como social proof tras el Hero.
 * Layout: grid 2x2 en mobile → 4 columnas en sm+. Cero ornamento.
 */
function Stats() {
  const stats = content.config.stats ?? []
  if (!stats.length) return null

  return (
    <section
      id="stats"
      aria-label="Datos clave del evento"
      className="relative py-16 sm:py-24 bg-[#020618] text-white border-y border-white/5"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-10 sm:gap-y-0">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`text-center sm:text-left ${
                i < stats.length - 1 ? 'sm:border-r sm:border-white/10 sm:pr-4' : ''
              }`}
            >
              <div
                className={`font-black leading-none tracking-tighter tabular-nums ${
                  s.highlight ? 'text-[#75AADB]' : 'text-white'
                } text-5xl sm:text-6xl lg:text-7xl xl:text-8xl`}
              >
                {s.valor}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-gray-400 mt-3 sm:mt-4 leading-snug font-bold">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default Stats
