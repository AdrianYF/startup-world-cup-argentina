import { Buscador } from '../ui/Campos'
import { IconoRecargar } from '../ui/Iconos'
import { Pildoras, type Opcion } from '../ui/Acciones'
import type { EstadoCola } from '../lib/acreditar'
import type { Dia } from '../lib/tipos'

/**
 * Lo que queda fijo arriba en la puerta: qué día, cuánta gente entró, el
 * buscador y —cuando corresponde— los avisos de que algo no está bien.
 *
 * El buscador es lo que más se usa, así que va pegado al pulgar y con autofocus:
 * en la puerta se tipean tres letras del apellido y listo.
 *
 * Las píldoras son SÓLO días. «Todos» estaba acá y se fue: no era un día, era la
 * salida al padrón completo —con el mail y el teléfono de cada persona— a un
 * dedo del día que estás acreditando.
 *
 * Esta cabecera reemplaza a la barra de navegación del backoffice, que en la
 * puerta no pintaba nada: cinco secciones de administración arriba de la pantalla
 * que se usa de pie y con una mano. Queda una sola salida, «Admin», y la de
 * cerrar sesión.
 */
type Props = {
  dias: Dia[]
  /** El día activo. */
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
  /** La salida a administración. */
  onAdmin: () => void
  onSalir?: () => void
}

function Cabecera({
  dias, vista, onVista, adentro, total, busqueda, onBusqueda, sinConexion, estadoCola,
  onPendientes, onRecargar, sincronizando, sinDia, onAdmin, onSalir,
}: Props) {
  const pendientes = estadoCola.enCola + estadoCola.descartados

  const opciones: Opcion<string>[] = dias.map(d => ({
    id: d.id,
    label: `${d.label} ${d.fecha.slice(-2).replace(/^0/, '')}`,
  }))

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-swc-bg/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 py-3">
        {/* Fila de servicio: chiquita y arriba, lejos del pulgar. Nada de acá se
            toca durante una acreditación. */}
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-swc-accent">
            Acreditación
          </p>
          <div className="flex items-center gap-3 text-[11px] font-bold text-swc-muted">
            <button onClick={onAdmin} className="hover:text-swc-light">Admin</button>
            {onSalir && <button onClick={onSalir} className="hover:text-swc-light">Salir</button>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Pildoras
            opciones={opciones}
            valor={vista}
            onCambio={onVista}
            etiqueta="Día del evento"
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
