import { useEffect } from 'react'
import { hora } from '../lib/buscar'
import type { Checkin, Persona } from '../lib/tipos'

/**
 * La ficha de una persona, con el botón de acreditar y sus ingresos del día.
 *
 * Sale de abajo y ocupa el ancho entero: el botón tiene que quedar donde está el
 * pulgar, no arriba a la derecha.
 */
function Panel({ persona, ingresos, onAcreditar, onAnular, onCerrar }: {
  persona: Persona
  ingresos: Checkin[]
  onAcreditar: () => void
  onAnular: (checkin: Checkin) => void
  onCerrar: () => void
}) {
  const yaEntro = ingresos.length > 0

  // Escape cierra: en la puerta hay teclados bluetooth y tablets con funda.
  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-30 flex items-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      <div className="relative mx-auto max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8">
        <h2 className="text-xl font-black text-swc-light">{persona.nombre || persona.email}</h2>
        <p className="mt-1 text-sm text-swc-muted">{persona.email}</p>

        <dl className="mt-5 mb-6">
          <Dato label="Entrada" valor={persona.entrada} />
          <Dato label="Días" valor={persona.dias} />
          <Dato label="Canal" valor={persona.origen === 'web' ? 'Venta propia' : persona.origen} />
          {persona.empresa && <Dato label="Empresa" valor={persona.empresa} />}
          {persona.telefono && <Dato label="Teléfono" valor={persona.telefono} />}
        </dl>

        {persona.pagoDoble && (
          <p className="mb-4 rounded-xl border border-swc-warn/40 bg-swc-warn/10 px-4 py-3 text-sm font-bold text-swc-warn">
            También figura en Startup Grind: pagó dos veces la misma entrada. Anotalo para el reembolso.
          </p>
        )}

        {/* Los ingresos del día, todos y con su hora.
            Antes se veía sólo el último, y anular pasados los siete segundos del
            "Deshacer" era un update a mano en Supabase con la fila esperando.
            Acá cada ingreso tiene su botón. */}
        {yaEntro && (
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
              {ingresos.length === 1 ? 'Ingreso de hoy' : `${ingresos.length} ingresos hoy`}
            </p>
            <ul className="flex flex-col gap-1.5">
              {ingresos.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-300">
                    <span className="font-bold tabular-nums text-swc-ok">{hora(c.creadoEn)}</span>
                    {c.por ? <span className="text-gray-500"> · {c.por}</span> : null}
                  </span>
                  <button
                    onClick={() => onAnular(c)}
                    className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-swc-muted active:scale-95"
                  >
                    Anular
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Si ya entró, el botón no desaparece: el caso real es alguien que
            vuelve de fumar, no un fraude. Sólo baja de tono. */}
        <button
          onClick={onAcreditar}
          className={`w-full rounded-full px-6 py-4 text-base font-black ${
            yaEntro
              ? 'border border-white/20 bg-transparent text-gray-300'
              : 'bg-swc-ok text-swc-bg'
          }`}
        >
          {yaEntro ? 'Acreditar igual' : 'Acreditar'}
        </button>
      </div>
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/5 py-2 first:border-t-0">
      <dt className="pt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </dt>
      <dd className="text-right text-sm font-bold text-swc-light">{valor}</dd>
    </div>
  )
}

export default Panel
