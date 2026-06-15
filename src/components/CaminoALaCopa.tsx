import { Suspense, lazy } from 'react'
import { content } from '../lib/content'

// Trophy3D se carga lazy para no inflar el bundle inicial (Three.js es pesado).
const Trophy3D = lazy(() => import('./ui/Trophy3D').then(m => ({ default: m.Trophy3D })))

type Evento = {
  etiqueta: string
  fecha: string
  fechaCorta: string
  dia: string
  mes: string
  titulo: string
  url?: string
  descripcion?: string
  destacado?: boolean
  bonus?: boolean
  cerrado?: boolean
}

const eventos = content.camino as Evento[]

/* Fila de fixture: chip de fecha + datos del evento + acción. */
function FixtureRow({ ev }: { ev: Evento }) {
  const accent = ev.bonus ? '#f0b429' : '#75AADB'

  const inner = (
    <div
      className={`flex items-center gap-4 sm:gap-5 rounded-2xl border bg-white px-4 sm:px-5 py-4 transition-all group ${
        ev.cerrado
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
      {ev.cerrado ? (
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#020618]/8 text-[#020618]/55 text-sm font-black px-4 py-2">
          Fecha cerrada
        </span>
      ) : ev.url ? (
        <span
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#75AADB] group-hover:bg-[#5a93c5] text-white text-sm font-black px-4 py-2 transition-colors"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        >
          Apuntate
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      ) : (
        <span aria-hidden className="shrink-0 text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
          {ev.bonus ? '🍺' : '⚽'}
        </span>
      )}
    </div>
  )

  if (ev.url && !ev.cerrado) {
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

              {/* Link al canal de WhatsApp (chip sutil, debajo de la copa) */}
              <a
                href="https://whatsapp.com/channel/0029VbCy5K8GehEOLE85SK0o"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enterate de novedades en el canal de WhatsApp de Startup World Cup Argentina (abre en una nueva pestaña)"
                className="-mt-16 sm:-mt-20 inline-flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-sm border border-[#25D366]/40 text-[#0f7a37] hover:text-[#0c6630] hover:border-[#25D366]/70 text-sm font-bold px-4 py-2 shadow-sm transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.518 5.26l-.999 3.648 3.97-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                Seguinos en WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default CaminoALaCopa
