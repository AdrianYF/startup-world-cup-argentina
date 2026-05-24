import { openVolunteerForm } from '../lib/ticketing'
import { VolunteerCardCycler } from './ui/VolunteerCardCycler'

function Voluntarios() {
  return (
    <section id="voluntarios" className="relative py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff7675] to-transparent" />

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Figurita cycler — mismas dimensiones que el StartupCard */}
          <div className="relative max-w-sm mx-auto w-full order-2 lg:order-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 uppercase tracking-widest justify-center">
              <span className="w-2 h-2 bg-[#ff7675] rounded-full animate-pulse" />
              Tu figurita oficial · preview
            </div>
            <VolunteerCardCycler />
            <p className="text-center text-gray-400 text-[10px] uppercase tracking-widest mt-12">
              Compartible en LinkedIn · WhatsApp · X
            </p>
          </div>

          {/* Texto + CTA */}
          <div className="order-1 lg:order-2">
            <span className="inline-block border border-white/20 text-gray-400 text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Sumate al equipo
            </span>

            <h2 className="text-5xl lg:text-6xl font-black uppercase mb-6">
              <span className="text-white">SÉ </span>
              <span className="text-[#75AADB]">VOLUNTARI@</span>
            </h2>

            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Hacé que la Startup World Cup Argentina pase. Vas a ser parte del equipo que produce el evento de startups más grande del año en LATAM.
            </p>

            <ul className="flex flex-col gap-2 mb-8">
              {[
                'Tu figurita oficial compartible en LinkedIn / IG / WhatsApp',
                'Acceso completo a los 3 días',
                'Networking con organizadores, inversores y founders',
                'Certificado + merch oficial',
              ].map(t => (
                <li key={t} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-[#75AADB] mt-0.5">✓</span>{t}
                </li>
              ))}
            </ul>

            <button
              onClick={() => openVolunteerForm()}
              aria-label="Quiero ser voluntari@ (abre formulario en una nueva pestaña)"
              className="inline-block bg-[#ff7675] hover:bg-[#e85e5d] active:scale-95 text-[#0f172b] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer shadow-lg shadow-[#ff7675]/30 hover:shadow-[#ff7675]/50 hover:scale-105"
            >
              Quiero ser voluntari@ <span aria-hidden>↗</span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff7675] to-transparent" />
    </section>
  )
}

export default Voluntarios
