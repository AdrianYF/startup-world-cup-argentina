import { useState } from 'react'
import { agendaDias } from '../lib/content'
import { SectionGlow } from './ui/SectionGlow'
import type { AgendaSpeaker } from '../lib/content'

/**
 * Agenda - layout de tabla densa sobre fondo dark, según el diseño
 * "Startup World Cup agenda section" (claude.ai/design).
 *
 * Dos desvíos deliberados del diseño original:
 * - Fuentes: el diseño pide Archivo + JetBrains Mono de Google Fonts. El sitio
 *   self-hostea Outfit y sacó Google Fonts por performance (commit 3ffbbeb), así
 *   que va Outfit + un stack mono del sistema, que no cuesta un request.
 * - Acentos: el diseño alterna azul y naranja por día. El naranja no está en la
 *   rampa por día (ver /COLORS.md), así que los tres días usan celeste → azul →
 *   índigo. El naranja sobrevive en un solo lugar: el asterisco del título, que
 *   va fijo en `--color-swc-orange` y no sigue al día activo.
 *
 * Sin columna de duración ni contadores en el header del día: se pidió sacarlos.
 * La duración se sigue calculando para destacar los bloques largos.
 */

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

/** Acento por día, en orden. Celeste del sitio + la rampa azul del diseño. */
const ACENTOS = ['#75AADB', '#3B82F6', '#6366F1']

/** Bloque todavía sin confirmar: no es un track, es un estado. */
const COMING_SOON = 'Coming Soon'

/** Desde qué duración un bloque se destaca (barra + fondo tintado). */
const BLOQUE_LARGO_MIN = 90

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function minutos(hora: string): number {
  const [hh, mm] = hora.split(':').map(Number)
  return hh * 60 + mm
}

/** "13:00 - 13:30" -> 30. No se muestra; sirve para destacar los bloques largos. */
function duracionMin(hora: string): number {
  const [desde, hasta] = hora.split(' - ')
  return minutos(hasta) - minutos(desde)
}

/** Sin foto (todavía) mostramos las iniciales en el mismo círculo. */
function iniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('')
}

function Avatar({ speaker, accent }: { speaker: AgendaSpeaker; accent: string }) {
  const base = 'w-7 h-7 rounded-full flex-shrink-0 ring-2 ring-[#0B1228]'
  if (speaker.img) {
    return <img src={speaker.img} alt={speaker.nombre} loading="lazy" className={`${base} object-cover`} />
  }
  return (
    <span
      aria-hidden
      className={`${base} flex items-center justify-center text-[9px] font-black`}
      style={{ background: rgba(accent, 0.18), color: accent, border: `1px solid ${rgba(accent, 0.4)}` }}
    >
      {iniciales(speaker.nombre)}
    </span>
  )
}

