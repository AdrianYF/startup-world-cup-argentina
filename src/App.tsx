import { useEffect, useState, lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Tickets from './components/Tickets'
import Participan from './components/Participan'
import Imatchin from './components/Imatchin'
import Apoyan from './components/Apoyan'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import { FadeInSection } from './components/ui/FadeInSection'
import { WhatsAppNews } from './components/ui/WhatsAppNews'

// Sólo lo ve quien vuelve de pagar: no tiene por qué pesar en el bundle inicial.
const CompraExitosaModal = lazy(() => import('./components/CompraExitosaModal'))

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Landing: Hero + Entradas (pricing) + intro/números + Quiénes nos apoyan +
 * Partners (planes) + FAQ. El resto del contenido vive en rutas propias
 * (Road to SWC, Agenda, Pitch Battle, Startups, Voluntarios, Galería).
 */
function App() {
  // Vuelta de Mercado Pago: `?compra=<uuid>` abre el modal de felicitaciones.
  // Se lee en el estado inicial, no en un efecto: el param ya está en la URL en
  // el primer render, así que el modal aparece sin un frame de parpadeo.
  const [compra, setCompra] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const id = new URLSearchParams(window.location.search).get('compra')
    return id && UUID_RE.test(id) ? id : null
  })

  // Y se saca de la URL, para que recargar o compartir el link no lo reabra.
  // Acá el efecto sí corresponde: lo que se sincroniza es la barra de
  // direcciones, que es un sistema externo a React.
  useEffect(() => {
    if (!compra) return
    const params = new URLSearchParams(window.location.search)
    if (!params.has('compra')) return
    params.delete('compra')
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  }, [compra])

  // Scroll a la sección cuando llegamos con hash (ej. /#partners desde otra ruta).
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(t)
  }, [hash])

  return (
    <div id="top" className="bg-[#020618] text-white min-h-screen">
      <a href="#main" className="skip-link">Saltar al contenido principal</a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero />
        <FadeInSection>
          <Tickets />
        </FadeInSection>
        <FadeInSection>
          <Participan />
        </FadeInSection>
        <FadeInSection>
          <Imatchin />
        </FadeInSection>
        <FadeInSection>
          <Apoyan />
        </FadeInSection>
        <FadeInSection>
          <FAQ />
        </FadeInSection>
      </main>
      <FadeInSection>
        <Footer />
      </FadeInSection>
      <WhatsAppNews />

      {compra && (
        <Suspense fallback={null}>
          <CompraExitosaModal ordenId={compra} onClose={() => setCompra(null)} />
        </Suspense>
      )}
    </div>
  )
}

export default App
