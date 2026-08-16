import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { content } from '../lib/content'
import { openStartupForm } from '../lib/ticketing'

function Hero() {
  const navigate = useNavigate()
  const [videoActivo, setVideoActivo] = useState(false)
  const [videoVisible, setVideoVisible] = useState(false)

  /**
   * El video de fondo es puramente decorativo, así que sólo se monta en sm+ y
   * cuando el visitante no pidió menos movimiento ni está ahorrando datos.
   * Antes esto se resolvía con `hidden sm:block`, que no alcanza: `display:none`
   * no cancela la descarga del video. En los casos en que no se monta queda la
   * imagen de fondo, que ya está siempre presente abajo.
   *
   * El montaje se difiere hasta después del load para que el video no le pelee
   * ancho de banda a la imagen del hero, que es el LCP. Y como el montaje es el
   * que decide, el <video> va con preload normal: con `preload="none"` Chrome
   * nunca arranca la descarga y el autoplay no llega a dispararse.
   */
  useEffect(() => {
    const anchoOk = window.matchMedia('(min-width: 640px)')
    const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ahorroDatos =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true

    const evaluar = () =>
      setVideoActivo(anchoOk.matches && !menosMovimiento.matches && !ahorroDatos)

    let timer: ReturnType<typeof setTimeout> | undefined
    const activar = () => { timer = setTimeout(evaluar, 200) }

    if (document.readyState === 'complete') activar()
    else window.addEventListener('load', activar, { once: true })

    anchoOk.addEventListener('change', evaluar)
    menosMovimiento.addEventListener('change', evaluar)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('load', activar)
      anchoOk.removeEventListener('change', evaluar)
      menosMovimiento.removeEventListener('change', evaluar)
    }
  }, [])

  const convocatoriaAbierta = content.config.convocatoria.startupsAbierta

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* Imagen de fondo base — siempre presente (en mobile es el fondo principal).
          Es el primer frame de hero-720.mp4: cuando el video entra, arranca desde
          esta misma imagen y el cambio no se percibe. Antes acá había un logo de
          318x390 estirado 5x, que no tenía nada que ver con el video y hacía que
          el reemplazo se viera como un salto.
          Es el elemento LCP del landing: va eager y con prioridad alta. */}
      <img
        src="/hero-poster.jpg"
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Video de fondo — solo sm+ (ver el efecto de arriba: el montaje es el que
          decide, no el CSS). El <source> lleva `type` para que el browser pueda
          descartarlo sin bajar el contenedor. */}
      {videoActivo && (
        <video
          ref={el => {
            if (!el) return
            // React setea `muted` como propiedad, no como atributo, así que en el
            // momento en que Chrome evalúa la política de autoplay todavía ve un
            // video con sonido y lo bloquea. Silenciarlo y arrancarlo a mano
            // acá evita eso. Es decorativo: si igual lo rechaza, queda la imagen.
            el.muted = true
            void el.play().catch(() => {})
          }}
          // Recién visible cuando ya está reproduciendo, con un fundido corto: sin
          // esto el primer frame aparece de golpe. Si `playing` nunca llega, queda
          // en opacity-0 y se ve la imagen de fondo, que es ese mismo frame.
          onPlaying={() => setVideoVisible(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
            videoVisible ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.jpg"
          aria-hidden
        >
          <source src="/hero-720.mp4" type="video/mp4" />
        </video>
      )}

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

          {/* === Columna derecha: H1 + CTAs (lg: movida a la izquierda) ===
              Va centrada verticalmente, no `justify-between`: desde que salió el
              bloque de abajo (primero el cronómetro, después el podio) es hijo
              único, y `between` lo dejaba pegado arriba con el aire muerto
              debajo, contra una columna izquierda —copa + 1 Million— más alta. */}
          <div className="lg:order-1 flex flex-col items-stretch text-center lg:text-left justify-center gap-8 lg:gap-12">

            {/* H1 + CTAs (alineados con el trofeo de col 1) */}
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
                  onClick={() => (convocatoriaAbierta ? openStartupForm() : navigate('/agenda'))}
                  aria-label={convocatoriaAbierta
                    ? `${content.config.hero.ctaPrimario} (abre formulario en una nueva pestaña)`
                    : 'Ver la agenda del evento'}
                  style={{ backgroundImage: 'var(--gradient-cta)' }}
                  className="inline-flex items-center justify-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-sm sm:text-base px-6 py-2.5 min-h-[44px] rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#6c5ce7]/30"
                >
                  {convocatoriaAbierta ? content.config.hero.ctaPrimario : content.config.convocatoria.ctaCerrada}
                  {convocatoriaAbierta ? (
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
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  )}
                </button>
                <a
                  href="#tickets"
                  aria-label="Ver entradas"
                  className="relative active:scale-95 text-white font-bold text-sm sm:text-base px-6 py-2.5 min-h-[44px] inline-flex items-center rounded-full transition-all text-center uppercase tracking-wide cursor-pointer hover:scale-105"
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
                    Entradas
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
                      {/* Lucide ticket */}
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                      <path d="M13 5v2" />
                      <path d="M13 17v2" />
                      <path d="M13 11v2" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero
