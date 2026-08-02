import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import Pin from './componentes/Pin'
import Cabecera from './componentes/Cabecera'
import FilaPersona from './componentes/FilaPersona'
import Panel from './componentes/Panel'
import BarraAcciones from './componentes/BarraAcciones'
import Agregar from './componentes/Agregar'
import { quien, sesion } from './lib/almacen'
import { filtrar, ordenarPorApellido } from './lib/buscar'
import { useLista } from './lib/useLista'
import type { Persona } from './lib/tipos'

// La cámara sólo pesa cuando alguien la abre.
const Escaner = lazy(() => import('./componentes/Escaner'))

/**
 * La acreditación en la puerta.
 *
 * Es una herramienta de trabajo, no una página del sitio: sin navbar, sin
 * footer, sin animaciones, y en su propio bundle para que abrir la puerta no
 * baje el landing entero con su Three.js.
 *
 * Este archivo sólo arma la pantalla. Las reglas —caché, deltas, cola offline—
 * están en `lib/useLista.ts`.
 */
function Puerta() {
  const [autenticado, setAutenticado] = useState(() => Boolean(sesion.token()))

  /**
   * Salir. Borra el token y vuelve al PIN.
   *
   * NO borra la lista cacheada ni la cola de ingresos pendientes: si alguien
   * sale con cosas sin sincronizar, esas cosas tienen que seguir ahí cuando el
   * siguiente entre. Lo único que se va es la sesión.
   */
  const salir = useCallback(() => {
    sesion.borrar()
    setAutenticado(false)
  }, [])

  return autenticado
    ? <Tablero onSinSesion={() => setAutenticado(false)} onSalir={salir} />
    : <Pin onListo={() => setAutenticado(true)} />
}

function Tablero({ onSinSesion, onSalir }: { onSinSesion: () => void; onSalir: () => void }) {
  const {
    lista, ingresos, error, sinConexion, enCola, ultimo,
    cambiarDia, anotar, anotarEscaneado, deshacer, agregarYAcreditar,
  } = useLista(onSinSesion)

  const [busqueda, setBusqueda] = useState('')
  const [seleccion, setSeleccion] = useState<Persona | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [agregando, setAgregando] = useState(false)

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

  if (!lista) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 text-center">
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
        quien={quien.leer()}
        onSalir={onSalir}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        sinConexion={sinConexion}
        enCola={enCola}
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
          onCerrar={() => setSeleccion(null)}
        />
      )}

      {agregando && (
        <Agregar
          inicial={busqueda}
          dia={lista.dia.nombre.toLowerCase()}
          onCerrar={() => setAgregando(false)}
          onAgregar={datos => {
            agregarYAcreditar(datos)
            setAgregando(false)
            setBusqueda('')
          }}
        />
      )}

      {escaneando && (
        <Suspense fallback={null}>
          <Escaner
            dia={lista.dia.id}
            onCerrar={() => setEscaneando(false)}
            onAcreditado={(checkin, persona) => {
              anotarEscaneado(checkin, persona)
              setEscaneando(false)
            }}
          />
        </Suspense>
      )}

      {error && (
        <p className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-lg px-4 text-center text-sm font-bold text-swc-coral">
          {error}
        </p>
      )}
    </div>
  )
}

export default Puerta
