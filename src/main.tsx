import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import SpeakersAll from './pages/SpeakersAll.tsx'
import { initAnalytics } from './lib/analytics'

// Ruta oculta con Three.js → lazy para no inflar el bundle principal.
const MysteryBox = lazy(() => import('./pages/MysteryBox.tsx'))

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {/* Short links de la galería: /g/<CODE> abre esa foto (lo maneja Galeria) */}
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
