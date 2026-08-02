import { hora } from '../lib/buscar'
import type { Checkin, Persona } from '../lib/tipos'

/**
 * Una persona en la lista.
 *
 * Muestra lo justo para reconocerla de un vistazo con el celular en la mano:
 * nombre, mail y empresa. A la derecha, o la hora a la que entró o de qué canal
 * viene — nunca las dos, porque una vez que entró el canal ya no importa.
 */
function FilaPersona({ persona, ingresos, onClick }: {
  persona: Persona
  ingresos: Checkin[]
  onClick: () => void
}) {
  const ultimo = ingresos[ingresos.length - 1]

  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 border-b border-white/5 py-3.5 text-left active:bg-white/[0.04]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-swc-light">
            {persona.nombre || <span className="text-gray-500">(sin nombre)</span>}
            {persona.pagoDoble && (
              <span className="ml-1.5 text-swc-warn" title="También compró en Startup Grind">⚠</span>
            )}
          </p>
          <p className="truncate text-xs text-gray-500">
            {persona.email}
            {persona.empresa ? ` · ${persona.empresa}` : ''}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {ultimo ? (
            <p className="text-xs font-bold tabular-nums text-swc-ok">
              ✓ {hora(ultimo.creadoEn)}
            </p>
          ) : (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-600">
              {persona.origen === 'startupgrind' ? 'SG' : persona.origen}
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

export default FilaPersona
