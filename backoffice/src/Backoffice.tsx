import { lazy, Suspense, useCallback, useState } from 'react'
import Pin from './componentes/Pin'
import Shell from './componentes/Shell'
import Puerta from './secciones/Puerta'
import { cache, quien, sesion } from './lib/almacen'
import { PUERTA, useRuta } from './lib/ruta'
import { nombreDe } from './lib/secciones'

/**
 * El backoffice del evento.
 *
 * Es una herramienta de trabajo, no una página del sitio: sin navbar, sin
 * footer, sin animaciones, y en su propio bundle para que abrir la puerta no
 * baje el landing entero con su Three.js.
 *
 * La puerta se importa derecho y las demás secciones con `lazy()`. No es un
 * detalle: la puerta se abre parado en la fila de entrada con el 4G del venue,
 * y no tiene por qué bajar la pantalla de ventas para mostrar una lista de
 * nombres. Las otras se usan sentado, con wifi, y un chunk de más no se nota.
 */
const Asistentes = lazy(() => import('./secciones/Asistentes'))
const Ventas = lazy(() => import('./secciones/Ventas'))
const Stock = lazy(() => import('./secciones/Stock'))
const Importar = lazy(() => import('./secciones/Importar'))
const Metricas = lazy(() => import('./secciones/Metricas'))

function Backoffice() {
  const [autenticado, setAutenticado] = useState(() => Boolean(sesion.token()))
  const [ruta, ir] = useRuta()

  /**
   * Salir. Borra el token, los días y las listas cacheadas, y vuelve al PIN.
   *
   * Las listas se van porque son el padrón entero del evento —nombre, mail y
   * teléfono de cada persona— y no tienen por qué sobrevivir a la sesión en un
   * celular que se pasa de mano en mano entre el staff.
   *
   * La cola de ingresos pendientes NO se toca: si alguien sale con cosas sin
   * sincronizar, esas cosas tienen que seguir ahí cuando entre el siguiente.
   */
  const salir = useCallback(() => {
    sesion.borrar()
    cache.vaciar()
    setAutenticado(false)
  }, [])

  const sinSesion = useCallback(() => setAutenticado(false), [])

  if (!autenticado) return <Pin onListo={() => setAutenticado(true)} />

  return (
    <Shell ruta={ruta} ir={ir} quien={quien.leer()} onSalir={salir}>
      {ruta === PUERTA ? (
        <Puerta onSinSesion={sinSesion} />
      ) : (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          <h1 className="mb-6 hidden text-2xl font-black text-swc-light lg:block">
            {nombreDe(ruta)}
          </h1>
          <Suspense fallback={<p className="text-sm text-gray-500">Cargando…</p>}>
            <Seccion ruta={ruta} onSinSesion={sinSesion} />
          </Suspense>
        </main>
      )}
    </Shell>
  )
}

function Seccion({ ruta, onSinSesion }: { ruta: string; onSinSesion: () => void }) {
  switch (ruta) {
    case 'asistentes': return <Asistentes onSinSesion={onSinSesion} />
    case 'ventas': return <Ventas onSinSesion={onSinSesion} />
    case 'stock': return <Stock onSinSesion={onSinSesion} />
    case 'importar': return <Importar onSinSesion={onSinSesion} />
    case 'metricas': return <Metricas onSinSesion={onSinSesion} />
    default:
      // Una URL que no existe. No es un error que valga una pantalla: se dice y
      // se ofrece el camino de vuelta.
      return (
        <p className="text-sm text-gray-500">
          Esa sección no existe.{' '}
          <a href="/backoffice/" className="text-swc-accent underline">Volver a la puerta</a>
        </p>
      )
  }
}

export default Backoffice
