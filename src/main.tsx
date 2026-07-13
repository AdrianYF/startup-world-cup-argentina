import { StrictMode, Suspense, lazy, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SpeakersAll from './pages/SpeakersAll.tsx'
import { initAnalytics, trackPageView } from './lib/analytics'

// Ruta oculta con Three.js → lazy para no inflar el bundle principal.
const MysteryBox = lazy(() => import('./pages/MysteryBox.tsx'))

initAnalytics()

/**
 * Cuenta las vistas de las rutas a las que se llega navegando (sin recargar).
 * La carga inicial ya la manda `gtag('config', …, { send_page_view: true })`,
 * así que la primera ruta se saltea para no contarla dos veces.
 */
function RouteAnalytics() {
  const { pathname } = useLocation()
  const anterior = useRef<string | null>(null)

  useEffect(() => {
    if (anterior.current === null || anterior.current === pathname) {
      anterior.current = pathname
      return
    }
    anterior.current = pathname
    trackPageView(pathname)
  }, [pathname])

  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RouteAnalytics />
      <Routes>
        <Route path="/" element={<App />} />
        {/* Short links de la galería: /swc/<CODE> (o /g legacy) abre esa foto (lo maneja Galeria) */}
        <Route path="/swc/:code" element={<App />} />
        <Route path="/g/:code" element={<App />} />
        <Route path="/speakers" element={<SpeakersAll />} />
        {/* Sección oculta: se llega escaneando el QR del ticket */}
        <Route
          path="/mystery-box"
          element={
            <Suspense fallback={<div className="min-h-screen bg-[#020618]" />}>
              <MysteryBox />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
