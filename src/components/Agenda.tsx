import { useState } from 'react'
import { agendaDias } from '../lib/content'
import { openTicketing } from '../lib/ticketing'
import { SectionGlow } from './ui/SectionGlow'
import type { AgendaDay, AgendaSpeaker } from '../lib/content'

/**
 * Agenda - los tres días desplegados, uno debajo del otro.
 *
 * Antes había tabs y solo se veía un día por vez: para saber cuándo era algo
 * había que ir probando. Ahora la jornada entera está a la vista y cada día
 * cierra con su propio CTA de tickets.
 *
 * El filtro pasó a ser global — con las tabs, el track vivía dentro del día
 * activo y se reseteaba al cambiar de día. Ahora filtra los tres a la vez y los
 * días que quedan sin bloques simplemente no se dibujan.
 *
 * Tres desvíos deliberados del diseño original:
 * - Fuentes: el diseño pide Archivo + JetBrains Mono de Google Fonts. Va todo en
 *   Outfit, la del resto del sitio; los horarios llevan `tabular-nums`, que
 *   alinea la columna sin pedir una familia extra.
 * - Título: el diseño lo pide gigante y a la izquierda. Va con el tamaño y la
 *   alineación de los otros H2 del sitio (centrado, `lg:text-6xl`) para que la
 *   sección no se lea como de otro lado, pero conserva su gradient azul: es lo
 *   único del diseño original que se quiso mantener.
 * - Acentos: el diseño alterna azul y naranja por día. El naranja no está en la
 *   rampa por día (ver /COLORS.md), así que los tres días usan celeste → azul →
 *   índigo. El naranja sobrevive en un solo lugar: el asterisco del título.
 */

/** Acento por día, en orden. Celeste del sitio + la rampa azul del diseño. */
const ACENTOS = ['#75AADB', '#3B82F6', '#6366F1']

/** Bloque todavía sin confirmar: no es un track, es un estado. */
const COMING_SOON = 'Coming Soon'

/**
 * Los únicos tracks filtrables, en este orden.
 *
 * La lista es explícita a propósito: si saliera de las categorías del JSON,
 * cualquier categoría nueva se colaría como filtro. `Charla`, `Networking` y
 * `Coming Soon` existen como dato pero no filtran.
 */
const FILTROS = ['Keynote', 'Pitch Battle', 'Builders Arena', 'Investors', 'Side Events']

/** Bloques que se destacan (barra lateral + fondo tintado): los dos platos fuertes. */
const DESTACADOS = new Set(['Builders Arena', 'Pitch Battle'])

/** CTA del header de cada día: mismo botón, sea Luma (<a>) o ticketing (<button>). */
const CTA_DIA =
  'shrink-0 inline-flex items-center cursor-pointer rounded-full px-5 sm:px-6 py-2.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:brightness-125 active:scale-95'

/**
 * CTA de un bloque puntual, al lado de su título.
 *
 * Más chico que el del día a propósito: es una acción de una fila, no de la
 * jornada, y compite con el título que tiene al lado.
 */
const CTA_FILA =
  'shrink-0 inline-flex items-center cursor-pointer rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:brightness-125 active:scale-95'

/**
 * Los días sin un solo speaker (hoy los side events del miércoles) van a dos
 * columnas: la de speakers quedaba con el encabezado puesto y nada abajo.
 */
const COLS = 'lg:grid-cols-[132px_minmax(0,1.5fr)_minmax(0,1fr)]'
const COLS_SIN_SPEAKERS = 'lg:grid-cols-[132px_minmax(0,1fr)]'
const HEAD_LABEL = 'text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400'

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
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

