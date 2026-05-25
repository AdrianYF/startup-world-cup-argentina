import { useEffect, useState } from 'react'

const PARTNERS = [
  { src: '/pegasus-logo.png', alt: 'Pegasus Tech Ventures' },
  { src: '/SGBA-logo.png', alt: 'Startup Grind Buenos Aires' },
]

const INTERVAL_MS = 4000

/**
 * Sección dedicada "En partnership with" — alterna entre Pegasus y SGBA
 * con crossfade ease-in-out + scale. Vive entre el Hero y Stats.
 */
function PartnershipWith() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % PARTNERS.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      id="partnership"
      aria-label="En partnership with"
      className="relative py-16 sm:py-24 bg-[#020618] overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        <p className="text-center text-[10px] sm:text-xs font-black tracking-[0.35em] uppercase text-white/70 mb-8 sm:mb-12">
          En partnership with
        </p>

        {/* Logo rotator centrado */}
        <div className="relative mx-auto flex justify-center items-center h-32 sm:h-44 lg:h-56 w-full max-w-md">
          {/* Halo blur celeste de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#75AADB]/40 via-[#75AADB]/25 to-[#75AADB]/40 blur-3xl rounded-full pointer-events-none" />

          {PARTNERS.map((p, i) => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              aria-hidden={i !== idx}
              className={`absolute h-32 sm:h-44 lg:h-56 w-auto max-w-full object-contain drop-shadow-[0_4px_24px_rgba(117,170,219,0.6)] transition-all duration-500 ease-in-out ${
                i === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Indicador de progreso minimal */}
        <div className="flex justify-center gap-2 mt-8">
          {PARTNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ver partner ${i + 1} de ${PARTNERS.length}`}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                i === idx ? 'bg-[#75AADB] w-6' : 'bg-white/20 hover:bg-white/40 w-2'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default PartnershipWith
