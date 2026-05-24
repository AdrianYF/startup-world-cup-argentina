import { content } from '../lib/content'
import { openTicketing } from '../lib/ticketing'

function Footer() {
  const links = content.config.links

  return (
    <footer className="bg-[#020618] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          <div className="md:col-span-1">
            <img src="/SWC-logo.png" alt="Startup World Cup Argentina" className="h-16 w-auto mb-4" />
            <p className="text-gray-400 text-sm leading-relaxed">
              La competencia de startups más grande del mundo aterriza en Buenos Aires para potenciar el ecosistema regional.
            </p>
          </div>

          <div>
            <h4 className="text-[#6c5ce7] text-xs uppercase tracking-widest font-bold mb-4">Main Partners</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="https://www.startupgrind.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Startup Grind
                </a>
              </li>
              <li>
                <a href="https://pegasustechventures.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Pegasus Tech Ventures
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#6c5ce7] text-xs uppercase tracking-widest font-bold mb-4">Evento</h4>
            <ul className="flex flex-col gap-2">
              <li><a href="#ruta" className="text-gray-400 hover:text-white text-sm transition-colors">Ruta</a></li>
              <li><a href="#pitch" className="text-gray-400 hover:text-white text-sm transition-colors">Pitch Battle</a></li>
              <li><a href="#agenda" className="text-gray-400 hover:text-white text-sm transition-colors">Agenda</a></li>
              <li><a href="#startups" className="text-gray-400 hover:text-white text-sm transition-colors">Startups</a></li>
              <li><a href="#voluntarios" className="text-gray-400 hover:text-white text-sm transition-colors">Voluntarios</a></li>
              <li><a href="#partners" className="text-gray-400 hover:text-white text-sm transition-colors">Partners</a></li>
              <li>
                <button onClick={() => openTicketing('footer')} className="text-[#6c5ce7] hover:text-[#a89cf0] text-sm transition-colors font-bold cursor-pointer">
                  Tickets
                </button>
              </li>
              <li><a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#6c5ce7] text-xs uppercase tracking-widest font-bold mb-4">Contacto</h4>
            <ul className="flex flex-col gap-2 mb-6">
              <li>
                <a href={`mailto:${links.emailGeneral}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {links.emailGeneral}
                </a>
              </li>
              <li>
                <a href={`mailto:${links.emailPartners}`} className="text-gray-400 hover:text-white text-sm transition-colors">
                  Partnerships
                </a>
              </li>
            </ul>
            {(links.linkedin || links.instagram || links.twitter) && (
              <>
                <h4 className="text-[#6c5ce7] text-xs uppercase tracking-widest font-bold mb-4">Social</h4>
                <div className="flex gap-4">
                  {links.linkedin && <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm font-bold">in</a>}
                  {links.instagram && <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm font-bold">ig</a>}
                  {links.twitter && <a href={links.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm font-bold">tw</a>}
                </div>
              </>
            )}
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-gray-400 text-xs">© 2026 Startup World Cup Argentina. Todos los derechos reservados.</p>
        </div>

      </div>
    </footer>
  )
}

export default Footer
