import { hora } from '../lib/buscar'
import { siglaCanal } from '../lib/canales'
import { esVip, type Checkin, type Persona } from '../lib/tipos'
import { IconoAlerta, IconoTick } from '../ui/Iconos'

/**
 * Una persona en la lista.
 *
 * Muestra lo justo para reconocerla de un vistazo con el celular en la mano:
 * nombre, mail y empresa. A la derecha, o la hora a la que entró o de qué canal
 * viene — nunca las dos, porque una vez que entró el canal ya no importa.
 */
function FilaPersona({ persona, ingresos, onClick, activa }: {
  persona: Persona
  ingresos: Checkin[]
  onClick: () => void
  /**
   * La fila donde están paradas las flechas del buscador. Sólo aparece cuando
   * alguien navega con teclado: con el dedo no hay «fila actual».
   */
  activa?: boolean
}) {
  const ultimo = ingresos[ingresos.length - 1]

  return (
    <li>
      <button
        onClick={onClick}
        aria-current={activa}
        className={`flex w-full items-center gap-3 border-b border-white/5 py-3.5 pr-1 text-left transition-colors active:bg-white/[0.04] ${
          activa ? 'bg-swc-accent/10 pl-2 shadow-[inset_2px_0_0_var(--color-swc-accent)]' : 'pl-0'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-swc-light">
            {/* El VIP va ANTES del nombre y en dorado: en la puerta se decide
                por dónde pasa la persona antes de terminar de leer quién es, y
                un cartel al final de un nombre largo se pierde en el truncado. */}
            {esVip(persona.entrada) && (
              <span
                className="mr-1.5 rounded px-1.5 py-0.5 align-[1px] text-[9px] font-black uppercase tracking-[0.1em] bg-[#d4af37]/20 text-[#d4af37] ring-1 ring-[#d4af37]/40"
                title={persona.entrada}
              >
                VIP
              </span>
            )}
            {persona.nombre || <span className="text-gray-500">(sin nombre)</span>}
            {persona.pagoDoble && (
              <IconoAlerta tam={14} className="ml-1.5 inline-block align-[-2px] text-swc-warn" titulo="También compró en Startup Grind" />
            )}
          </p>
          <p className="truncate text-xs text-gray-500">
            {persona.email}
            {persona.empresa ? ` · ${persona.empresa}` : ''}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {ultimo ? (
            <p className="flex items-center justify-end gap-1 text-xs font-bold tabular-nums text-swc-ok">
              <IconoTick tam={14} />
              {hora(ultimo.creadoEn)}
            </p>
          ) : (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-600">
              {siglaCanal(persona.origen)}
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

export default FilaPersona
