import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos.css'
import Backoffice from './Backoffice'
import { ErrorBoundary } from '../../src/components/ui/ErrorBoundary'

/**
 * Entry del backoffice.
 *
 * Router propio y no `react-router-dom` (el porqué está en `lib/ruta.ts`). Sin
 * analytics: es una herramienta interna y no hay nada que medir. Comparte con
 * el sitio las funciones de `api/` y la paleta de `src/marca.css`, nada más.
 *
 * El `ErrorBoundary` sí se comparte, y acá importa más que en el sitio: esta app
 * se abre en la fila de entrada, con el 4G del venue y las secciones cargadas con
 * `lazy()`. Una pantalla en blanco en el landing es una molestia; en la puerta es
 * una cola parada.
 */
createRoot(document.getElementById('backoffice')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Backoffice />
    </ErrorBoundary>
  </StrictMode>,
)
