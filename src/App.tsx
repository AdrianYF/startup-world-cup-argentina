import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import PartnershipWith from './components/PartnershipWith'
import Stats from './components/Stats'
import RutaEvolucion from './components/RutaEvolucion'
import CaminoALaCopa from './components/CaminoALaCopa'
import PitchBattle from './components/PitchBattle'
import Agenda from './components/Agenda'
import Tickets from './components/Tickets'
import Startups from './components/Startups'
import Voluntarios from './components/Voluntarios'
import Partners from './components/Partners'
import Apoyan from './components/Apoyan'
import FAQ from './components/FAQ'
import Galeria from './components/Galeria'
import Footer from './components/Footer'
import { FadeInSection } from './components/ui/FadeInSection'
import { ScrollStack } from './components/ui/ScrollStack'
import { WhatsAppNews } from './components/ui/WhatsAppNews'

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
  // Las 3 primeras secciones van en stacked-cards (scroll-stack estilo Framer).
  const stackedSections = [PartnershipWith, Stats, RutaEvolucion]
  const midSections = [
    PitchBattle,
    Agenda,
    Tickets,
    Startups,
    Voluntarios,
    // Speakers, // TODO: re-habilitar cuando se confirmen los speakers
  ]
  const tailSections = [FAQ]

  return (
    <div id="top" className="bg-[#020618] text-white min-h-screen">
      <a href="#main" className="skip-link">Saltar al contenido principal</a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero />
        <ScrollStack>
          {stackedSections.map((Section, i) => (
            <Section key={i} />
          ))}
        </ScrollStack>
        <FadeInSection>
          <CaminoALaCopa />
        </FadeInSection>
        {midSections.map((Section, i) => (
          <FadeInSection key={`mid-${i}`}>
            <Section />
          </FadeInSection>
        ))}
        <FadeInSection>
          <Partners />
        </FadeInSection>
        <FadeInSection>
          <Apoyan />
        </FadeInSection>
        {tailSections.map((Section, i) => (
          <FadeInSection key={`tail-${i}`}>
            <Section />
          </FadeInSection>
        ))}
        <FadeInSection>
          <Galeria />
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
