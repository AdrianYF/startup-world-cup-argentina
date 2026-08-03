import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Lo que se toca: botones, tabs y píldoras.
 *
 * Están juntos porque son el mismo problema —un control que dice en qué estado
 * está y qué pasa si lo tocás— y porque hasta ahora cada sección se lo escribía
 * de nuevo: el markup de la píldora activa estaba copiado en Cabecera,
 * Asistentes, Ventas, Importar, Métricas y Agregar, con seis padding distintos.
 */

/* -------------------------------------------------------------------------- */
/* Botón                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * El tono dice qué clase de acción es, no cuánto importa:
 *   · primario  — la acción de la pantalla
 *   · ok        — la que deja entrar a alguien (mismo verde que la acreditación)
 *   · secundario— la alternativa razonable
 *   · fantasma  — lo que casi nunca se toca
 *   · peligro   — lo que saca a alguien de una lista o mueve plata
 */
type Tono = 'primario' | 'ok' | 'secundario' | 'fantasma' | 'peligro'

const TONOS: Record<Tono, string> = {
  primario: 'bg-swc-accent text-swc-bg',
  ok: 'bg-swc-ok text-swc-bg',
  secundario: 'border border-swc-accent/40 bg-white/[0.04] text-swc-accent',
  fantasma: 'border border-white/15 bg-white/[0.02] text-swc-muted',
  peligro: 'border border-swc-coral/40 text-swc-coral',
}

const TAMANOS = {
  sm: 'px-4 py-1.5 text-[10px] uppercase tracking-[0.12em]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tono?: Tono
  tam?: keyof typeof TAMANOS
  ancho?: boolean
  /**
   * Qué dice mientras trabaja. Con texto acá el botón queda deshabilitado solo:
   * un botón que sigue clickeable mientras espera al servidor es la forma de
   * acreditar a la misma persona tres veces.
   */
  ocupado?: string
  children: ReactNode
}

export function Boton({
  tono = 'primario', tam = 'md', ancho, ocupado, disabled, children, className = '', ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || Boolean(ocupado)}
      className={`rounded-full font-black transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${
        TONOS[tono]
      } ${TAMANOS[tam]} ${ancho ? 'w-full' : ''} ${className}`}
    >
      {ocupado || children}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

export type Opcion<T extends string> = {
  id: T
  label: string
  /** El número al lado del nombre: cuántas filas hay detrás de este filtro. */
  cuenta?: number
}

/**
 * Tabs subrayadas: para cortar un mismo conjunto en vistas excluyentes —todas /
 * pagadas / con problema—. Si lo que se elige es una faceta y no una vista,
 * corresponde `Pildoras`.
 *
 * Scrollean en horizontal en vez de envolverse: cuatro filtros en dos filas
 * mueven el contenido de abajo cada vez que cambia el ancho.
 */
export function Tabs<T extends string>({ opciones, valor, onCambio, etiqueta }: {
  opciones: Opcion<T>[]
  valor: T
  onCambio: (id: T) => void
  etiqueta: string
}) {
  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className="-mb-px flex gap-1 overflow-x-auto border-b border-white/10"
    >
      {opciones.map(o => {
        const activa = o.id === valor
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={activa}
            onClick={() => onCambio(o.id)}
            className={`relative shrink-0 px-3 py-2.5 text-sm font-bold transition-colors sm:px-4 ${
              activa ? 'text-swc-accent' : 'text-swc-muted hover:text-swc-light'
            }`}
          >
            {o.label}
            {o.cuenta !== undefined && (
              <span className={`ml-1.5 tabular-nums ${activa ? 'text-swc-accent/70' : 'text-gray-600'}`}>
                {o.cuenta}
              </span>
            )}
            {activa && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-swc-accent" />}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Píldoras                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Píldoras: para elegir una faceta dentro de una vista —el día, el canal, el
 * motivo del alta—. A diferencia de las tabs, no cambian de qué se está
 * hablando, sólo lo recortan.
 */
export function Pildoras<T extends string>({ opciones, valor, onCambio, etiqueta, tam = 'md' }: {
  opciones: Opcion<T>[]
  valor: T
  onCambio: (id: T) => void
  etiqueta: string
  tam?: 'sm' | 'md'
}) {
  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
      {opciones.map(o => (
        <Pildora key={o.id} opcion={o} activa={o.id === valor} tam={tam} onClick={() => onCambio(o.id)} />
      ))}
    </div>
  )
}

/**
 * Píldoras de selección múltiple.
 *
 * Para cuando la respuesta puede ser más de una: los días que habilita una
 * tanda del import, por ejemplo. Devuelve los elegidos en el orden de
 * `opciones` y no en el de los clicks — el texto que se arma con eso termina en
 * la base y tiene que ser el mismo siempre.
 */
export function PildorasMulti<T extends string>({ opciones, valores, onCambio, etiqueta, tam = 'md' }: {
  opciones: Opcion<T>[]
  valores: T[]
  onCambio: (ids: T[]) => void
  etiqueta: string
  tam?: 'sm' | 'md'
}) {
  const alternar = (id: T) => {
    const elegidos = new Set(valores)
    if (elegidos.has(id)) elegidos.delete(id)
    else elegidos.add(id)
    onCambio(opciones.map(o => o.id).filter(x => elegidos.has(x)))
  }

  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-1.5">
      {opciones.map(o => (
        <Pildora
          key={o.id}
          opcion={o}
          activa={valores.includes(o.id)}
          tam={tam}
          onClick={() => alternar(o.id)}
        />
      ))}
    </div>
  )
}

function Pildora<T extends string>({ opcion, activa, tam, onClick }: {
  opcion: Opcion<T>
  activa: boolean
  tam: 'sm' | 'md'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`rounded-full font-black transition-colors ${
        tam === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
      } ${
        activa
          ? 'bg-swc-accent text-swc-bg'
          : 'bg-white/[0.06] text-swc-muted hover:text-swc-light'
      }`}
    >
      {opcion.label}
      {opcion.cuenta !== undefined && (
        <span className="ml-1.5 tabular-nums opacity-70">{opcion.cuenta}</span>
      )}
    </button>
  )
}
