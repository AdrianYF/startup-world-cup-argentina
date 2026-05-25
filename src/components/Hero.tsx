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

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-12 w-full flex-1 flex flex-col items-center justify-center text-center">

        {/* Chip de fecha + lugar — Norman: visibility de info crítica del evento */}
        <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75AADB] animate-pulse flex-shrink-0" aria-hidden />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            5·6·7 AGO 2026 · VEDIA, BS AS
          </span>
        </div>

        {/* Logo */}
        <img
          src="/SWC-logo.png"
          alt="Startup World Cup"
          className="h-28 sm:h-36 lg:h-44 w-auto mb-6 sm:mb-8 drop-shadow-[0_8px_32px_rgba(108,92,231,0.4)]"
        />

        {/* === ENTIDAD 1: Brand === */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] uppercase mb-10 sm:mb-12 lg:mb-16">
          <span className="text-white">STARTUP WORLD CUP </span>
          <span className="text-[#75AADB]">ARGENTINA</span>
        </h1>

        {/* === ENTIDAD 2: Premio (H2) === */}

        <div className="relative mb-10 sm:mb-12">
          <div className="absolute -inset-6 bg-gradient-to-r from-[#75AADB]/30 via-[#75AADB]/20 to-[#75AADB]/30 blur-3xl rounded-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-white/70 mb-2 sm:mb-3">
              Premio Final · Silicon Valley
            </div>
            <h2 className="flex items-baseline gap-2 sm:gap-3 justify-center flex-wrap leading-[0.95]">
              <span
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                }}
              >
                1 Million
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white/80">USD</span>
            </h2>
          </div>
        </div>

        {/* CTAs con jerarquía asimétrica:
            - Primary: pill grande celeste con shadow + scale hover (acción esperada del 80%)
            - Secondary: ghost link sutil al lado (acción minoritaria, no compite) */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <button
            onClick={() => openStartupForm()}
            aria-label={`${content.config.hero.ctaPrimario} (abre formulario en una nueva pestaña)`}
            className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-base sm:text-lg lg:text-xl px-8 sm:px-10 py-3.5 sm:py-4 min-h-[52px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105 shadow-[0_8px_32px_-4px_rgba(117,170,219,0.6)] hover:shadow-[0_12px_40px_-4px_rgba(117,170,219,0.8)]"
          >
            {content.config.hero.ctaPrimario}
          </button>
          <button
            onClick={() => openPartnerForm()}
            aria-label={`${content.config.hero.ctaSecundario} (contactanos)`}
            className="text-white/70 hover:text-white active:scale-95 font-bold text-sm sm:text-base uppercase tracking-[0.2em] transition-colors duration-200 cursor-pointer relative group"
          >
            {content.config.hero.ctaSecundario}
            <span className="absolute -bottom-1 left-0 right-0 h-px bg-white/30 group-hover:bg-white transition-colors" aria-hidden />
          </button>
        </div>

      </div>
    </section>
  )
}

export default Hero
