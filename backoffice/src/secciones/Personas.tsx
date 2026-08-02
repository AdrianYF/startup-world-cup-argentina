import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import Agregar from '../componentes/Agregar'
import BarraAcciones from '../componentes/BarraAcciones'
import Cabecera, { PADRON } from '../componentes/Cabecera'
import FichaPersona from '../componentes/FichaPersona'
import FilaPersona from '../componentes/FilaPersona'
import Pendientes from '../componentes/Pendientes'
import { Boton, Pildoras, type Opcion } from '../ui/Acciones'
import { Encabezado } from '../ui/Encabezado'
import { Cargando } from '../ui/Estado'
import { olvidar, reintentar } from '../lib/acreditar'
import { cola, descartados } from '../lib/almacen'
import { filtrar, ordenarPorApellido } from '../lib/buscar'
import { seccionDe } from '../lib/secciones'
import { PERSONAS } from '../lib/ruta'
import { useLista } from '../lib/useLista'
import type { Asistente } from '../lib/admin'
import type { Checkin, Persona } from '../lib/tipos'

// La cámara sólo pesa cuando alguien la abre.
const Escaner = lazy(() => import('../componentes/Escaner'))
// El padrón también: la lista entera, la tabla y el cliente de `/api/backoffice`
// se usan sentado y con wifi, no parado en la fila de entrada.
const Padron = lazy(() => import('./Padron'))

/**
 * Las personas del evento. Una sola sección, dos modos.
 *
 *   · **por día** — la acreditación: la lista del día, el buscador con
 *     autofocus, el escáner y la barra de abajo. Es lo que se abre el 95% de las
 *     veces, parado en la fila, y es lo único que no viaja en un chunk aparte.
 *
 *   · **padrón** — la lista entera sin filtro de día, con la tabla ordenable, los
 *     filtros de problema y la edición. Es lo que se hace sentado.
 *
 * Eran dos secciones —«Check-in» y «Asistentes»— sobre la misma fila de la misma
 * tabla. Ver un mail mal escrito en la puerta obligaba a cambiar de sección y
 * buscar a la persona de nuevo. Ahora la última píldora del día es «Todos», la
 * búsqueda se mantiene al cruzar, y la ficha es la misma.
 *
 * Lo que **no** se unificó es la fuente: el modo día sigue comiendo de
 * `/api/puerta` con su caché, sus deltas y su cola offline, porque esas
 * garantías son las que hacen que un ingreso no se pierda. El padrón pide
 * `/api/backoffice` sólo cuando alguien entra a mirarlo.
 */
function Personas({ onSinSesion }: { onSinSesion: () => void }) {
  const {
    lista, ingresos, error, sinConexion, estadoCola, ultimo, sincronizando,
    cambiarDia, recargar, anotar, anotarEscaneado, deshacer, anularIngreso,
    agregarYAcreditar, setEstadoCola,
  } = useLista(onSinSesion)

  // En la notebook se abre el padrón; en el celular, el día. Es el mismo criterio
  // que el resto de la app: el ancho de pantalla dice bastante sobre si quien
  // mira está sentado o parado en la puerta.
  const [enPadron, setEnPadron] = useState(
    () => window.matchMedia?.('(min-width: 1024px)').matches ?? false,
  )
  const [busqueda, setBusqueda] = useState('')
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

  const cambiarVista = useCallback((id: string) => {
    if (id === PADRON) {
      setEnPadron(true)
      return
    }
    setEnPadron(false)
    cambiarDia(id)
    setSeleccion(null)
  }, [cambiarDia])

  if (!lista) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 text-center">
        {error
          ? <p className="text-sm font-bold text-swc-coral">{error}</p>
          : <p className="text-sm text-gray-500">Cargando la lista…</p>}
      </div>
    )
  }

  const opcionesDia: Opcion<string>[] = [
    ...lista.dias.map(d => ({
      id: d.id,
      label: `${d.label} ${d.fecha.slice(-2).replace(/^0/, '')}`,
    })),
    { id: PADRON, label: 'Todos' },
  ]

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

  if (enPadron) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <Encabezado
          titulo="Personas"
          bajada={seccionDe(PERSONAS).bajada}
          acciones={
            <Pildoras
              opciones={opcionesDia}
              valor={PADRON}
              onCambio={cambiarVista}
              etiqueta="Día o padrón completo"
              tam="sm"
            />
          }
        />

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
      </main>
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
                <button onClick={() => setEnPadron(true)} className="text-swc-accent underline">
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
