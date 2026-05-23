function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Logo y descripción */}
          <div className="md:col-span-1">
            <img src="/Logo-White-246x300.png" alt="Startup World Cup Argentina" className="h-16 w-auto mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed">
              La competencia de startups más grande del mundo aterriza en Buenos Aires para potenciar el ecosistema regional.
            </p>
          </div>

          {/* Main Partners */}
          <div>
            <h4 className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">Main Partners</h4>
            <ul className="flex flex-col gap-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">StartupGrind</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Pegasus Ventures</a></li>
            </ul>
          </div>

          {/* Evento */}
          <div>
            <h4 className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">Evento</h4>
            <ul className="flex flex-col gap-2">
              <li><a href="#ruta" className="text-gray-400 hover:text-white text-sm transition-colors">Startups</a></li>
              <li><a href="#tickets" className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors font-bold">Tickets</a></li>
              <li><a href="#partners" className="text-gray-400 hover:text-white text-sm transition-colors">Partners</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Colaboradores</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Prensa</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Legal y Social */}
          <div>
            <h4 className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">Legal</h4>
            <ul className="flex flex-col gap-2 mb-6">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Bases y Condiciones</a></li>
            </ul>
            <h4 className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-4">Social</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-bold">in</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-bold">ig</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-bold">tw</a>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-gray-500 text-xs">© 2026 Startup World Cup Argentina. Todos los derechos reservados.</p>
        </div>

      </div>
    </footer>
  )
}

export default Footer