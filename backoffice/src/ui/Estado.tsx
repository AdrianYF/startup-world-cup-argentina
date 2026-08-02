import type { ReactNode } from 'react'

/**
 * Los tres estados que toda sección tiene que saber pintar: cargando, roto y
 * listo. Están acá para que las cinco lo hagan igual — y sobre todo para que
 * "roto" siempre traiga el botón de reintentar en vez de dejar una pantalla en
 * blanco sin salida.
 */
export function Cargando() {
  return <p className="py-12 text-center text-sm text-gray-500">Cargando…</p>
}

export function Roto({ error, onReintentar }: { error: string; onReintentar: () => void }) {
  return (
    <div className="rounded-xl border border-swc-coral/30 bg-swc-coral/10 px-5 py-8 text-center">
      <p className="text-sm font-bold text-swc-coral">{error}</p>
      <button
        onClick={onReintentar}
        className="mt-4 rounded-full border border-white/20 px-5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-swc-light active:scale-95"
      >
        Reintentar
      </button>
    </div>
  )
}

/** La fila de números que encabeza una sección. */
export function Tarjetas({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
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
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${color}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-gray-500">{detalle}</p>}
    </div>
  )
}

/** Un chip de estado. El color dice lo mismo que el texto, para no depender de él. */
export function Chip({ children, tono }: { children: ReactNode; tono: 'ok' | 'warn' | 'coral' | 'neutro' }) {
  const clases = {
    ok: 'border-swc-ok/40 bg-swc-ok/10 text-swc-ok',
    warn: 'border-swc-warn/40 bg-swc-warn/10 text-swc-warn',
    coral: 'border-swc-coral/40 bg-swc-coral/10 text-swc-coral',
    neutro: 'border-white/15 bg-white/[0.04] text-swc-muted',
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
        className={`h-full rounded-full ${tono === 'ok' ? 'bg-swc-ok' : 'bg-swc-accent'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
