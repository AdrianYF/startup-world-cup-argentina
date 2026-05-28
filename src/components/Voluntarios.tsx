import { openVolunteerForm } from '../lib/ticketing'
import { TiltCard } from './ui/TiltCard'

function Voluntarios() {
  return (
    <section id="voluntarios" className="relative py-16 sm:py-24 bg-white text-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text + título + descripción (mobile order 1, lg col derecha) */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-6">
              <span className="text-[#020618]">SÉ </span>
              <span className="text-[#75AADB]">VOLUNTARI@</span>
            </h2>

            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              Sumate al equipo que hace posible el evento de startups más grande del año en LATAM.
            </p>

            {/* Botón desktop — inline con texto */}
            <button
              onClick={() => openVolunteerForm()}
              aria-label="Quiero ser voluntari@ (abre formulario en una nueva pestaña)"
              style={{ backgroundImage: 'var(--gradient-cta)' }}
              className="hidden lg:inline-block active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#6c5ce7]/30"
            >
              Quiero ser voluntari@
            </button>
          </div>

          {/* Card — mobile order 2 (después del text), más chica en mobile */}
          <div className="order-2 lg:order-1 max-w-[260px] sm:max-w-xs lg:max-w-sm mx-auto w-full">
            <TiltCard
              src="/official.png"
              alt="Card oficial Crew — Startup World Cup Argentina 2026"
              direction="left"
              frame
            />
          </div>

          {/* Botón mobile — debajo de la card */}
          <div className="order-3 lg:hidden flex justify-center">
            <button
              onClick={() => openVolunteerForm()}
              aria-label="Quiero ser voluntari@ (abre formulario en una nueva pestaña)"
              style={{ backgroundImage: 'var(--gradient-cta)' }}
              className="inline-block active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer hover:scale-105 shadow-lg shadow-[#6c5ce7]/30"
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
