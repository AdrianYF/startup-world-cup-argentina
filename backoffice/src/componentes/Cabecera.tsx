import { Buscador } from '../ui/Campos'
import { IconoRecargar } from '../ui/Iconos'
import { Pildoras, type Opcion } from '../ui/Acciones'
import type { EstadoCola } from '../lib/acreditar'
import type { Dia } from '../lib/tipos'

/**
 * Lo que queda fijo arriba en el modo día: qué día, cuánta gente entró, el
 * buscador y —cuando corresponde— los avisos de que algo no está bien.
 *
 * El buscador es lo que más se usa, así que va pegado al pulgar y con autofocus:
 * en la puerta se tipean tres letras del apellido y listo.
 *
 * La última píldora es «Todos», y no es un día: es la salida al padrón completo.
 * Está acá y no en el menú porque es la misma pregunta —a quién estoy mirando—
 * y separarla en dos secciones era lo que obligaba a buscar dos veces a la misma
 * persona.
 */
type Props = {
  dias: Dia[]
  /** El día activo, o `padron`. */
  vista: string
  onVista: (id: string) => void
  adentro: number
  total: number
  busqueda: string
  onBusqueda: (v: string) => void
  sinConexion: boolean
  estadoCola: EstadoCola
  onPendientes: () => void
  onRecargar: () => void
  sincronizando: boolean
  /** Filas de la lista que no caen en ningún día del evento. */
  sinDia?: number
}

export const PADRON = 'padron'

function Cabecera({
  dias, vista, onVista, adentro, total, busqueda, onBusqueda, sinConexion, estadoCola,
  onPendientes, onRecargar, sincronizando, sinDia,
}: Props) {
  const pendientes = estadoCola.enCola + estadoCola.descartados

  const opciones: Opcion<string>[] = [
    ...dias.map(d => ({ id: d.id, label: `${d.label} ${d.fecha.slice(-2).replace(/^0/, '')}` })),
    { id: PADRON, label: 'Todos' },
  ]

  return (
    <header className="sticky top-14 z-20 border-b border-white/10 bg-swc-bg/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Pildoras
            opciones={opciones}
            valor={vista}
            onCambio={onVista}
            etiqueta="Día o padrón completo"
            tam="sm"
          />
          <div className="flex shrink-0 items-center gap-2">
            <p className="text-xs font-bold tabular-nums text-swc-muted">
              <span className="text-swc-light">{adentro}</span>/{total}
            </p>
            {/* Recargar. Tocar el día ya activo no hace nada, así que sin esto la
                única forma de volver a bajar la lista era recargar la página. */}
            <button
              onClick={onRecargar}
              title="Recargar la lista"
              aria-label="Recargar la lista"
              className="rounded-full border border-white/15 p-2 text-swc-muted active:scale-95"
            >
              <IconoRecargar tam={14} className={sincronizando ? 'animate-spin' : undefined} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <Buscador
            id="buscar-puerta"
            valor={busqueda}
            onCambio={onBusqueda}
            placeholder="Buscar por apellido, mail o empresa"
            autoFocus
          />
        </div>
      </div>

      {/* El chip de la cola abre la hoja de pendientes. Antes era un texto muerto
          que decía «3 sin mandar» y no había forma de ver qué eran esos tres. */}
      {(sinConexion || pendientes > 0) && (
        <button
          onClick={onPendientes}
          className={`block w-full px-4 py-1.5 text-center text-[11px] font-bold ${
            estadoCola.descartados > 0
              ? 'bg-swc-coral/15 text-swc-coral'
              : 'bg-swc-warn/15 text-swc-warn'
          }`}
        >
          {sinConexion ? 'Sin conexión' : 'Sincronizando'}
          {estadoCola.enCola > 0 && ` · ${estadoCola.enCola} sin mandar`}
          {estadoCola.descartados > 0 && ` · ${estadoCola.descartados} rechazados`}
          <span className="ml-1.5 underline">Ver</span>
        </button>
      )}

      {/* Gente que no aparece en NINGUNA puerta porque su campo `dias` no matchea
          ningún día del evento. Sin este cartel el problema es invisible hasta
          que alguien se queda afuera. */}
      {Boolean(sinDia) && (
        <p className="bg-swc-coral/15 px-4 py-1.5 text-center text-[11px] font-bold text-swc-coral">
          {sinDia} {sinDia === 1 ? 'persona no cae' : 'personas no caen'} en ningún día — revisar el import
        </p>
      )}
    </header>
  )
}

export default Cabecera
