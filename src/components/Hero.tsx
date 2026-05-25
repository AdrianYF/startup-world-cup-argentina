import { content } from '../lib/content'
import { openStartupForm, openPartnerForm } from '../lib/ticketing'

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

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

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-12 w-full flex-1 flex flex-col items-center justify-center text-center">

        {/* H1 — protagonista absoluto, sin imagen ni chip */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] uppercase tracking-tight mb-12 sm:mb-16 lg:mb-20">
          <span className="text-white">STARTUP WORLD CUP </span>
          <span className="text-[#75AADB]">ARGENTINA</span>
        </h1>

        {/* H2 — premio, un step menor */}
        <div className="relative mb-12 sm:mb-16">
          <div className="absolute -inset-6 bg-gradient-to-r from-[#75AADB]/25 via-[#75AADB]/15 to-[#75AADB]/25 blur-3xl rounded-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2 sm:mb-3">
              Premio Final · Silicon Valley
            </div>
            <h2 className="flex items-baseline gap-2 sm:gap-3 justify-center flex-wrap leading-[0.95]">
              <span
                className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                }}
              >
                1 Million
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/80">USD</span>
            </h2>
          </div>
        </div>

        {/* CTAs — pills compactos, simétricos en tamaño, diferenciados por fill vs border */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <button
            onClick={() => openStartupForm()}
            aria-label={`${content.config.hero.ctaPrimario} (abre formulario en una nueva pestaña)`}
            className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-sm sm:text-base px-6 py-2.5 min-h-[44px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#75AADB]/30"
          >
            {content.config.hero.ctaPrimario}
          </button>
          <button
            onClick={() => openPartnerForm()}
            aria-label={`${content.config.hero.ctaSecundario} (contactanos)`}
            className="border border-white/30 hover:border-[#75AADB] hover:bg-white/5 active:scale-95 text-white font-bold text-sm sm:text-base px-6 py-2.5 min-h-[44px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer"
          >
            {content.config.hero.ctaSecundario}
          </button>
        </div>

      </div>
    </section>
  )
}

export default Hero
