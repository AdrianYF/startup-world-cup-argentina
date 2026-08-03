import { Boton } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Rotulo } from '../ui/Campos'
import { Hoja } from '../ui/Hoja'
import { hora } from '../lib/buscar'
import type { Pendiente } from '../lib/almacen'

/**
 * Lo que todavía no llegó al servidor.
 *
 * Existe porque la alternativa era un contador que decía «3 sin mandar» y nada
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
  const vacio = cola.length === 0 && descartados.length === 0

  return (
    <Hoja titulo="Sin sincronizar" onCerrar={onCerrar} posicion="abajo">
      {vacio && (
        <Aviso tono="ok">
          Todo lo que se anotó en este dispositivo llegó al servidor.
        </Aviso>
      )}

      {cola.length > 0 && (
        <section className="mb-5">
          <Rotulo className="mb-2 text-swc-warn">
            {cola.length} en cola · se reintenta solo
          </Rotulo>
          <ul className="flex flex-col gap-2">
            {cola.map(p => (
              <li key={p.en} className="rounded-xl border border-swc-warn/30 bg-swc-warn/10 px-4 py-3">
                <p className="text-sm font-bold text-swc-light">{p.que}</p>
                <p className="mt-0.5 text-xs tabular-nums text-gray-500">{hora(p.en)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {descartados.length > 0 && (
        <section className="mb-5">
          <Rotulo className="mb-2 text-swc-coral">
            {descartados.length} rechazados por el servidor
          </Rotulo>
          <ul className="flex flex-col gap-2">
            {descartados.map(p => (
              <li key={p.en} className="rounded-xl border border-swc-coral/30 bg-swc-coral/10 px-4 py-3">
                <p className="text-sm font-bold text-swc-light">{p.que}</p>
                <p className="mt-0.5 text-xs text-swc-coral">{p.motivo}</p>
                <p className="mt-0.5 text-xs tabular-nums text-gray-500">{hora(p.en)}</p>
                <div className="mt-2.5 flex gap-2">
                  <Boton tono="secundario" tam="sm" onClick={() => onReintentar(p)}>
                    Reintentar
                  </Boton>
                  {/* Darlo por perdido lo decide una persona, nunca el código: es
                      la línea que dice que ese ingreso no se va a poder
                      reconstruir. */}
                  <Boton tono="fantasma" tam="sm" onClick={() => onOlvidar(p)}>
                    Descartar
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cola.length > 0 && (
        <Boton tono="secundario" tam="lg" ancho onClick={onSincronizar}>
          Sincronizar ahora
        </Boton>
      )}
    </Hoja>
  )
}

export default Pendientes
