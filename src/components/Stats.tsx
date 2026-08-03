import { useEffect, useRef, useState } from 'react'
import { content } from '../lib/content'

/**
 * Bloque de estadísticas estilo Token2049.
 * Números masivos como social proof tras el Hero.
 * El stat con highlight: true recibe el mismo tratamiento que el premio USD1M
 * del Hero - gradient text white→celeste + drop-shadow violeta + halo blur.
 */
// Animación secuencial — orden = array order. 1M USD primero (adelante de todo).
const STAGGER_MS = 180

function Stats() {
  const stats = content.config.stats ?? []
  if (!stats.length) return null

  return (
    <section
      id="stats"
      aria-label="Datos clave del evento"
      className="relative py-16 sm:py-24 bg-[#020618] text-white border-y border-white/5"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-y-0">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`relative text-center sm:text-left ${
                i < stats.length - 1 ? 'sm:border-r sm:border-white/10 sm:pr-4' : ''
              }`}
            >
              {/* Halo blur - solo en el stat highlighted */}
              {s.highlight && (
                <div
                  aria-hidden
                  className="absolute -inset-4 bg-gradient-to-r from-[#75AADB]/30 via-[#75AADB]/20 to-[#75AADB]/30 blur-2xl rounded-3xl pointer-events-none"
                />
              )}

              <div
                className={`relative font-black leading-none tracking-tighter tabular-nums text-5xl sm:text-6xl lg:text-7xl xl:text-8xl ${
                  s.highlight
                    ? 'bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(108,92,231,0.5)]'
                    : 'text-white'
                }`}
                style={
                  s.highlight
                    ? {
                        backgroundImage:
                          'linear-gradient(135deg, #ffffff 0%, #75AADB 40%, #75AADB 100%)',
                      }
                    : undefined
                }
              >
                <CountUp value={s.valor} delay={i * STAGGER_MS} />
              </div>
              <div className="relative text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-gray-400 mt-3 sm:mt-4 leading-snug font-bold">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

/**
 * Anima el número de 0 al target cuando entra en viewport.
 * Parsea prefijo/sufijo no-numérico (ej "+100", "1M USD") y solo anima la parte numérica.
 * Respeta prefers-reduced-motion.
 */
function CountUp({ value, delay = 0 }: { value: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const match = value.match(/^(\D*)(\d+)(.*)$/)
  const prefix = match?.[1] ?? ''
  const target = parseInt(match?.[2] ?? '0', 10)
  const suffix = match?.[3] ?? ''

  // Sin animación el número ya está en su valor final: se arranca ahí en vez de
  // contar desde 0 y corregirlo con un setState adentro del efecto, que además
  // dejaba un frame con el 0 pintado.
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [current, setCurrent] = useState(() => (reducedMotion ? target : 0))

  useEffect(() => {
    if (!ref.current) return
    if (reducedMotion) return

    let raf = 0
    let timeoutId = 0
    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || cancelled) return
        observer.disconnect()
        timeoutId = window.setTimeout(() => {
          const duration = Math.min(450, Math.max(200, target * 6))
          const start = performance.now()
          const tick = (now: number) => {
            if (cancelled) return
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3)
            setCurrent(Math.round(target * eased))
            if (t < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        }, delay)
      },
      { threshold: 0.3 },
    )
    observer.observe(ref.current)
    return () => {
      cancelled = true
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [target, delay, reducedMotion])

  return (
    <span ref={ref}>
      {prefix}
      {current}
      {suffix}
    </span>
  )
}

export default Stats
