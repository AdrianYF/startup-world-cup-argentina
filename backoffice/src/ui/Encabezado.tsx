import type { ReactNode } from 'react'

/**
 * El encabezado de una sección: qué es esta pantalla y qué se puede hacer acá.
 *
 * La bajada no es relleno. Cada sección del backoffice reemplaza a algo que
 * antes se hacía a mano en el SQL Editor, y quien la abre por primera vez es
 * alguien del staff que no escribió el código: una línea diciendo de qué se
 * trata evita la pregunta por WhatsApp un sábado a la mañana.
 */
export function Encabezado({ titulo, bajada, acciones }: {
  titulo: string
  bajada?: ReactNode
  /** Lo que va arriba a la derecha: recargar, exportar, agregar. */
  acciones?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-black text-swc-light sm:text-2xl">{titulo}</h1>
        {bajada && <p className="mt-1 max-w-2xl text-sm text-swc-muted">{bajada}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </header>
  )
}
