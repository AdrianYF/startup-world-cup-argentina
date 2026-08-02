import { IconoTick } from './Iconos'

/**
 * El flujo de una operación de varios pasos, en el panel de contexto.
 *
 * Dice dos cosas a la vez: dónde estamos y qué falta. Importa sobre todo en
 * «Importar», donde el paso que se saltea —la vista previa— es el único que
 * separa un upsert correcto de haber pisado la lista de acreditación con el
 * evento encima.
 */
export type Paso = {
  id: string
  label: string
  /** Una línea de qué pasa en este paso. */
  detalle?: string
}

export function Pasos({ pasos, actual }: {
  pasos: Paso[]
  /** Índice del paso en curso. Los anteriores quedan hechos. */
  actual: number
}) {
  return (
    <ol className="flex flex-col">
      {pasos.map((p, i) => {
        const hecho = i < actual
        const enCurso = i === actual
        return (
          <li key={p.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* El conector arranca abajo del círculo y llega al siguiente. El
                último no lo lleva: no hay a dónde ir. */}
            {i < pasos.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[11px] top-6 bottom-1 w-px ${
                  hecho ? 'bg-swc-accent/50' : 'bg-white/12'
                }`}
              />
            )}

            <span
              aria-hidden
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black ${
                hecho
                  ? 'border-swc-accent bg-swc-accent text-swc-bg'
                  : enCurso
                    ? 'border-swc-accent bg-swc-surface text-swc-accent shadow-[0_0_0_4px_rgba(117,170,219,0.15)]'
                    : 'border-white/20 bg-swc-surface text-gray-600'
              }`}
            >
              {hecho ? <IconoTick tam={13} /> : i + 1}
            </span>

            <div className="min-w-0 pt-0.5">
              <p className={`text-sm font-bold ${
                enCurso ? 'text-swc-light' : hecho ? 'text-swc-accent' : 'text-gray-500'
              }`}>
                {p.label}
                {enCurso && <span className="sr-only"> (paso actual)</span>}
              </p>
              {p.detalle && (
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{p.detalle}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
