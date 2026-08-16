import { useEffect, useId, type FormEvent, type ReactNode } from 'react'

/**
 * La hoja que sale de abajo: fichas, altas, pendientes.
 *
 * Estaba escrita cinco veces —Panel, FichaAsistente, FichaOrden, Agregar,
 * Pendientes— con el mismo overlay, el mismo `max-h-[90vh]` y el mismo botón de
 * cerrar al pie. Dos de las cinco no cerraban con Escape porque el `useEffect`
 * había quedado sólo en las otras tres; acá lo tienen todas.
 *
 * Sale de abajo y no del centro porque la mitad de las veces se abre con una
 * mano en la puerta: lo que se toca tiene que caer donde está el pulgar.
 */
/**
 * Dónde se para la hoja.
 *
 *   · `auto`     — abajo en el celular, centrada desde `sm:`. Es el default y lo
 *                  que corresponde a casi todo: en el teléfono lo que se toca
 *                  tiene que caer donde está el pulgar.
 *   · `abajo`    — pegada abajo también en pantalla grande, para lo que es parte
 *                  del trabajo de la puerta.
 *   · `centrada` — centrada en todos los anchos. Para lo que se completa mirando
 *                  la pantalla, no tanteando: un formulario con varios campos
 *                  pegado al borde inferior queda medio tapado por el teclado.
 */
type Posicion = 'auto' | 'abajo' | 'centrada'

const MARCO: Record<Posicion, string> = {
  auto: 'items-end sm:items-center sm:justify-center',
  abajo: 'items-end',
  centrada: 'items-center justify-center p-4',
}

const CAJA: Record<Posicion, string> = {
  auto: 'rounded-t-2xl border-t sm:rounded-2xl sm:border',
  abajo: 'rounded-t-2xl border-t',
  centrada: 'rounded-2xl border',
}

export function Hoja({
  titulo, subtitulo, chips, onCerrar, onSubmit, posicion = 'auto', cerrar = 'Close', children,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  /** Los chips de estado que van al lado del título. */
  chips?: ReactNode
  onCerrar: () => void
  /** Con esto la hoja es un `<form>` y el submit es su acción principal. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
  posicion?: Posicion
  cerrar?: string
  children: ReactNode
}) {
  const id = useId()

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', alTecla)
    return () => window.removeEventListener('keydown', alTecla)
  }, [onCerrar])

  // El 90vh deja aire arriba y abajo también cuando el marco pone padding: con
  // el viewport más chico que se usa, ese 10% ya es más que los 32px del `p-4`.
  const clases =
    'relative mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto ' +
    'border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8 ' +
    CAJA[posicion]

  const contenido = (
    <>
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={id} className="text-xl font-black text-swc-light">{titulo}</h2>
          {chips}
        </div>
        {subtitulo && <p className="mt-1 text-sm text-swc-muted">{subtitulo}</p>}
      </header>

      {children}

      <button
        type="button"
        onClick={onCerrar}
        className="mt-5 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500"
      >
        {cerrar}
      </button>
    </>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      className={`fixed inset-0 z-50 flex ${MARCO[posicion]}`}
    >
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Close" />
      {onSubmit
        ? <form onSubmit={onSubmit} className={clases}>{contenido}</form>
        : <div className={clases}>{contenido}</div>}
    </div>
  )
}
