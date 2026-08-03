import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import Agregar from '../componentes/Agregar'
import BarraAcciones from '../componentes/BarraAcciones'
import Cabecera from '../componentes/Cabecera'
import FichaPersona from '../componentes/FichaPersona'
import FilaPersona from '../componentes/FilaPersona'
import Pendientes from '../componentes/Pendientes'
import { Boton } from '../ui/Acciones'
import { Cargando } from '../ui/Estado'
import { olvidar, reintentar } from '../lib/acreditar'
import { cola, descartados } from '../lib/almacen'
import { filtrar, ordenarPorApellido } from '../lib/buscar'
import { PADRON } from '../lib/secciones'
import { PUERTA } from '../lib/ruta'
import { useLista } from '../lib/useLista'
import type { Asistente } from '../lib/admin'
import type { Checkin, Persona } from '../lib/tipos'

// La cámara sólo pesa cuando alguien la abre.
const Escaner = lazy(() => import('../componentes/Escaner'))
// El padrón también: la lista entera, la tabla y el cliente de `/api/backoffice`
// se usan sentado y con wifi, no parado en la fila de entrada.
const Padron = lazy(() => import('./Padron'))

/**
 * Las personas del evento. Un componente, dos pantallas muy distintas.
 *
 *   · **día** — la puerta: el buscador con autofocus, la lista del día, el
 *     escáner y la barra de abajo. Nada más. Es la raíz de la app y se usa de
 *     pie, con una mano, con alguien esperando enfrente.
 *
 *   · **padrón** — la lista entera sin filtro de día, con la tabla ordenable,
 *     los filtros de problema y la edición. Vive en administración y se usa
 *     sentado.
 *
 * Comparten el componente porque comparten la ficha, la cola de pendientes y
 * `useLista`; duplicarlo era duplicar tres cosas que tienen que comportarse
 * igual. Lo que **no** comparten es la fuente: el modo día come de `/api/puerta`
 * con su caché, sus deltas y su cola offline, porque esas garantías son las que
 * hacen que un ingreso no se pierda. El padrón pide `/api/backoffice` recién
 * cuando alguien entra a mirarlo.
 *
 * El modo lo decide la RUTA, no el ancho de pantalla. Antes una tablet en la
 * puerta abría el padrón —con el mail y el teléfono de todo el mundo— porque
 * medía más de 1024px.
 */

/**
 * El apellido que se venía tipeando, para que cruzar de la puerta al padrón no
 * obligue a escribirlo de nuevo.
 *
 * Una variable de módulo y no la URL: el cruce pasa una vez cada tanto, dura lo
 * que dura la pregunta «¿estará en otro día?», y no vale ensuciar el router de
 * treinta líneas con parseo de query string.
 */
let apellidoQueVenia = ''

