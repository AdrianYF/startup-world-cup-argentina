import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import PartnershipWith from './components/PartnershipWith'
import Stats from './components/Stats'
import RutaEvolucion from './components/RutaEvolucion'
import PitchBattle from './components/PitchBattle'
import Agenda from './components/Agenda'
import Tickets from './components/Tickets'
import Startups from './components/Startups'
import Voluntarios from './components/Voluntarios'
import Partners from './components/Partners'
import Apoyan from './components/Apoyan'
import Speakers from './components/Speakers'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import { FadeInSection } from './components/ui/FadeInSection'
import { BackToTop } from './components/ui/BackToTop'

function App() {
  // Scroll a la sección cuando llegamos con hash en la URL (ej. /#speakers desde /speakers).
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    // pequeño delay para que las sections con FadeInSection se monten antes de hacer scroll
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(t)
  }, [hash])

  // Hero queda sin FadeIn - debe verse desde el primer paint (above-the-fold).
  const sections = [
    PartnershipWith,
    Stats,
    RutaEvolucion,
    PitchBattle,
    Agenda,
    Tickets,
    Startups,
    Voluntarios,
    // Speakers, // TODO: re-habilitar cuando se confirmen los speakers
    Partners,
    Apoyan,
    FAQ,
  ]

  return (
    <div id="top" className="bg-[#020618] text-white min-h-screen">
      <a href="#main" className="skip-link">Saltar al contenido principal</a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero />
        {sections.map((Section, i) => (
          <FadeInSection key={i}>
            <Section />
          </FadeInSection>
        ))}
      </main>
      <FadeInSection>
        <Footer />
      </FadeInSection>
      <BackToTop />
    </div>
  )
}

export default App
