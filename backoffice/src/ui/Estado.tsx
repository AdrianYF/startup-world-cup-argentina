import type { ReactNode } from 'react'

/**
 * Los tres estados que toda sección tiene que saber pintar: cargando, roto y
 * listo. Están acá para que las cinco lo hagan igual — y sobre todo para que
 * «roto» siempre traiga el botón de reintentar en vez de dejar una pantalla en
 * blanco sin salida.
 */

/** Un bloque gris con un brillo que lo cruza. La pieza del esqueleto. */
function Hueso({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`swc-esqueleto block rounded bg-white/[0.06] ${className}`} />
}

/**
 * Anchos del esqueleto, fijos.
 *
 * En una constante y no en un `Math.random()`: tienen que ser los mismos en cada
 * render o el esqueleto tiembla mientras espera.
 */
const ANCHOS = ['w-2/5', 'w-1/2', 'w-1/3', 'w-3/5', 'w-2/5', 'w-1/2']

/**
 * El esqueleto de una sección mientras carga.
 *
 * Antes era un «Cargando…» centrado. El problema no era que fuera feo: es que
 * no decía nada. La pantalla tenía una altura mientras esperaba y otra cuando
 * llegaban los datos, así que cargar movía todo de lugar; y quien miraba no
 * sabía si venían cuatro números o una tabla de trescientas filas. El esqueleto
 * ocupa el lugar que va a ocupar el contenido.
 */
export function Cargando({ filas = 6, metricas = true }: {
  filas?: number
  /** La fila de números de arriba. Las pantallas que no la tienen la apagan. */
  metricas?: boolean
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>

      {metricas && (
        <div className="mb-6 grid grid-cols-2 border-y border-white/10 md:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="px-4 py-3.5 md:border-l md:border-white/10 md:first:border-l-0">
              <Hueso className="h-2 w-20" />
              <Hueso className="mt-3 h-6 w-14" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/10">
        {Array.from({ length: filas }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/5 px-3 py-3.5 last:border-b-0"
          >
            <Hueso className={`h-3 ${ANCHOS[i % ANCHOS.length]}`} />
            <Hueso className="ml-auto h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Roto({ error, onReintentar }: { error: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-swc-coral/30 bg-swc-coral/10 px-5 py-8 text-center">
      <p className="text-sm font-bold text-swc-coral">{error}</p>
      <button
        onClick={onReintentar}
        className="mt-4 rounded-full border border-white/20 px-5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-swc-light transition-transform active:scale-[0.98]"
      >
        Reintentar
      </button>
    </div>
  )
}

/**
 * La fila de números que encabeza una sección.
 *
 * Sin caja por número. Cuatro recuadros seguidos se leen como cuatro cosas
 * separadas, cuando son cuatro lecturas del mismo estado: lo que las agrupa es
 * la línea de arriba y la de abajo, y lo que las separa es el aire. La caja se
 * guarda para lo que de verdad está por encima del resto —una hoja, un modal—,
 * que es lo único que necesita elevación.
 */
export function Tarjetas({ children }: { children: ReactNode }) {
  return (
    <dl className="mb-6 grid grid-cols-2 border-y border-white/10 md:grid-cols-4">{children}</dl>
  )
}

export function Tarjeta({ label, valor, detalle, tono }: {
  label: string
  valor: ReactNode
  detalle?: string
  tono?: 'ok' | 'warn' | 'coral'
}) {
  const color = tono === 'ok' ? 'text-swc-ok'
    : tono === 'warn' ? 'text-swc-warn'
      : tono === 'coral' ? 'text-swc-coral'
        : 'text-swc-light'

  return (
    <div className="px-4 py-3.5 md:border-l md:border-white/10 md:first:border-l-0">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">{label}</dt>
      <dd>
        <p className={`mt-1 text-2xl font-black tabular-nums ${color}`}>{valor}</p>
        {detalle && <p className="mt-0.5 text-xs text-gray-500">{detalle}</p>}
      </dd>
    </div>
  )
}

/** Un chip de estado. El color dice lo mismo que el texto, para no depender de él. */
export function Chip({ children, tono }: {
  children: ReactNode
  tono: 'ok' | 'warn' | 'coral' | 'neutro' | 'oro'
}) {
  const clases = {
    ok: 'border-swc-ok/40 bg-swc-ok/10 text-swc-ok',
    warn: 'border-swc-warn/40 bg-swc-warn/10 text-swc-warn',
    coral: 'border-swc-coral/40 bg-swc-coral/10 text-swc-coral',
    neutro: 'border-white/15 bg-white/[0.04] text-swc-muted',
    // El mismo #d4af37 con el que se pinta la Entrada VIP en el sitio: quien la
    // compró tiene que reconocer el color en la puerta.
    oro: 'border-[#d4af37]/45 bg-[#d4af37]/15 text-[#d4af37]',
  }[tono]

  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] ${clases}`}>
      {children}
    </span>
  )
}

/** Barra proporcional. Para comparar de un vistazo sin traer una librería. */
export function Barra({ valor, maximo, tono = 'accent' }: {
  valor: number
  maximo: number
  tono?: 'accent' | 'ok'
}) {
  const pct = maximo > 0 ? Math.round((valor / maximo) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${
          tono === 'ok' ? 'bg-swc-ok' : 'bg-swc-accent'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Cuando no hay nada que mostrar.
 *
 * Un vacío sin explicación parece un error. Éste dice qué falta y, cuando hay
 * algo para hacer al respecto, ofrece el camino.
 */
export function Vacio({ titulo, children, accion }: {
  titulo: string
  children?: ReactNode
  accion?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/12 px-5 py-14 text-center">
      <p className="text-sm font-bold text-swc-light">{titulo}</p>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">{children}</p>}
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  )
}
