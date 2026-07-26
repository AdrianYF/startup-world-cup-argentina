import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Tickets from './components/Tickets'
import Participan from './components/Participan'
import Apoyan from './components/Apoyan'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import { FadeInSection } from './components/ui/FadeInSection'
import { WhatsAppNews } from './components/ui/WhatsAppNews'

/**
 * Landing: Hero + Entradas (pricing) + intro/números + Quiénes nos apoyan +
 * Partners (planes) + FAQ. El resto del contenido vive en rutas propias
 * (Road to SWC, Agenda, Pitch Battle, Startups, Voluntarios, Galería).
 */
function App() {
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
    </div>
  )
}

export default App
