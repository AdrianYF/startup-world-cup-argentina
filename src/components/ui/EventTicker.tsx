import { content } from '../../lib/content'

type Evento = {
  etiqueta: string
  fechaCorta: string
  titulo: string
  bonus?: boolean
}

const eventos = content.camino as Evento[]

function TickerItem({ ev }: { ev: Evento }) {
  const accent = ev.bonus ? '#f0b429' : '#75AADB'
  return (
    <span className="inline-flex items-center gap-2.5 px-6 text-sm whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} aria-hidden />
      <span className="font-bold uppercase tracking-wider" style={{ color: accent }}>
        {ev.etiqueta}
      </span>
      <span className="text-white/45">{ev.fechaCorta}</span>
      <span className="text-white/80">{ev.titulo}</span>
      <span className="text-white/20" aria-hidden>
        ◆
      </span>
    </span>
  )
}

/**
 * Banda tipo ticker de mercado: scroll horizontal infinito con los próximos eventos.
 * El track contiene la lista DUPLICADA; al desplazarse -50% el loop es perfecto.
 * Pausa al hover y respeta prefers-reduced-motion (ver index.css).
 */
export function EventTicker({ className = '' }: { className?: string }) {
  return (
    <div
      className={`swc-marquee relative overflow-hidden border-y border-white/10 bg-[#020618]/75 backdrop-blur-sm py-3 ${className}`}
      aria-label="Próximos eventos"
    >
      <div className="swc-marquee-track">
        {[...eventos, ...eventos].map((ev, i) => (
          <TickerItem key={i} ev={ev} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#020618] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#020618] to-transparent" />
    </div>
  )
}

export default EventTicker
