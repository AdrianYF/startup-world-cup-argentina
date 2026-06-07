import { useState, useEffect } from 'react'
import { content } from '../lib/content'
import { openStartupForm, openPartnerForm } from '../lib/ticketing'
import { EventTicker } from './ui/EventTicker'

function Hero() {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, mins: 0, segs: 0 })

  useEffect(() => {
    const target = new Date(content.config.evento.fechaInicioISO)
    const interval = setInterval(() => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) { clearInterval(interval); return }
      setTimeLeft({
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        segs: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* Imagen de fondo base — siempre presente (en mobile es el fondo principal) */}
      <img
        src="/SWC-header.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Video de fondo — solo sm+ (en mobile pesa/insegura el autoplay, queda la imagen) */}
      <video
        className="hidden sm:block absolute inset-0 w-full h-full object-cover"
        src="/video.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/SWC-header.png"
        aria-hidden
      />

      {/* Overlays originales (commit 56c80e8) — 3 capas, radial morado para feel cinematográfico */}
      <div className="absolute inset-0 bg-[#020618]/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020618]/40 via-[#020618]/60 to-[#020618]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(108,92,231,0.25)_0%,_transparent_70%)]" />

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-20 pb-12 w-full flex-1 flex items-center">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch w-full">

          {/* === Columna izquierda: copa arriba + 1 Million abajo (lg: movida a la derecha) === */}
          <div className="lg:order-2 flex flex-col items-center lg:items-start justify-between gap-8 lg:gap-12 text-center lg:text-left">

            {/* Copa arriba */}
            <div className="relative self-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-3/4 bg-gradient-to-br from-[#75AADB]/30 via-[#75AADB]/15 to-transparent blur-3xl rounded-full" />
              </div>
              <img
                src="/SWC-logo.png"
                alt="Startup World Cup"
                className="relative h-40 sm:h-48 md:h-52 lg:h-60 xl:h-72 w-auto drop-shadow-[0_12px_48px_rgba(108,92,231,0.5)]"
              />
            </div>

            {/* 1 Million (premio) abajo de la copa */}
            <div className="relative self-center">
              <div className="absolute -inset-6 bg-gradient-to-r from-[#75AADB]/25 via-[#75AADB]/15 to-[#75AADB]/25 blur-3xl rounded-3xl pointer-events-none" />

              <div className="relative">
                <div className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2 sm:mb-3 text-center">
                  Premio Final · Silicon Valley
                </div>
                <h2 className="leading-[0.95] flex items-center justify-center gap-3 sm:gap-4">
                  <span>
                    <span
                      className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]"
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, #75AADB 0%, #75AADB 60%, #ffffff 100%)',
                      }}
                    >
                      1 Million
                    </span>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white/80 ml-2 sm:ml-3 align-baseline">USD</span>
                  </span>
                </h2>
                <div className="text-sm sm:text-base lg:text-lg font-bold uppercase tracking-[0.2em] text-white/70 mt-3 sm:mt-4 text-center">
                  ¿Vas a ser vos?
                </div>
              </div>
            </div>

          </div>

          {/* === Columna derecha: H1+CTAs arriba (CTAs a altura del trofeo) / Countdown abajo (alineado con 1 Million) (lg: movida a la izquierda) === */}
          <div className="lg:order-1 flex flex-col items-stretch text-center lg:text-left justify-between gap-8 lg:gap-12">

            {/* Top group: H1 + CTAs (alineados con el trofeo de col 1) */}
            <div className="flex flex-col gap-8 lg:gap-10">

              {/* H1 + tagline */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.05] uppercase tracking-wide mb-4 sm:mb-5">
                  <span className="block text-white">STARTUP WORLD CUP</span>
                  <span className="block text-[#75AADB]">
                    ARGENTINA <span className="text-white">2026</span>
                  </span>
                </h1>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                  La competencia de startups más grande del mundo llega a Argentina
                </p>
              </div>

              {/* CTAs — a la misma altura del trofeo */}
              <div className="flex flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start w-full">
                <button
                  onClick={() => openStartupForm()}
                  aria-label={`${content.config.hero.ctaPrimario} (abre formulario en una nueva pestaña)`}
                  style={{ backgroundImage: 'var(--gradient-cta)' }}
                  className="inline-flex items-center justify-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-sm sm:text-base px-6 py-2.5 min-h-[44px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#6c5ce7]/30"
                >
                  {content.config.hero.ctaPrimario}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    {/* Heroicons rocket-launch (solid) */}
                    <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
                    <path d="M5.26 17.242a1.5 1.5 0 1 0-2.567-1.555 5.97 5.97 0 0 0-.83 2.336 5.99 5.99 0 0 0-.27 1.405.75.75 0 0 0 .47.7 5.969 5.969 0 0 0 1.405-.27 5.97 5.97 0 0 0 2.337-.83 1.5 1.5 0 1 0-1.555-2.566L5.26 17.242Z" />
                  </svg>
                </button>
                <button
                  onClick={() => openPartnerForm()}
                  aria-label={`${content.config.hero.ctaSecundario} (contactanos)`}
                  className="relative active:scale-95 text-white font-bold text-sm sm:text-base px-6 py-2.5 min-h-[44px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      padding: '1px',
                      background: 'var(--gradient-cta)',
                      WebkitMask:
                        'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    }}
                  />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {content.config.hero.ctaSecundario}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {/* Lucide handshake */}
                      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
                      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
                      <path d="m21 3 1 11h-2" />
                      <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
                      <path d="M3 4h8" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            {/* Countdown — alineado con 1 Million de col 1 */}
            <div className="w-full pb-4 sm:pb-6">
                <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-3 sm:mb-4 text-center">
                  Faltan:
                </div>
                <div className="flex items-start justify-center gap-2 sm:gap-3">
                  {[
                    { val: timeLeft.dias, label: 'DÍAS' },
                    { val: timeLeft.horas, label: 'HORAS' },
                    { val: timeLeft.mins, label: 'MIN' },
                    { val: timeLeft.segs, label: 'SEG' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2 sm:gap-2.5">
                      <div className="flex items-center justify-center min-w-[3.25rem] sm:min-w-[4.25rem] lg:min-w-[4.75rem] px-2.5 py-3 sm:py-4 rounded-md border-[0.5px] border-white/10 bg-white/[0.08] backdrop-blur-sm">
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black leading-none tabular-nums text-white">
                          {String(val).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-white/55">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

          </div>
        </div>

      </div>

      {/* Banda ticker de próximos eventos — abajo del todo en el hero */}
      <EventTicker className="relative z-20 mb-8 sm:mb-10" />
    </section>
  )
}

export default Hero
