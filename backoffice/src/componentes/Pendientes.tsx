import { useEffect } from 'react'
import { hora } from '../lib/buscar'
import type { Pendiente } from '../lib/almacen'

/**
 * Lo que todavía no llegó al servidor.
 *
 * Existe porque la alternativa era un contador que decía "3 sin mandar" y nada
 * más: no se podía saber qué eran esos tres, ni forzar el reintento, ni
 * enterarse de que un cuarto se había perdido por un 4xx. Del otro lado de cada
 * línea hay una persona que ya entró.
 *
 * Dos listas:
 *   · en cola      — falló por red, se reintenta solo
 *   · descartados  — el servidor lo rechazó; no se arregla reintentando, y lo
 *                    tiene que mirar alguien
 */
function Pendientes({ cola, descartados, onReintentar, onOlvidar, onSincronizar, onCerrar }: {
  cola: Pendiente[]
  descartados: Pendiente[]
  onReintentar: (p: Pendiente) => void
  onOlvidar: (p: Pendiente) => void
  onSincronizar: () => void
  onCerrar: () => void
}) {
  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [onCerrar])

  const vacio = cola.length === 0 && descartados.length === 0

  return (
    <div className="fixed inset-0 z-30 flex items-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      <div className="relative mx-auto max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8">
        <h2 className="text-xl font-black text-swc-light">Sin sincronizar</h2>

        {vacio && (
          <p className="mt-4 mb-2 text-sm text-swc-muted">
            Todo lo que se anotó en este dispositivo llegó al servidor.
          </p>
        )}

        {cola.length > 0 && (
          <section className="mt-5">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-warn">
              {cola.length} en cola · se reintenta solo
            </p>
            <ul className="flex flex-col gap-2">
              {cola.map(p => (
                <li
                  key={p.en}
                  className="rounded-xl border border-swc-warn/30 bg-swc-warn/10 px-4 py-3"
                >
                  <p className="text-sm font-bold text-swc-light">{p.que}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-gray-500">{hora(p.en)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {descartados.length > 0 && (
          <section className="mt-5">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-coral">
              {descartados.length} rechazados por el servidor
            </p>
            <ul className="flex flex-col gap-2">
              {descartados.map(p => (
                <li
                  key={p.en}
                  className="rounded-xl border border-swc-coral/30 bg-swc-coral/10 px-4 py-3"
                >
                  <p className="text-sm font-bold text-swc-light">{p.que}</p>
                  <p className="mt-0.5 text-xs text-swc-coral">{p.motivo}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-gray-500">{hora(p.en)}</p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => onReintentar(p)}
                      className="rounded-full border border-swc-accent/40 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-swc-accent active:scale-95"
                    >
                      Reintentar
                    </button>
                    {/* Darlo por perdido lo decide una persona, nunca el código:
                        es la línea que dice que ese ingreso no se va a poder
                        reconstruir. */}
                    <button
                      onClick={() => onOlvidar(p)}
                      className="rounded-full border border-white/15 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-swc-muted active:scale-95"
                    >
                      Descartar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cola.length > 0 && (
          <button
            onClick={onSincronizar}
            className="mt-6 w-full rounded-full border border-swc-accent/40 bg-white/[0.04] px-6 py-3.5 text-sm font-black text-swc-accent active:scale-95"
          >
            Sincronizar ahora
          </button>
        )}

        <button
          onClick={onCerrar}
          className="mt-4 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default Pendientes