function Personas({ modo, ir, onSalir, onSinSesion }: {
  modo: 'dia' | 'padron'
  ir: (id: string) => void
  /** Sólo en la puerta: en administración la salida la pone el Shell. */
  onSalir?: () => void
  onSinSesion: () => void
}) {
  const {
    lista, ingresos, error, sinConexion, estadoCola, ultimo, sincronizando,
    cambiarDia, recargar, anotar, anotarEscaneado, deshacer, anularIngreso,
    agregarYAcreditar, setEstadoCola,
  } = useLista(onSinSesion)

  const enPadron = modo === 'padron'

  // Al entrar se recupera lo que se venía tipeando del otro lado y se limpia,
  // para que la próxima visita arranque en blanco.
  const [busqueda, setBusqueda] = useState(() => {
    const heredado = apellidoQueVenia
    apellidoQueVenia = ''
    return heredado
  })
  const [seleccion, setSeleccion] = useState<Persona | Asistente | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const [viendoPendientes, setViendoPendientes] = useState(false)
  // Se incrementa al guardar algo desde la ficha: es la señal para que el padrón
  // vuelva a pedir la lista sin remontarse y perder el orden de la tabla.
  const [recarga, setRecarga] = useState(0)

  const personas = useMemo(
    () => ordenarPorApellido(filtrar(lista?.personas || [], busqueda)),
    [lista, busqueda],
  )

  // Una fila es una persona, así que el total es la cantidad de filas y los que
  // están adentro son los que tienen al menos un ingreso vigente.
  const totales = useMemo(() => {
    const filas = lista?.personas || []
    return {
      entradas: filas.length,
      adentro: filas.filter(p => (ingresos.get(p.id) || []).length > 0).length,
    }
  }, [lista, ingresos])

  /* Acreditar cierra la ficha y limpia la búsqueda: el que sigue en la fila
     necesita el campo vacío, no el apellido anterior. */
  const acreditarA = useCallback((persona: Persona) => {
    anotar(persona)
    setSeleccion(null)
    setBusqueda('')
  }, [anotar])

  /** Para que el alta pueda avisar antes de crear a alguien que ya está. */
  const buscarParecidos = useCallback(
    (nombre: string) => filtrar(lista?.personas || [], nombre),
    [lista],
  )

  const anular = useCallback((checkin: Checkin) => {
    anularIngreso(checkin, seleccion || undefined)
  }, [anularIngreso, seleccion])

  const alGuardar = useCallback(() => {
    setSeleccion(null)
    setRecarga(r => r + 1)
    recargar()
  }, [recargar])

  /** Cambiar de día. Ya no cambia de modo: el modo lo decide la ruta. */
  const cambiarVista = useCallback((id: string) => {
    cambiarDia(id)
    setSeleccion(null)
  }, [cambiarDia])

  /** Cruzar al padrón llevándose lo que se venía tipeando. */
  const irAlPadron = useCallback(() => {
    apellidoQueVenia = busqueda
    ir(PADRON)
  }, [busqueda, ir])

  /** Volver a la puerta. Misma cortesía en el otro sentido. */
  const irALaPuerta = useCallback(() => {
    apellidoQueVenia = busqueda
    ir(PUERTA)
  }, [busqueda, ir])

  if (!lista) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 text-center">
        {error
          ? <p className="text-sm font-bold text-swc-coral">{error}</p>
          : <p className="text-sm text-gray-500">Cargando la lista…</p>}
      </div>
    )
  }

  /* La ficha es la misma en los dos modos. Lo único que cambia son las acciones
     que habilita el contexto — ver `FichaPersona`. */
  const ficha = seleccion && (
    <FichaPersona
      persona={seleccion}
      ingresos={ingresos.get(seleccion.id) || []}
      dia={lista.dia}
      editable={enPadron}
      onAcreditar={() => acreditarA(seleccion)}
      onAnular={anular}
      onGuardado={alGuardar}
      onCerrar={() => setSeleccion(null)}
    />
  )

  // El padrón. El marco —título, bajada, ancho— lo pone el Shell; acá sólo va
  // el contenido.
  if (enPadron) {
    return (
      <>
        <div className="mb-5">
          <Boton tono="fantasma" tam="sm" onClick={irALaPuerta}>
            ← Volver a la puerta
          </Boton>
        </div>

        <Suspense fallback={<Cargando />}>
          <Padron
            busqueda={busqueda}
            onBusqueda={setBusqueda}
            onAbrir={setSeleccion}
            onSinSesion={onSinSesion}
            recarga={recarga}
            dia={lista.dia}
            adentro={totales.adentro}
            total={totales.entradas}
            enCola={estadoCola.enCola + estadoCola.descartados}
            onPendientes={() => setViendoPendientes(true)}
          />
        </Suspense>

        {ficha}
        {viendoPendientes && (
          <Pendientes
            cola={cola.ver()}
            descartados={descartados.ver()}
            onReintentar={p => reintentar(p).then(setEstadoCola)}
            onOlvidar={p => setEstadoCola(olvidar(p))}
            onSincronizar={recargar}
            onCerrar={() => setViendoPendientes(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera
        dias={lista.dias}
        vista={lista.dia.id}
        onVista={id => { cambiarVista(id); setBusqueda('') }}
        adentro={totales.adentro}
        total={totales.entradas}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        sinConexion={sinConexion}
        estadoCola={estadoCola}
        onPendientes={() => setViendoPendientes(true)}
        onRecargar={recargar}
        sincronizando={sincronizando}
        sinDia={lista.sinDia}
        onAdmin={irAlPadron}
        onSalir={onSalir}
      />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-40">
        {personas.length === 0 ? (
          // La búsqueda vacía es EL momento en que se descubre que alguien no
          // está, así que el alta se ofrece acá mismo y con el nombre ya
          // tipeado, en vez de obligar a escribirlo dos veces.
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">
              {busqueda
                ? `Nadie con ese nombre en la lista del ${lista.dia.nombre.toLowerCase()}.`
                : 'La lista de este día está vacía.'}
            </p>
            <Boton tono="ok" tam="lg" className="mt-5" onClick={() => setAgregando(true)}>
              {busqueda ? `Agregar a "${busqueda}"` : 'Agregar a alguien'}
            </Boton>
            {busqueda && (
              // El padrón es la otra respuesta posible a «no está»: puede estar
              // en la lista de otro día, o dado de baja.
              <p className="mt-4 text-xs text-gray-600">
                ¿Puede estar en otro día?{' '}
                <button onClick={irAlPadron} className="text-swc-accent underline">
                  Buscar en el padrón completo
                </button>
              </p>
            )}
          </div>
        ) : (
          <ul>
            {personas.map(p => (
              <FilaPersona
                key={`${p.origen}-${p.id}`}
                persona={p}
                ingresos={ingresos.get(p.id) || []}
                onClick={() => setSeleccion(p)}
              />
            ))}
          </ul>
        )}
      </main>

      <BarraAcciones
        ultimo={ultimo}
        onDeshacer={deshacer}
        onEscanear={() => setEscaneando(true)}
        onAgregar={() => setAgregando(true)}
      />

      {ficha}

      {agregando && (
        <Agregar
          inicial={busqueda}
          dia={lista.dia.nombre.toLowerCase()}
          buscarParecidos={buscarParecidos}
          onCerrar={() => setAgregando(false)}
          // El alta la espera el formulario: si falla la validación tiene que
          // poder mostrar el error sin perder lo que ya se tipeó.
          onAgregar={async datos => {
            await agregarYAcreditar(datos)
            setBusqueda('')
          }}
        />
      )}

      {viendoPendientes && (
        <Pendientes
          cola={cola.ver()}
          descartados={descartados.ver()}
          onReintentar={p => reintentar(p).then(setEstadoCola)}
          onOlvidar={p => setEstadoCola(olvidar(p))}
          onSincronizar={recargar}
          onCerrar={() => setViendoPendientes(false)}
        />
      )}

      {escaneando && (
        <Suspense fallback={null}>
          <Escaner
            dia={lista.dia.id}
            onCerrar={() => setEscaneando(false)}
            // La cámara NO se cierra al acreditar: la fila sigue y el que viene
            // atrás ya está mostrando su QR. Se cierra sólo con «Cerrar».
            onAcreditado={anotarEscaneado}
          />
        </Suspense>
      )}

      {error && (
        <div className="fixed inset-x-0 bottom-24 z-30 px-4">
          <p className="mx-auto max-w-lg text-center text-sm font-bold text-swc-coral">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

export default Personas
