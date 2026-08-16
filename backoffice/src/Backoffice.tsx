import { lazy, Suspense, useCallback, useState } from 'react'
import Pin from './componentes/Pin'
import Shell from './componentes/Shell'
import Personas from './secciones/Personas'
import { Cargando } from './ui/Estado'
import { Encabezado } from './ui/Encabezado'
import { cache, quien, sesion } from './lib/almacen'
import { PUERTA, useRuta } from './lib/ruta'
import { INSCRIPTOS, seccionDe } from './lib/secciones'

/**
 * El backoffice del evento.
 *
 * Es una herramienta de trabajo, no una página del sitio: sin navbar del sitio,
 * sin animaciones, y en su propio bundle para que abrir la puerta no baje el
 * landing entero con su Three.js.
 *
 * **La puerta no vive adentro del Shell.** Es la única pantalla que se usa de
 * pie, con una mano, con alguien esperando enfrente: ahí una barra con cinco
 * secciones de administración no ayuda a nadie y sí se toca sin querer. La raíz
 * es la puerta sola, y la administración es un lugar al que se entra.
 *
 * La puerta se importa derecho y todo lo demás con `lazy()`. No es un detalle:
 * se abre parado en la fila con el 4G del venue, y no tiene por qué bajar la
 * pantalla de ventas para mostrar una lista de nombres.
 */
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
   * Las listas se van porque son la lista entera del evento —nombre, mail y
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

  // La puerta, sola y sin marco. Arma su propia cabecera pegajosa y su barra de
  // acciones abajo, y ocupa la pantalla entera.
  if (ruta === PUERTA) {
    return <Personas modo="dia" ir={ir} onSalir={salir} onSinSesion={sinSesion} />
  }

  return (
    <Shell ruta={ruta} ir={ir} quien={quien.leer()} onSalir={salir}>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <Encabezado titulo={seccionDe(ruta).label} bajada={seccionDe(ruta).bajada} />
        <Suspense fallback={<Cargando />}>
          <Seccion ruta={ruta} ir={ir} onSinSesion={sinSesion} />
        </Suspense>
      </main>
    </Shell>
  )
}

function Seccion({ ruta, ir, onSinSesion }: {
  ruta: string
  ir: (id: string) => void
  onSinSesion: () => void
}) {
  switch (ruta) {
    case INSCRIPTOS: return <Personas modo="inscriptos" ir={ir} onSinSesion={onSinSesion} />
    case 'ventas': return <Ventas onSinSesion={onSinSesion} />
    case 'stock': return <Stock onSinSesion={onSinSesion} />
    case 'importar': return <Importar onSinSesion={onSinSesion} />
    case 'metricas': return <Metricas onSinSesion={onSinSesion} />
    default:
      // Una URL que no existe. No es un error que valga una pantalla: se dice y
      // se ofrece el camino de vuelta.
      return (
        <p className="text-sm text-gray-500">
          That section doesn't exist.{' '}
          <a href="/backoffice/" className="text-swc-accent underline">Back to the door</a>
        </p>
      )
  }
}

export default Backoffice
