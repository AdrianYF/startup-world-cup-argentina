import { Link } from 'react-router-dom'
import { openStartupForm } from '../lib/ticketing'
import { content } from '../lib/content'
import { TiltCard } from './ui/TiltCard'

const BTN_CLASS =
  'inline-flex items-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer shadow-lg shadow-[#6c5ce7]/30 hover:shadow-[#6c5ce7]/50 hover:scale-105'
const LINK_CLASS =
  'inline-flex items-center gap-1.5 text-[#75AADB] hover:text-white font-bold text-sm uppercase tracking-wide transition-colors'

/**
 * CTA de la sección:
 * - Convocatoria abierta → "Postular mi Startup" (formulario) + link a las seleccionadas.
 * - Convocatoria cerrada → "Ver startups seleccionadas" (lleva a /startups).
 */
function CtaStartups({ abierta }: { abierta: boolean }) {
  if (!abierta) {
    return (
      <Link
        to="/startups"
        aria-label="Ver las startups seleccionadas"
        style={{ backgroundImage: 'var(--gradient-cta)' }}
        className={BTN_CLASS}
      >
        Ver startups seleccionadas
      </Link>
    )
  }
  return (
    <>
      <button
        onClick={() => openStartupForm()}
        aria-label="Postular mi Startup (abre formulario en una nueva pestaña)"
        style={{ backgroundImage: 'var(--gradient-cta)' }}
        className={BTN_CLASS}
      >
        Postular mi Startup
      </button>
      <Link to="/startups" className={LINK_CLASS}>
        Ver las startups seleccionadas →
      </Link>
    </>
  )
}

function Startups() {
  const abierta = content.config.convocatoria.startupsAbierta

  return (
    <section id="startups" className="relative py-16 sm:py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div className="lg:order-1">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-6">
              <span className="text-white">APLICÁ CON </span>
              <span className="text-[#75AADB]">TU STARTUP</span>
            </h2>

            <ul className="flex flex-col gap-3 mb-8">
              <li className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-[#75AADB] mt-0.5">✓</span>
                Acceso al Deal Flow Arena y Matchmaking Digital.
              </li>
              <li className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-[#75AADB] mt-0.5">✓</span>
                Mentoría previa al Pitch Battle.
              </li>
              <li className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-[#75AADB] mt-0.5">✓</span>
                Vertical agnóstica: cualquier industria puede aplicar.
              </li>
              <li className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-[#75AADB] mt-0.5">✓</span>
                Las startups no seleccionadas para el Pitch Battle podrán ser convocadas para presentar el día 6 frente a asistentes locales y virtuales por streaming.
              </li>
            </ul>

            {/* CTA desktop — inline con el texto */}
            <div className="hidden lg:flex flex-col items-start gap-3">
              <CtaStartups abierta={abierta} />
            </div>
          </div>

          {/* Figurita oficial — card con tilt 3D + scroll parallax (mobile más chica) */}
          <div className="lg:order-2 max-w-[260px] sm:max-w-xs lg:max-w-sm mx-auto w-full">
            <TiltCard
              src="/startup.png"
              alt="Card oficial de Startup — Startup World Cup Argentina 2026"
              direction="right"
            />
          </div>

          {/* CTA mobile — debajo de la card */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <CtaStartups abierta={abierta} />
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default Startups
