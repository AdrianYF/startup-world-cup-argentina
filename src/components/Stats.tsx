import { content } from '../lib/content'

/**
 * Bloque de estadísticas estilo Token2049.
 * Números masivos como social proof tras el Hero.
 * El stat con highlight: true recibe el mismo tratamiento que el premio US$1M
 * del Hero - gradient text white→celeste + drop-shadow violeta + halo blur.
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
              className={`relative text-center sm:text-left ${
                i < stats.length - 1 ? 'sm:border-r sm:border-white/10 sm:pr-4' : ''
              }`}
            >
              {/* Halo blur - solo en el stat highlighted */}
              {s.highlight && (
                <div
                  aria-hidden
                  className="absolute -inset-4 bg-gradient-to-r from-[#75AADB]/30 via-[#75AADB]/20 to-[#75AADB]/30 blur-2xl rounded-3xl pointer-events-none"
                />
              )}

              <div
                className={`relative font-black leading-none tracking-tighter tabular-nums text-5xl sm:text-6xl lg:text-7xl xl:text-8xl ${
                  s.highlight
                    ? 'bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]'
                    : 'text-white'
                }`}
                style={
                  s.highlight
                    ? {
                        backgroundImage:
                          'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                      }
                    : undefined
                }
              >
                {s.valor}
              </div>
              <div className="relative text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-gray-400 mt-3 sm:mt-4 leading-snug font-bold">
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
