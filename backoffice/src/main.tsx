import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos.css'
import Backoffice from './Backoffice'

/**
 * Entry del backoffice.
 *
 * Router propio y no `react-router-dom` (el porqué está en `lib/ruta.ts`). Sin
 * analytics: es una herramienta interna y no hay nada que medir. Comparte con
 * el sitio las funciones de `api/` y la paleta de `src/marca.css`, nada más.
 */
createRoot(document.getElementById('backoffice')!).render(
  <StrictMode>
    <Backoffice />
  </StrictMode>,
)
