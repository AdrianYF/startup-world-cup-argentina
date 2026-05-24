import { useEffect, useState, useMemo } from 'react'
import { VolunteerCard, type VolunteerCardProps } from './VolunteerCard'

const voluntariosDemo: VolunteerCardProps[] = [
  { nombre: 'Sofía Méndez',    rol: 'PRODUCCIÓN', ciudad: 'Buenos Aires', credencial: 'V·001', emoji: '🎬', rarity: 'crew',   diasDisponibles: ['MIÉ 5', 'JUE 6', 'VIE 7'] },
  { nombre: 'Tomás Pereyra',   rol: 'TECH',       ciudad: 'CABA',         credencial: 'V·002', emoji: '💻', rarity: 'crew',   diasDisponibles: ['MIÉ 5', 'JUE 6']        },
  { nombre: 'Mariana López',   rol: 'MENTORÍA',   ciudad: 'Córdoba',      credencial: 'V·003', emoji: '🧠', rarity: 'mentor', diasDisponibles: ['JUE 6', 'VIE 7']        },
  { nombre: 'Lucas Romero',    rol: 'LOGÍSTICA',  ciudad: 'Vedia',        credencial: 'V·004', emoji: '📦', rarity: 'crew',   diasDisponibles: ['MIÉ 5', 'JUE 6', 'VIE 7'] },
  { nombre: 'Valentina Cruz',  rol: 'CONTENIDO',  ciudad: 'Mendoza',      credencial: 'V·005', emoji: '📸', rarity: 'crew',   diasDisponibles: ['MIÉ 5', 'VIE 7']        },
  { nombre: 'Bruno Salinas',   rol: 'TEAM LEAD',  ciudad: 'Rosario',      credencial: 'V·006', emoji: '🎯', rarity: 'lead',   diasDisponibles: ['MIÉ 5', 'JUE 6', 'VIE 7'] },
  { nombre: 'Camila Iturri',   rol: 'DESIGN',     ciudad: 'La Plata',     credencial: 'V·007', emoji: '🎨', rarity: 'crew',   diasDisponibles: ['JUE 6', 'VIE 7']        },
  { nombre: 'Diego Martínez',  rol: 'COMUNIDAD',  ciudad: 'Salta',        credencial: 'V·008', emoji: '🤝', rarity: 'crew',   diasDisponibles: ['MIÉ 5', 'JUE 6']        },
  { nombre: 'Lara Gómez',      rol: 'PRENSA',     ciudad: 'CABA',         credencial: 'V·009', emoji: '📰', rarity: 'crew',   diasDisponibles: ['VIE 7']                 },
]

const INTERVAL_MS = 3500

/**
 * Cycler de una sola figurita visible a la vez.
 * Las 9 cartas están montadas en absolute, alternamos opacity + translateY
 * para crossfade limpio. Pausa al hover.
 */
export function VolunteerCardCycler() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  // Don Norman: respetar prefers-reduced-motion — no autoplay si el sistema lo pide
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (paused || reducedMotion) return
    const id = setInterval(() => {
      setCurrent(i => (i + 1) % voluntariosDemo.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, reducedMotion])

  return (
    <div
      className="relative w-full group"
      style={{ aspectRatio: '4 / 5' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Voluntari@ ${current + 1} de ${voluntariosDemo.length}: ${voluntariosDemo[current].nombre}`}
    >
      {voluntariosDemo.map((v, i) => (
        <div
          key={v.credencial}
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            i === current
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-[0.98] pointer-events-none'
          }`}
        >
          <VolunteerCard {...v} />
        </div>
      ))}

      {/* Indicador de progreso (dots) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {voluntariosDemo.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setPaused(true) }}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === current
                ? 'bg-[#ff7675] w-6'
                : 'bg-white/20 hover:bg-white/40 w-1.5'
            }`}
            aria-label={`Ver voluntari@ ${i + 1} de ${voluntariosDemo.length}`}
            aria-current={i === current ? 'true' : undefined}
          />
        ))}
        {/* Indicador de pausa — feedback visual cuando hover */}
        {paused && !reducedMotion && (
          <span
            className="ml-2 text-[9px] uppercase tracking-widest text-white/50 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden
          >
            · pausado
          </span>
        )}
      </div>
    </div>
  )
}

export default VolunteerCardCycler
