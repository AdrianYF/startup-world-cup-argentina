import type { InputHTMLAttributes, ReactNode } from 'react'

/**
 * Los campos de un formulario del backoffice.
 *
 * Un `Campo` es siempre lo mismo: rótulo arriba, control en el medio, ayuda
 * abajo. Antes cada pantalla se lo armaba con dos constantes sueltas —`INPUT` y
 * `LABEL` copiadas en Pin, Agregar, FichaAsistente, Importar y Stock— y la
 * ayuda quedaba a criterio de cada una.
 *
 * `Lectura` es el mismo bloque pero para lo que no se edita: el operador, el
 * saldo, el canal. Se ve como un campo porque ocupa el mismo lugar en la lectura
 * del formulario, pero no es tocable ni tabulable.
 */

/** El rótulo de cualquier cosa: campos, secciones del panel de contexto, listas. */
export function Rotulo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted ${className}`}>
      {children}
    </span>
  )
}

/** Cuando algo es opcional se dice en el rótulo, no con un asterisco al lado. */
export function Opcional() {
  return <span className="font-normal normal-case tracking-normal text-gray-600"> (opcional)</span>
}

const CONTROL =
  'w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-2.5 text-base ' +
  'text-swc-light placeholder:text-gray-600 outline-none transition-colors ' +
  'focus:border-swc-accent disabled:opacity-60'

type CampoProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string
  label: ReactNode
  /** El párrafo gris de abajo: qué significa el campo o qué rompe si se llena mal. */
  ayuda?: ReactNode
  /** Icono o texto pegado adentro, a la izquierda. */
  prefijo?: ReactNode
  /** El botón de adentro a la derecha, tipo «MAX». */
  accion?: { label: string; onClick: () => void }
  /** Error propio del campo. Reemplaza a la ayuda mientras está. */
  error?: string
}

export function Campo({ id, label, ayuda, prefijo, accion, error, className = '', ...props }: CampoProps) {
  return (
    <div className={className}>
      <label htmlFor={id}>
        <Rotulo className="mb-1.5">{label}</Rotulo>
      </label>

      <div className="relative">
        {prefijo && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
            {prefijo}
          </span>
        )}
        <input
          id={id}
          {...props}
          aria-describedby={ayuda || error ? `${id}-ayuda` : undefined}
          aria-invalid={error ? true : undefined}
          className={`${CONTROL} ${prefijo ? 'pl-11' : ''} ${accion ? 'pr-20' : ''} ${
            error ? 'border-swc-coral/60' : ''
          }`}
        />
        {accion && (
          <button
            type="button"
            onClick={accion.onClick}
            className="absolute inset-y-0 right-2 my-auto h-7 rounded-full px-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-swc-accent hover:bg-swc-accent/10"
          >
            {accion.label}
          </button>
        )}
      </div>

      {(error || ayuda) && (
        <p id={`${id}-ayuda`} className={`mt-1 text-xs ${error ? 'font-bold text-swc-coral' : 'text-gray-500'}`}>
          {error || ayuda}
        </p>
      )}
    </div>
  )
}

/** Un campo de sólo lectura: ocupa el lugar de uno editable pero no se toca. */
export function Lectura({ label, children, mono }: {
  label: ReactNode
  children: ReactNode
  /** Para ids, tokens y direcciones: tabular y cortable. */
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
      <Rotulo>{label}</Rotulo>
      <p className={`mt-1 font-bold text-swc-light ${mono ? 'break-all font-mono text-xs' : 'text-sm'}`}>
        {children}
      </p>
    </div>
  )
}

/**
 * La lista de pares etiqueta/valor de una ficha.
 *
 * Estaba definida cuatro veces —Panel, FichaAsistente, FichaOrden, Importar—
 * como un `function Dato()` local en cada archivo, cada uno con su padding y su
 * alineación. Es el mismo bloque: lo que ya no se edita, en orden de lectura.
 */
export function Datos({ children }: { children: ReactNode }) {
  return <dl className="text-sm">{children}</dl>
}

export function Dato({ label, children, tono }: {
  label: ReactNode
  children: ReactNode
  tono?: 'ok' | 'warn' | 'coral'
}) {
  const color = tono === 'ok' ? 'text-swc-ok'
    : tono === 'warn' ? 'text-swc-warn'
      : tono === 'coral' ? 'text-swc-coral'
        : 'text-swc-light'

  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/5 py-1.5 first:border-t-0">
      <dt className="pt-px text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </dt>
      <dd className={`text-right break-words font-bold tabular-nums ${color}`}>{children}</dd>
    </div>
  )
}

/** La fila de campos. Uno abajo del otro en el celular, en grilla desde `sm:`. */
export function Campos({ columnas = 2, children }: { columnas?: 1 | 2 | 3; children: ReactNode }) {
  const grilla = columnas === 1 ? '' : columnas === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return <div className={`grid grid-cols-1 gap-3 ${grilla}`}>{children}</div>
}

/** Un buscador. Es el control más usado del backoffice, así que tiene su forma. */
export function Buscador({ valor, onCambio, placeholder, autoFocus, onKeyDown, id = 'buscador' }: {
  valor: string
  onCambio: (v: string) => void
  placeholder: string
  autoFocus?: boolean
  /**
   * Para manejar las flechas y el Enter sin sacar el foco del campo. Es lo que
   * deja recorrer los resultados y abrir el elegido sin tocar el mouse.
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  id?: string
}) {
  return (
    <input
      id={id}
      type="search"
      value={valor}
      onChange={e => onCambio(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      aria-label={placeholder}
      autoFocus={autoFocus}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="search"
      className={CONTROL}
    />
  )
}
