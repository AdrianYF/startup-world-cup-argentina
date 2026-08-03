import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * La red abajo de todo. Sin esto, cualquier excepción en el render deja la
 * pantalla EN BLANCO, sin un cartel ni un botón.
 *
 * El caso concreto y el que va a pasar: las rutas se cargan con `lazy()`, y los
 * nombres de los chunks llevan hash. Cuando se despliega una versión nueva, los
 * archivos de la vieja dejan de existir — así que cualquiera que tenga el sitio
 * abierto de antes y navegue a otra ruta pide un chunk que ya no está, el
 * `import()` rechaza, y el `<Suspense>` no lo atrapa porque no es una carga
 * pendiente sino un error. Resultado: negro.
 *
 * Por eso el botón dice «Recargar» y no «Reintentar»: recargar es literalmente el
 * arreglo, porque baja el index nuevo con los hashes nuevos.
 *
 * Es de clase porque no hay equivalente en hooks — `getDerivedStateFromError` y
 * `componentDidCatch` sólo existen en componentes de clase.
 */
type Props = { children: ReactNode }
type State = { fallo: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { fallo: false }

  static getDerivedStateFromError(): State {
    return { fallo: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A la consola y nada más: no hay servicio de errores en este proyecto, y
    // tragárselo en silencio sería peor que ruidoso.
    console.error('[render]', error, info.componentStack)
  }

  render() {
    if (!this.state.fallo) return this.props.children

    return (
      <div className="min-h-screen bg-[#020618] text-white flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-4xl mb-4" aria-hidden>·</p>
          <h1 className="text-xl font-black mb-2">Se nos rompió algo</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Si venías de una versión anterior del sitio, recargar lo arregla.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-[#75AADB]/45 bg-[#75AADB]/10 px-6 py-3 font-black uppercase tracking-wide text-[#75AADB] transition-colors hover:bg-[#75AADB]/20 cursor-pointer"
          >
            Recargar
          </button>
        </div>
      </div>
    )
  }
}