function Agenda() {
  const dias = agendaDias
  const [dia, setDia] = useState(0)
  const [filter, setFilter] = useState<string | null>(null)

  const activo = dias[dia]
  const accent = ACENTOS[dia % ACENTOS.length]
  // Coming Soon queda afuera: es un estado del bloque, no un track filtrable.
  const categorias = Array.from(new Set(activo.slots.map(s => s.categoria))).filter(c => c !== COMING_SOON)
  const slots = filter ? activo.slots.filter(s => s.categoria === filter) : activo.slots

  const cols = 'lg:grid-cols-[132px_minmax(0,1.5fr)_minmax(0,1fr)]'
  const headLabel = 'text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400'

  return (
    <section id="agenda" className="relative overflow-hidden bg-[#020618] text-white py-16 sm:py-24 px-4">
      <SectionGlow />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB]/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <header>
          <div className="flex flex-col gap-4 max-w-[760px]">
            <h2 className="m-0 text-[44px] sm:text-6xl lg:text-8xl font-black uppercase leading-[0.9] tracking-[-0.035em] text-balance">
              Agenda
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(96deg, #7DB2E8 0%, #3B82F6 45%, #6366F1 100%)' }}
              >
                tentativa
              </span>
              <span className="text-[#ff6600]">*</span>
            </h2>
            <p className="m-0 text-sm sm:text-base leading-relaxed text-gray-400 max-w-[56ch]">
              Tres jornadas de charlas, paneles, speed dating con fondos y el Pitch Battle que define al campeón
              argentino. <span className="text-gray-300">*La agenda puede sufrir modificaciones.</span>
            </p>
          </div>
        </header>

        {/* Tabs por día */}
        <div className="flex flex-wrap gap-2.5">
          {dias.map((d, i) => {
            const on = i === dia
            const a = ACENTOS[i % ACENTOS.length]
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => { setDia(i); setFilter(null) }}
                aria-pressed={on}
                className="cursor-pointer border rounded-full px-5 sm:px-6 py-3.5 flex items-center gap-3 text-[13px] sm:text-[15px] font-extrabold uppercase tracking-[0.12em] transition-colors"
                style={{
                  background: on ? rgba(a, 0.18) : 'transparent',
                  borderColor: on ? rgba(a, 0.55) : 'rgba(125,178,232,0.16)',
                  color: on ? '#FFFFFF' : '#9ca3af',
                }}
              >
                <span className="text-xs font-bold opacity-65" style={{ fontFamily: MONO }}>
                  {d.fecha.slice(-2)}
                </span>
                {d.label}
              </button>
            )
          })}
        </div>

        {/* Filtros por categoría. Con una sola categoría no filtran nada (día 5), así que no se muestran. */}
        {categorias.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 -mt-4 sm:-mt-8">
          <span className={`${headLabel} mr-1`}>Filtrar</span>
          {[null, ...categorias].map(c => {
            const on = filter === c
            return (
              <button
                key={c ?? '__todo'}
                type="button"
                onClick={() => setFilter(c)}
                aria-pressed={on}
                className="cursor-pointer border rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] transition-colors"
                style={{
                  background: on ? rgba(accent, 0.18) : 'transparent',
                  borderColor: on ? rgba(accent, 0.55) : 'rgba(125,178,232,0.16)',
                  color: on ? '#FFFFFF' : '#9ca3af',
                }}
              >
                {c ?? 'Todo'}
              </button>
            )
          })}
        </div>
        )}

        {/* Panel del día activo */}
        <div
          key={activo.id}
          className="border border-[#75AADB]/15 rounded-2xl overflow-hidden animate-[fade-in-up_340ms_ease_both]"
          style={{ background: 'linear-gradient(180deg, rgba(11,18,40,0.9), rgba(4,8,22,0.9))' }}
        >
          {/* Header del día */}
          <div
            className="flex flex-col gap-1 px-5 sm:px-8 py-5 sm:py-7 border-b"
            style={{
              background: `linear-gradient(96deg, ${rgba(accent, 0.24)}, ${rgba(accent, 0.04)} 70%, transparent)`,
              borderColor: rgba(accent, 0.35),
            }}
          >
            <span className="text-[11px] font-extrabold uppercase tracking-[0.26em]" style={{ color: accent }}>
              {activo.subtitulo}
            </span>
            <h3 className="m-0 text-2xl sm:text-4xl font-black uppercase leading-none tracking-[-0.025em] text-white">
              {activo.label}
            </h3>
          </div>

          {/* Cabecera de la tabla - solo desde lg, igual que el diseño */}
          <div className={`hidden lg:grid ${cols} gap-5 px-5 sm:px-8 py-3.5 border-b border-[#75AADB]/10 bg-[#020618]/60`}>
            <span className={headLabel}>Horario</span>
            <span className={headLabel}>Actividad / Bloque</span>
            <span className={headLabel}>Speaker(s)</span>
          </div>

          {/* Filas */}
          {slots.map((slot, i) => {
            const mins = duracionMin(slot.hora)
            const largo = mins >= BLOQUE_LARGO_MIN
            const pendiente = slot.categoria === COMING_SOON

            return (
              <div
                key={i}
                className={`grid grid-cols-1 ${cols} gap-y-1.5 lg:gap-5 items-center px-5 sm:px-8 py-3.5 lg:py-4 border-b border-[#75AADB]/8 border-l-[3px] transition-colors hover:bg-[#75AADB]/[0.07] ${
                  pendiente ? 'opacity-60' : ''
                }`}
                style={{
                  background: largo ? rgba(accent, 0.1) : 'transparent',
                  borderLeftColor: largo ? accent : 'transparent',
                }}
              >
                <span
                  className="text-[13px] lg:text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap"
                  style={{ fontFamily: MONO, color: largo ? '#FFFFFF' : '#d1d5db' }}
                >
                  {slot.hora}
                </span>

                <span
                  className={`text-sm lg:text-[16.5px] leading-snug text-white text-pretty ${
                    largo ? 'font-extrabold' : 'font-semibold'
                  }`}
                >
                  {slot.titulo}
                  {pendiente && (
                    <span
                      className="ml-2 align-middle inline-block text-[10px] font-extrabold uppercase tracking-[0.18em] px-3 py-0.5 border rounded-full whitespace-nowrap"
                      style={{ color: '#75AADB', borderColor: 'rgba(117,170,219,0.3)', background: 'rgba(117,170,219,0.08)' }}
                    >
                      Coming Soon
                    </span>
                  )}
                </span>

                {slot.speakers.length > 0 ? (
                  <span className="flex items-center gap-2.5">
                    <span className="flex gap-1.5 flex-shrink-0">
                      {slot.speakers.map(s => (
                        <Avatar key={s.nombre} speaker={s} accent={accent} />
                      ))}
                    </span>
                    <span className="text-[13.5px] leading-snug font-medium text-gray-400 text-pretty">
                      {slot.speakers.map(s => s.nombre).join(' / ')}
                    </span>
                  </span>
                ) : (
                  <span className="hidden lg:block" />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="pt-2">
          <span className="text-xs font-semibold text-gray-400">
            Los horarios pueden ajustarse hasta 48 h antes del evento.
          </span>
        </footer>
      </div>
    </section>
  )
}

export default Agenda
