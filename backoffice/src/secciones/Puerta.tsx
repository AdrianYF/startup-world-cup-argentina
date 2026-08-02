import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import Cabecera from '../componentes/Cabecera'
import FilaPersona from '../componentes/FilaPersona'
import Panel from '../componentes/Panel'
import BarraAcciones from '../componentes/BarraAcciones'
import Agregar from '../componentes/Agregar'
import Pendientes from '../componentes/Pendientes'
import { olvidar, reintentar } from '../lib/acreditar'
import { cola, descartados } from '../lib/almacen'
import { filtrar, ordenarPorApellido } from '../lib/buscar'
import { useLista } from '../lib/useLista'
import type { Checkin, Persona } from '../lib/tipos'

// La cámara sólo pesa cuando alguien la abre.
const Escaner = lazy(() => import('../componentes/Escaner'))

/**
 * La acreditación en la puerta.
 *
 * Es la sección que se abre el 95% de las veces, así que es la única que NO va
 * lazy: bajarla en un chunk aparte le agregaría un viaje a lo primero que ve
 * alguien parado en la fila de entrada.
 *
 * Este archivo sólo arma la pantalla. Las reglas —caché, deltas, cola offline—
 * están en `lib/useLista.ts`.
 */
function Puerta({ onSinSesion }: { onSinSesion: () => void }) {
  const {
    lista, ingresos, error, sinConexion, estadoCola, ultimo, sincronizando,
    cambiarDia, recargar, anotar, anotarEscaneado, deshacer, anularIngreso,
    agregarYAcreditar, setEstadoCola,
  } = useLista(onSinSesion)

  const [busqueda, setBusqueda] = useState('')
  const [seleccion, setSeleccion] = useState<Persona | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const [viendoPendientes, setViendoPendientes] = useState(false)

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

  /* Acreditar cierra el panel y limpia la búsqueda: el que sigue en la fila
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

  if (!lista) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5 text-center">
        {error
          ? <p className="text-sm font-bold text-swc-coral">{error}</p>
          : <p className="text-sm text-gray-500">Cargando la lista…</p>}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecera
        dias={lista.dias}
        diaActivo={lista.dia.id}
        onDia={id => { cambiarDia(id); setBusqueda(''); setSeleccion(null) }}
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
            <button
              onClick={() => setAgregando(true)}
              className="mt-5 rounded-full border border-swc-ok/40 bg-swc-ok/10 px-6 py-3 text-sm font-black text-swc-ok active:scale-95"
            >
              {busqueda ? `Agregar a "${busqueda}"` : 'Agregar a alguien'}
            </button>
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

      {seleccion && (
        <Panel
          persona={seleccion}
          ingresos={ingresos.get(seleccion.id) || []}
          onAcreditar={() => acreditarA(seleccion)}
          onAnular={anular}
          onCerrar={() => setSeleccion(null)}
        />
      )}

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
            // atrás ya está mostrando su QR. Se cierra sólo con "Cerrar".
            onAcreditado={anotarEscaneado}
          />
        </Suspense>
      )}

      {error && (
        <div className="fixed inset-x-0 bottom-24 z-30 px-4 lg:pl-56">
          <p className="mx-auto max-w-lg text-center text-sm font-bold text-swc-coral">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

export default Puerta
