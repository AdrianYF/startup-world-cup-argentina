import { content } from '../lib/content'
import { openStartupForm, openPartnerForm } from '../lib/ticketing'

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      {/* Video de fondo */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/video.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/SWC-header.png"
        aria-hidden
      />

      {/* Overlays para legibilidad */}
      <div className="absolute inset-0 bg-[#020618]/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020618]/40 via-[#020618]/60 to-[#020618]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(108,92,231,0.25)_0%,_transparent_70%)]" />

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-12 w-full">

        {/* TOP: 2 columnas en desktop, stack en mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-10 lg:mb-12">

          {/* Columna izquierda: logo + título */}
          <div className="flex flex-col items-center lg:items-start gap-4 sm:gap-6 text-center lg:text-left">
            <img
              src="/SWC-logo.png"
              alt="Startup World Cup"
              className="h-28 sm:h-36 lg:h-48 w-auto drop-shadow-[0_8px_32px_rgba(108,92,231,0.4)]"
            />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] uppercase">
              <span className="text-white">STARTUP WORLD CUP </span>
              <span className="text-[#75AADB]">ARGENTINA</span>
            </h1>
          </div>

          {/* Columna derecha: premio + tagline */}
          <div className="flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">

            {/* PREMIO */}
            <div className="relative w-full">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#75AADB]/30 via-[#75AADB]/20 to-[#75AADB]/30 blur-2xl rounded-3xl pointer-events-none" />

              <div className="relative">
                <div className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/70 mb-1">
                  Premio Final · Silicon Valley
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2 justify-center lg:justify-start flex-wrap">
                  <span
                    className="text-5xl sm:text-6xl lg:text-8xl font-black leading-none tracking-tight bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                    }}
                  >
                    1 Million
                  </span>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/80 leading-none">USD</span>
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
              La competencia de startups más grande del mundo llega a Argentina.
            </p>

          </div>
        </div>

        {/* BOTTOM: una sola fila full-width con los 2 CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <button
            onClick={() => openStartupForm()}
            aria-label={`${content.config.hero.ctaPrimario} (abre formulario en una nueva pestaña)`}
            className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-base sm:text-lg px-6 sm:px-8 py-3 min-h-[48px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#75AADB]/40"
          >
            {content.config.hero.ctaPrimario}
          </button>
          <button
            onClick={() => openPartnerForm()}
            aria-label={`${content.config.hero.ctaSecundario} (contactanos)`}
            className="border border-white/30 hover:border-[#75AADB] active:scale-95 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 min-h-[48px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer"
          >
            {content.config.hero.ctaSecundario}
          </button>
        </div>

      </div>
    </section>
  )
}

export default Hero
