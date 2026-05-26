const PARTNERS = [
  { src: '/pegasus-logo.png', alt: 'Pegasus Tech Ventures', delay: '0s' },
  { src: '/SGBA-logo.png', alt: 'Startup Grind Buenos Aires', delay: '0.4s' },
]

/**
 * Sección dedicada "En partnership with" — 3 logos en grid con halo celeste,
 * float idle escalonado y hover scale + glow.
 */
function PartnershipWith() {
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

        <div className="grid grid-cols-2 gap-6 sm:gap-12 items-center max-w-3xl mx-auto">
          {PARTNERS.map((p, i) => (
            <div
              key={`${p.src}-${i}`}
              className="relative flex items-center justify-center group"
              style={{ animation: `partner-float 6s ease-in-out ${p.delay} infinite` }}
            >
              {/* Halo celeste detrás del logo */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-[#75AADB]/35 via-[#75AADB]/20 to-transparent blur-3xl rounded-full pointer-events-none transition-opacity duration-300 group-hover:opacity-90 opacity-60"
              />
              <img
                src={p.src}
                alt={p.alt}
                className="relative h-20 sm:h-28 lg:h-36 w-auto max-w-full object-contain drop-shadow-[0_4px_24px_rgba(117,170,219,0.5)] transition-all duration-300 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_8px_32px_rgba(117,170,219,0.8)]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <style>{`
        @keyframes partner-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  )
}

export default PartnershipWith
