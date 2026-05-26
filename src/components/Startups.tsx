import { openStartupForm } from '../lib/ticketing'
import { StartupCard } from './ui/StartupCard'

function Startups() {
  return (
    <section id="startups" className="relative py-16 sm:py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          <div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-6">
              <span className="text-white">APLICÁ </span>
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

            <button
              onClick={() => openStartupForm()}
              aria-label="Postular mi Startup (abre formulario en una nueva pestaña)"
              style={{ backgroundImage: 'var(--gradient-cta)' }}
              className="inline-block active:scale-95 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] font-black text-lg px-8 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer shadow-lg shadow-[#6c5ce7]/30 hover:shadow-[#6c5ce7]/50 hover:scale-105"
            >
              Postular mi Startup
            </button>
          </div>

          {/* Figurita estilo Ultimate Team - preview */}
          <div className="relative max-w-sm mx-auto w-full">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 uppercase tracking-widest justify-center">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Tu figurita oficial · preview
            </div>
            <StartupCard />
            <p className="text-center text-gray-400 text-[10px] uppercase tracking-widest mt-4">
              Compartible en LinkedIn · WhatsApp · X
            </p>
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default Startups
