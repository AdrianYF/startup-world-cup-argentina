/* eslint-disable react-refresh/only-export-components -- entry point: los lazy() de rutas no son un boundary de fast-refresh */
import { StrictMode, Suspense, lazy, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initAnalytics, trackPageView } from './lib/analytics'

// Páginas de ruta → lazy para mantener liviano el bundle del landing.
const RoadToSwcPage = lazy(() => import('./pages/RoadToSwcPage.tsx'))
const AgendaPage = lazy(() => import('./pages/AgendaPage.tsx'))
const PitchBattlePage = lazy(() => import('./pages/PitchBattlePage.tsx'))
const StartupsPage = lazy(() => import('./pages/StartupsPage.tsx'))
const VoluntariosPage = lazy(() => import('./pages/VoluntariosPage.tsx'))
const GaleriaPage = lazy(() => import('./pages/GaleriaPage.tsx'))
const SpeakersAll = lazy(() => import('./pages/SpeakersAll.tsx'))
const MysteryBox = lazy(() => import('./pages/MysteryBox.tsx'))
// Compra de entradas: vuelta desde Mercado Pago y la entrada con su QR.
const Gracias = lazy(() => import('./pages/Gracias.tsx'))
const Entrada = lazy(() => import('./pages/Entrada.tsx'))

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
      <Suspense fallback={<div className="min-h-screen bg-[#020618]" />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/road-to-swc" element={<RoadToSwcPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/pitch-battle" element={<PitchBattlePage />} />
          <Route path="/startups" element={<StartupsPage />} />
          <Route path="/voluntarios" element={<VoluntariosPage />} />
          <Route path="/galeria" element={<GaleriaPage />} />
          <Route path="/speakers" element={<SpeakersAll />} />
          {/* Short links (galería/comité/startups): /swc/<CODE> → OG redirige a la ruta correcta.
              En prod lo intercepta el rewrite de vercel.json; acá quedan como fallback. */}
          <Route path="/swc/:code" element={<App />} />
          <Route path="/g/:code" element={<App />} />
          {/* Sección oculta: se llega escaneando el QR del ticket */}
          <Route path="/mystery-box" element={<MysteryBox />} />
          {/* Compra de entradas. `back_urls` de Mercado Pago vuelve a /gracias;
              /entrada/:token es el link del mail y el destino del QR. */}
          <Route path="/gracias" element={<Gracias />} />
          <Route path="/entrada/:token" element={<Entrada />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
