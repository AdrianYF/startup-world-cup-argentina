import type { ReactNode } from 'react'

/**
 * De qué se trata esta operación: la persona, el tier, la compra.
 *
 * Va arriba del panel de trabajo y contesta «¿sobre quién estoy operando?»
 * antes de que se toque nada. Importa porque casi todas las hojas del backoffice
 * se abren desde una tabla, y entre el click y la acción hay scroll suficiente
 * para perder de vista a quién se abrió.
 */
function iniciales(texto: string): string {
  const partes = texto.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return partes.map(p => p[0]).join('').toUpperCase() || '?'
}

export function Recurso({ titulo, subtitulo, valor, detalle, chips, tono = 'accent' }: {
  titulo: string
  subtitulo?: ReactNode
  /** El número de la derecha: el total, el cupo, la cantidad de entradas. */
  valor?: ReactNode
  detalle?: string
  chips?: ReactNode
  /** `ok` para lo que ya entró, `neutro` para lo que está fuera de juego. */
  tono?: 'accent' | 'ok' | 'neutro'
}) {
  const borde = tono === 'ok' ? 'border-swc-ok/40' : tono === 'neutro' ? 'border-white/12' : 'border-swc-accent/40'
  const avatar = tono === 'ok'
    ? 'bg-swc-ok/15 text-swc-ok'
    : tono === 'neutro'
      ? 'bg-white/[0.06] text-swc-muted'
      : 'bg-swc-accent/15 text-swc-accent'

  return (
    <div className={`rounded-xl border ${borde} bg-white/[0.03] px-4 py-3`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${avatar}`}
        >
          {iniciales(titulo)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-swc-light">{titulo}</p>
          {subtitulo && <p className="truncate text-xs text-swc-muted">{subtitulo}</p>}
        </div>

        {valor !== undefined && (
          <div className="shrink-0 text-right">
            <p className="font-black tabular-nums text-swc-light">{valor}</p>
            {detalle && (
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
                {detalle}
              </p>
            )}
          </div>
        )}
      </div>

      {chips && <div className="mt-2.5 flex flex-wrap gap-1.5">{chips}</div>}
    </div>
  )
}
