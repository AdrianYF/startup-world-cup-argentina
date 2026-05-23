import { useState, useEffect } from 'react'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-yellow-600/30
      ${scrolled 
        ? 'bg-black/95 backdrop-blur-md h-12' 
        : 'bg-black/60 backdrop-blur-sm h-16'
      }`}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/Logo-White-246x300.png" 
            alt="Startup World Cup Argentina" 
            className={`w-auto transition-all duration-300 ${scrolled ? 'h-7' : 'h-10'}`}
          />
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6 font-semibold transition-all duration-300">
          <a href="#ruta" className={`text-white hover:text-yellow-400 transition-colors ${scrolled ? 'text-xs' : 'text-sm'}`}>Ruta de Evolución</a>
          <a href="#pitch" className={`text-white hover:text-yellow-400 transition-colors ${scrolled ? 'text-xs' : 'text-sm'}`}>Pitch Battle</a>
          <a href="#builders" className={`text-white hover:text-yellow-400 transition-colors ${scrolled ? 'text-xs' : 'text-sm'}`}>Builders Arena</a>
          <a href="#info" className={`text-white hover:text-yellow-400 transition-colors ${scrolled ? 'text-xs' : 'text-sm'}`}>Info del Evento</a>
          <a href="#tickets" className={`bg-yellow-500 text-black rounded-full hover:bg-yellow-400 transition-all ${scrolled ? 'text-xs px-3 py-1' : 'text-sm px-4 py-1.5'}`}>Tickets</a>
          <a href="#partners" className={`text-white hover:text-yellow-400 transition-colors ${scrolled ? 'text-xs' : 'text-sm'}`}>Partners</a>
        </div>

      </div>
    </nav>
  )
}

export default Navbar