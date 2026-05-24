import { useState, useEffect } from 'react'
import { content } from '../lib/content'
import { openStartupForm, openPartnerForm } from '../lib/ticketing'
import { PartnershipBadge } from './ui/PartnershipBadge'

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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 pb-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Columna izquierda */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 mb-6 sm:mb-8 max-w-full">
              <span className="w-2 h-2 rounded-full bg-[#75AADB] animate-pulse flex-shrink-0" />
              <span className="text-[11px] sm:text-sm font-semibold text-white truncate">{content.config.evento.fechas}</span>
            </div>

            {/* Logo + título — stack vertical en mobile, horizontal en lg */}
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4 lg:gap-10 mb-8 lg:mb-10">
              <img
                src="/SWC-logo.png"
                alt="Startup World Cup"
                className="h-28 sm:h-36 lg:h-56 w-auto drop-shadow-[0_8px_32px_rgba(108,92,231,0.4)]"
              />
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] uppercase">
                  <span className="text-white">STARTUP</span><br />
                  <span className="text-white">WORLD CUP</span><br />
                  <span className="text-[#75AADB]">ARGENTINA</span>
                </h1>
              </div>
            </div>

            {/* PREMIO */}
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#75AADB]/30 via-[#75AADB]/20 to-[#75AADB]/30 blur-2xl rounded-3xl pointer-events-none" />

              <div className="relative">
                <div className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/70 mb-1">
                  Premio Final · Silicon Valley
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2 justify-center lg:justify-start flex-wrap">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/80 leading-none">US$</span>
                  <span
                    className="text-5xl sm:text-6xl lg:text-8xl font-black leading-none tracking-tight bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                    }}
                  >
                    1.000.000
                  </span>
                </div>
                <div className="text-xs sm:text-sm lg:text-base font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/60 mt-1">
                  Un millón de dólares
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-base sm:text-lg mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
              La competencia de startups más grande del mundo llega a Argentina.
              Conectando el talento más disruptivo con el capital más estratégico de la región.
            </p>

            <div className="mb-8">
              <span className="text-[#75AADB] font-black text-3xl sm:text-4xl">{content.config.evento.ciudadesCompitiendo}</span>
              <span className="text-gray-400 text-xs sm:text-sm ml-2 uppercase tracking-widest">Ciudades compitiendo</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <button
                onClick={() => openStartupForm()}
                aria-label={`${content.config.hero.ctaPrimario} (abre formulario en una nueva pestaña)`}
                className="bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-base sm:text-lg px-6 sm:px-8 py-3 min-h-[48px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#75AADB]/40"
              >
                {content.config.hero.ctaPrimario} <span aria-hidden>↗</span>
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

          {/* Columna derecha */}
          <div className="flex flex-col items-center gap-6 sm:gap-8 mt-4 lg:mt-0">

            <div className="flex justify-center">
              <PartnershipBadge />
            </div>

            {/* Countdown */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md">
              {[
                { val: timeLeft.dias, label: 'DÍAS' },
                { val: timeLeft.horas, label: 'HORAS' },
                { val: timeLeft.mins, label: 'MINS' },
                { val: timeLeft.segs, label: 'SEGS' },
              ].map(({ val, label }) => (
                <div key={label} className="bg-white/5 border border-[#5a93c5]/30 rounded-xl p-2 sm:p-4 text-center backdrop-blur-sm">
                  <div className="text-xl sm:text-3xl font-black text-white tabular-nums">{String(val).padStart(2, '0')}</div>
                  <div className="text-[9px] sm:text-xs text-gray-400 mt-1 tracking-widest">{label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
