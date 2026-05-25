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

      {/* Cascada áurea (φ ≈ 1.618):
            Logo 160 → H1 96 → H2 60 → USD 36 → Body 22 → Overline 14
            cada eslabón divide por ~1.618 al siguiente.
            Spacing vertical sigue Fibonacci: 8 / 13 / 21 / 34 / 55 / 89 / 144 px. */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-12 w-full flex-1 flex flex-col items-center justify-center text-center">

        {/* Logo — 160px (φ × H1) */}
        <img
          src="/SWC-logo.png"
          alt="Startup World Cup"
          className="h-24 sm:h-32 lg:h-40 w-auto mb-[34px] drop-shadow-[0_8px_32px_rgba(108,92,231,0.4)]"
        />

        {/* === ENTIDAD 1: Brand (H1 96px) === */}
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black leading-[0.95] uppercase mb-[144px]">
          <span className="text-white">STARTUP WORLD CUP </span>
          <span className="text-[#75AADB]">ARGENTINA</span>
        </h1>

        {/* === ENTIDAD 2: Premio (H2 60px = H1 / φ) + tagline === */}

        <div className="relative mb-[55px]">
          <div className="absolute -inset-6 bg-gradient-to-r from-[#75AADB]/30 via-[#75AADB]/20 to-[#75AADB]/30 blur-3xl rounded-3xl pointer-events-none" />

          <div className="relative">
            <div className="text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-white/70 mb-[21px]">
              Premio Final · Silicon Valley
            </div>
            <h2 className="flex items-baseline gap-2 sm:gap-3 justify-center flex-wrap leading-none">
              <span
                className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                }}
              >
                1 Million
              </span>
              <span className="text-xl sm:text-2xl lg:text-4xl font-black text-white/80">USD</span>
            </h2>
          </div>
        </div>

        {/* Tagline — 22px (H2 / φ) en lg */}
        <p className="text-gray-300 text-base sm:text-lg lg:text-[22px] leading-relaxed max-w-xl mb-[55px]">
          La competencia de startups más grande del mundo llega a Argentina.
        </p>

        {/* CTAs */}
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
