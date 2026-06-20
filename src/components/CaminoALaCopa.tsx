import { Suspense, lazy } from 'react'
import { content } from '../lib/content'

// Trophy3D se carga lazy para no inflar el bundle inicial (Three.js es pesado).
const Trophy3D = lazy(() => import('./ui/Trophy3D').then(m => ({ default: m.Trophy3D })))

type Evento = {
  etiqueta: string
  fecha: string
  fechaCorta: string
  iso?: string
  dia: string
  mes: string
  titulo: string
  url?: string
  descripcion?: string
  destacado?: boolean
  bonus?: boolean
  cerrado?: boolean
  proximamente?: boolean
}

const eventos = content.camino as Evento[]

/* Una fecha está "cerrada" si ya pasó: hoy (a medianoche) es posterior al día del evento. */
function esFechaCerrada(iso?: string) {
  if (!iso) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const [y, m, d] = iso.split('-').map(Number)
  return hoy > new Date(y, m - 1, d)
}

/* Fila de fixture: chip de fecha + datos del evento + acción. */
function FixtureRow({ ev }: { ev: Evento }) {
  const accent = ev.bonus ? '#f0b429' : '#75AADB'
  const cerrado = ev.cerrado || esFechaCerrada(ev.iso)

  const inner = (
    <div
      className={`flex items-center gap-4 sm:gap-5 rounded-2xl border bg-white px-4 sm:px-5 py-4 transition-all group ${
        cerrado
          ? 'border-[#020618]/10 opacity-70'
          : ev.destacado
            ? 'border-[#75AADB]/50 shadow-[0_10px_30px_-12px_rgba(117,170,219,0.6)]'
            : 'border-[#020618]/10 hover:border-[#75AADB]/50 hover:shadow-[0_10px_30px_-14px_rgba(117,170,219,0.55)]'
      }`}
    >
      {/* Chip de fecha (estilo fixture) */}
      <div
        className="shrink-0 flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-white leading-none"
        style={{ background: accent }}
      >
        <span className="text-xl sm:text-2xl font-black">{ev.dia}</span>
        <span className="text-[10px] font-bold tracking-widest mt-0.5 opacity-90">{ev.mes}</span>
      </div>

      {/* Datos */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>
          {ev.etiqueta}
        </p>
        <h3 className="font-black text-[#020618] text-base sm:text-lg leading-tight">{ev.titulo}</h3>
        {ev.descripcion ? (
          <p className="text-gray-500 text-sm leading-snug mt-0.5">{ev.descripcion}</p>
        ) : (
          <p className="text-gray-400 text-xs mt-0.5">{ev.fecha}</p>
        )}
      </div>

      {/* Acción / estado */}
      {cerrado ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#020618]/8 text-[#020618]/55 text-sm font-black px-4 py-2">
          Fecha cerrada
        </span>
      ) : ev.proximamente ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#75AADB]/12 text-[#5a93c5] text-sm font-black px-4 py-2">
          Próximamente
        </span>
      ) : ev.bonus ? (
        <span aria-hidden className="shrink-0 text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
          🍺
        </span>
      ) : (
        <span
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#75AADB] group-hover:bg-[#5a93c5] text-white text-sm font-black px-4 py-2 transition-colors"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        >
          Apuntate
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </div>
  )

  if (ev.url && !cerrado) {
    return (
      <a
        href={ev.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${ev.etiqueta}: ${ev.titulo} (abre en una nueva pestaña)`}
        className="block"
      >
        {inner}
      </a>
    )
  }
  return inner
}

function CaminoALaCopa() {
  return (
    <section id="camino" className="relative py-16 sm:py-24 bg-gradient-to-b from-[#dcebfa] to-[#bcdcf4] text-[#020618] overflow-x-clip">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-[#020618]">CAMINO A LA </span>
            <span className="text-[#75AADB]">COPA</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            El fixture rumbo al gran torneo. Sumate a cada fecha y llegá preparado a la final.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[5fr_6fr] gap-12 lg:gap-10 items-center">
          {/* Columna 1: fixture */}
          <div className="flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
            {eventos.map((ev, i) => (
              <FixtureRow key={i} ev={ev} />
            ))}
          </div>

          {/* Columna 2: la copa en 3D (modelo glb + Three.js, canvas transparente) */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center">
            {/* halo celeste pegado a la copa */}
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[62%] aspect-square rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(117,170,219,0.55) 0%, rgba(117,170,219,0.28) 45%, transparent 70%)',
                }}
              />
            </div>
            <div className="flex flex-col items-center w-full">
              <div className="relative w-full max-w-[720px] aspect-square">
                <Suspense
                  fallback={
                    <img
                      src="/cup.png"
                      alt="Copa Startup World Cup"
                      className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_24px_60px_rgba(117,170,219,0.5)]"
                    />
                  }
                >
                  <Trophy3D className="w-full h-full" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default CaminoALaCopa
