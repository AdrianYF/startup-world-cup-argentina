import { useState } from 'react'
import { Link } from 'react-router-dom'
import { openStartupForm } from '../lib/ticketing'
import { content } from '../lib/content'
import { TiltCard } from './ui/TiltCard'
import { Modal } from './ui/Modal'
import { BasesContent } from './Footer'

function Startups() {
  const [basesOpen, setBasesOpen] = useState(false)
  const abierta = content.config.convocatoria.startupsAbierta
  const ctaLabel = abierta ? 'Postular mi Startup' : content.config.convocatoria.ctaCerradaStartup
  const ctaAria = abierta
    ? 'Postular mi Startup (abre formulario en una nueva pestaña)'
    : 'Convocatoria de startups cerrada — ver bases y condiciones'
  // Convocatoria abierta → abre el formulario. Cerrada → abre las Bases y Condiciones.
  const onCtaClick = () => (abierta ? openStartupForm() : setBasesOpen(true))

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

            {/* Botón desktop — inline con el texto */}
            <div className="hidden lg:flex flex-col items-start gap-3">
              <button
                onClick={onCtaClick}
                aria-label={ctaAria}
                style={{ backgroundImage: 'var(--gradient-cta)' }}
                className="inline-flex items-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer shadow-lg shadow-[#6c5ce7]/30 hover:shadow-[#6c5ce7]/50 hover:scale-105"
              >
                {ctaLabel}
              </button>
              <Link
                to="/startups"
                className="inline-flex items-center gap-1.5 text-[#75AADB] hover:text-white font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Ver las startups seleccionadas →
              </Link>
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

          {/* Botón mobile — debajo de la card */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <button
              onClick={onCtaClick}
              aria-label={ctaAria}
              style={{ backgroundImage: 'var(--gradient-cta)' }}
              className="inline-flex items-center gap-2 active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer shadow-lg shadow-[#6c5ce7]/30 hover:shadow-[#6c5ce7]/50 hover:scale-105"
            >
              {ctaLabel}
            </button>
            <Link
              to="/startups"
              className="inline-flex items-center gap-1.5 text-[#75AADB] hover:text-white font-bold text-sm uppercase tracking-wide transition-colors"
            >
              Ver las startups seleccionadas →
            </Link>
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      {basesOpen && (
        <Modal onClose={() => setBasesOpen(false)} titleId="bases-modal-title" size="3xl">
          <BasesContent onClose={() => setBasesOpen(false)} />
        </Modal>
      )}
    </section>
  )
}

export default Startups
