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

function App() {
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
    Partners,
    Apoyan,
    Speakers,
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
    </div>
  )
}

export default App