/** Un día completo: header con su CTA + la tabla de bloques. */
function DiaPanel({ dia, accent }: { dia: AgendaDay; accent: string }) {
  const conSpeakers = dia.slots.some(s => s.speakers.length > 0)
  const cols = conSpeakers ? COLS : COLS_SIN_SPEAKERS
  /**
   * Días donde cada bloque se inscribe por su cuenta.
   *
   * El header no lleva botón: mandar a «conseguí tu ticket» desde un día cuyos
   * bloques tienen inscripción propia en Luma es mandar al lugar equivocado.
   */
  const conCtaPorBloque = dia.slots.some(s => s.cta)

  return (
    <div
      className="border border-[#75AADB]/15 rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(11,18,40,0.9), rgba(4,8,22,0.9))' }}
    >
      {/* Header del día + CTA */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-7 border-b"
        style={{
          background: `linear-gradient(96deg, ${rgba(accent, 0.24)}, ${rgba(accent, 0.04)} 70%, transparent)`,
          borderColor: rgba(accent, 0.35),
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.26em]" style={{ color: accent }}>
            {dia.subtitulo}
          </span>
          <h3 className="m-0 text-2xl sm:text-4xl font-black uppercase leading-none tracking-[-0.025em] text-white">
            {dia.label}
          </h3>
        </div>

        {/*
          Los side events del día 1 tienen inscripción propia en Luma, una por
          bloque, y su botón vive en la fila del bloque. El resto de los días van
          al ticketing del evento desde acá.
        */}
        {!conCtaPorBloque && (
          <button
            type="button"
            onClick={() => openTicketing(`agenda-${dia.id}`)}
            aria-label={`Conseguí tu ticket para ${dia.label} (abre Startup Grind en una nueva pestaña)`}
            className={CTA_DIA}
            style={{ background: rgba(accent, 0.22), border: `1px solid ${rgba(accent, 0.6)}` }}
          >
            Conseguí tu ticket
          </button>
        )}
      </div>

      {/* Cabecera de la tabla - solo desde lg, donde las columnas existen de verdad */}
      <div className={`hidden lg:grid ${cols} gap-5 px-5 sm:px-8 py-3.5 border-b border-[#75AADB]/10 bg-[#020618]/60`}>
        <span className={HEAD_LABEL}>Horario</span>
        <span className={HEAD_LABEL}>Actividad / Bloque</span>
        {conSpeakers && <span className={HEAD_LABEL}>Speaker(s)</span>}
      </div>

      {/* Filas */}
      {dia.slots.map((slot, i) => {
        const destacado = DESTACADOS.has(slot.categoria)
        const pendiente = slot.categoria === COMING_SOON

        return (
          <div
            key={i}
            className={`grid grid-cols-1 ${cols} gap-y-1.5 lg:gap-5 items-center px-5 sm:px-8 py-3.5 lg:py-4 border-b border-[#75AADB]/8 border-l-[3px] transition-colors last:border-b-0 hover:bg-[#75AADB]/[0.07] ${
              pendiente ? 'opacity-60' : ''
            }`}
            style={{
              background: destacado ? rgba(accent, 0.1) : 'transparent',
              borderLeftColor: destacado ? accent : 'transparent',
            }}
          >
            <span
              className="text-[13px] lg:text-[15px] font-semibold tabular-nums whitespace-nowrap"
              style={{ color: destacado ? '#FFFFFF' : '#d1d5db' }}
            >
              {slot.hora}
            </span>

            {/* El título y, cuando el bloque se inscribe aparte, su botón. El
                botón se va contra el borde derecho (`ml-auto`), así los dos
                quedan alineados entre sí en vez de arrancar donde termina cada
                título, que tienen largos muy distintos. Envuelven juntos: en el
                celular el botón cae abajo del título en vez de comprimirlo. */}
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                className={`text-sm lg:text-[16.5px] leading-snug text-white text-pretty ${
                  destacado ? 'font-extrabold' : 'font-semibold'
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

              {slot.cta && (
                <a
                  href={slot.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Inscribite a ${slot.cta.label} — ${slot.hora}, ${dia.label} (abre Luma en una nueva pestaña)`}
                  className={`${CTA_FILA} ml-auto`}
                  style={{ background: rgba(accent, 0.22), border: `1px solid ${rgba(accent, 0.6)}` }}
                >
                  {slot.cta.label}
                </a>
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
              // Sin la celda vacía la fila se desalinearía de la cabecera; en los
              // días de dos columnas no va, o el grid inventaría una tercera.
              conSpeakers && <span className="hidden lg:block" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Agenda() {
  const [filter, setFilter] = useState<string | null>(null)

  // El filtro es global: se aplica a los tres días y los que quedan sin bloques
  // no se dibujan (ej. Pitch Battle solo existe el viernes).
  const dias = filter
    ? agendaDias
        .map(d => ({ ...d, slots: d.slots.filter(s => s.categoria === filter) }))
        .filter(d => d.slots.length > 0)
    : agendaDias

  const presentes = new Set(agendaDias.flatMap(d => d.slots.map(s => s.categoria)))
  const categorias = FILTROS.filter(c => presentes.has(c))

  return (
    <section id="agenda" className="relative overflow-hidden bg-[#020618] text-white py-16 sm:py-24 px-4">
      <SectionGlow />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB]/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12">
        {/* Header — mismo tratamiento que el resto de los H2 del sitio */}
        <header className="text-center">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">AGENDA </span>
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(96deg, #7DB2E8 0%, #3B82F6 45%, #6366F1 100%)' }}
            >
              DEL EVENTO
            </span>
            <span className="text-[#ff6600]">*</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Tres jornadas de charlas, paneles, speed dating con fondos y el Pitch Battle que define al campeón
            argentino. <span className="text-gray-300">*La agenda puede sufrir modificaciones.</span>
          </p>
        </header>

        {/* Filtros por track, globales a los tres días */}
        {categorias.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${HEAD_LABEL} mr-1`}>Filtrar</span>
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
                    background: on ? 'rgba(117,170,219,0.18)' : 'transparent',
                    borderColor: on ? 'rgba(117,170,219,0.55)' : 'rgba(125,178,232,0.16)',
                    color: on ? '#FFFFFF' : '#9ca3af',
                  }}
                >
                  {c ?? 'Todo'}
                </button>
              )
            })}
          </div>
        )}

        {/* Los tres días, uno debajo del otro */}
        <div className="flex flex-col gap-8 sm:gap-12">
          {dias.map(d => (
            <DiaPanel
              key={d.id}
              dia={d}
              accent={ACENTOS[agendaDias.findIndex(x => x.id === d.id) % ACENTOS.length]}
            />
          ))}
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
