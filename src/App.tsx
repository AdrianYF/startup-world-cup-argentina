import './index.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import RutaEvolucion from './components/RutaEvolucion'
import PitchBattle from './components/PitchBattle'
import BuildersArena from './components/BuildersArena'
import Tickets from './components/Tickets'

function App() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <Hero />
      <RutaEvolucion />
      <PitchBattle />
      <BuildersArena />
      <Tickets />
    </div>
  )
}

export default App