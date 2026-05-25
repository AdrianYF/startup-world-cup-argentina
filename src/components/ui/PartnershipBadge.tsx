import { useEffect, useState } from 'react'

/**
 * Réplica idéntica del badge circular de partnership del sitio original
 * (startupworldcupargentina.com).
 *
 * Estructura: círculo "glass-card" con halo violeta, label "En partnership con"
 * absoluto arriba, y un logo central que rota entre Pegasus y partner-logo con
 * transición opacity + scale (0.8→1, exit 1→1.1).
 */

const LOGOS = ['/pegasus-logo.png', '/partner-logo.png']
const INTERVAL_MS = 3500

export function PartnershipBadge() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % LOGOS.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="group relative w-40 h-40 xs:w-56 xs:h-56 sm:w-72 sm:h-72 md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] glass-card rounded-full flex flex-col items-center justify-center border border-white/5 overflow-hidden p-4 md:p-8 group-hover:bg-white/10 transition-all duration-500 shadow-[0_0_50px_rgba(108,92,231,0.1)]">

      {/* Label */}
      <div className="absolute top-4 md:top-12 text-[7px] md:text-sm text-slate-500 font-bold tracking-[0.4em] uppercase whitespace-nowrap z-10 opacity-70">
        En partnership con
      </div>

      {/* Logo rotator */}
      <div className="w-full h-full flex items-center justify-center p-2 md:p-4">
        {LOGOS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Partner Logo"
            className={`absolute max-w-[80%] max-h-[60%] object-contain mix-blend-plus-lighter mt-2 md:mt-10 transition-all duration-500 ease-out ${
              i === index
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-110 pointer-events-none'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default PartnershipBadge
