import { openVolunteerForm } from '../lib/ticketing'
import { VolunteerCardCycler } from './ui/VolunteerCardCycler'

function Voluntarios() {
  return (
    <section id="voluntarios" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className="relative max-w-sm mx-auto w-full order-2 lg:order-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 uppercase tracking-widest justify-center">
              <span className="w-2 h-2 bg-[#75AADB] rounded-full animate-pulse" />
              Tu figurita oficial · preview
            </div>
            <VolunteerCardCycler />
            <p className="text-center text-gray-500 text-[10px] uppercase tracking-widest mt-12">
              Compartible en LinkedIn · WhatsApp · X
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block border border-gray-300 text-gray-500 text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Sumate al equipo
            </span>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-6">
              <span className="text-[#020618]">SÉ </span>
              <span className="text-[#75AADB]">VOLUNTARI@</span>
            </h2>

            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Hacé que la Startup World Cup Argentina pase. Vas a ser parte del equipo que produce el evento de startups más grande del año en LATAM.
            </p>

            <ul className="flex flex-col gap-2 mb-8">
              {[
                'Tu figurita oficial compartible en LinkedIn / IG / WhatsApp',
                'Acceso completo a los 3 días',
                'Networking con organizadores, inversores y founders',
                'Certificado + merch oficial',
              ].map(t => (
                <li key={t} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-[#75AADB] mt-0.5" aria-hidden>·</span>{t}
                </li>
              ))}
            </ul>

            <button
              onClick={() => openVolunteerForm()}
              aria-label="Quiero ser voluntari@ (abre formulario en una nueva pestaña)"
              className="inline-block bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer"
            >
              Quiero ser voluntari@
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Voluntarios
