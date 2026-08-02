import type { Ultimo } from '../lib/useLista'

/**
 * Lo fijo abajo: la confirmación de lo último que se acreditó —con su
 * "Deshacer"— y el botón del escáner.
 *
 * El "Deshacer" está porque en la puerta se toca la fila equivocada, y la
 * alternativa a un botón es un `update` a mano en Supabase mientras hay cola.
 */
function BarraAcciones({ ultimo, onDeshacer, onEscanear }: {
  ultimo: Ultimo | null
  onDeshacer: () => void
  onEscanear: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-swc-bg via-swc-bg to-transparent px-4 pt-8 pb-5">
      <div className="mx-auto max-w-lg">
        {ultimo && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-swc-ok/30 bg-swc-ok/10 px-4 py-3">
            <p className="truncate text-sm font-bold text-swc-ok">
              ✓ {ultimo.persona.nombre || ultimo.persona.email}
            </p>
            <button
              onClick={onDeshacer}
              className="shrink-0 text-xs font-extrabold uppercase tracking-[0.12em] text-gray-300 underline"
            >
              Deshacer
            </button>
          </div>
        )}

        <button
          onClick={onEscanear}
          className="w-full rounded-full border border-swc-accent/40 bg-white/[0.04] px-6 py-3.5 text-sm font-black text-swc-accent"
        >
          Escanear QR
        </button>
      </div>
    </div>
  )
}

export default BarraAcciones
