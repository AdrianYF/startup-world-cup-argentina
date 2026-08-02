import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './estilos.css'
import Puerta from './Puerta'

/**
 * Entry de la app de puerta.
 *
 * Sin router: es una sola pantalla. Sin analytics: es una herramienta interna y
 * no hay nada que medir. Comparte con el sitio las funciones de `api/` y la
 * paleta de `src/marca.css`, nada más.
 */
createRoot(document.getElementById('puerta')!).render(
  <StrictMode>
    <Puerta />
  </StrictMode>,
)
