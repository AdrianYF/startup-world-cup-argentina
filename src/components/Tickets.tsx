import { content } from '../lib/content'
import { openTicketing } from '../lib/ticketing'

function Tickets() {
  return (
    <section id="tickets" className="relative py-16 sm:py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4 text-white">
            ELEGÍ TU PUERTA DE ENTRADA
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Cupos limitados para garantizar calidad de conexiones y experiencias.</p>
        </div>
        <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {content.tickets.map((plan) => (
            <div key={plan.id} className="relative">
              <div
                className={`relative rounded-2xl p-6 sm:p-8 border-[0.5px] transition-all overflow-hidden ${
                  plan.badge
                    ? 'bg-white/10 border-[#75AADB]/35 sm:scale-105 mt-4 sm:mt-0 shadow-[0_0_20px_-6px_rgba(117,170,219,0.2)]'
                    : 'bg-white/5 border-[#75AADB]/10 hover:border-[#75AADB]/25 shadow-[0_0_14px_-8px_rgba(117,170,219,0.1)] hover:shadow-[0_0_18px_-6px_rgba(117,170,219,0.15)]'
                }`}
              >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#75AADB] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{plan.badge}</span>
                </div>
              )}
              <h3 className="text-white font-black text-2xl mb-3">{plan.nombre}</h3>
              <p className="text-gray-400 text-sm mb-6">{plan.descripcion}</p>
              <ul className="flex flex-col gap-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-[#75AADB] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openTicketing(`tickets-${plan.id}`)}
                aria-label={`Conseguir ticket ${plan.nombre} (abre Startup Grind en una nueva pestaña)`}
                style={plan.badge ? { backgroundImage: 'var(--gradient-cta)' } : undefined}
                className={`block w-full text-center font-black py-3 rounded-full uppercase tracking-wide transition-all cursor-pointer active:scale-95 ${plan.badge ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] hover:scale-105' : 'border border-white/30 hover:border-[#ff7675] text-white'}`}
              >
                Conseguir Ticket
              </button>
              </div>
            </div>
          ))}
        </div>

        {/* === Glass overlay sutil — backdrop-blur limpio + mensaje minimal centrado === */}
        <div
          aria-hidden
          className="absolute inset-x-0 -top-8 sm:-top-10 -bottom-4 z-20 rounded-3xl overflow-hidden flex items-center justify-center pointer-events-auto"
        >
          {/* Backdrop muy translúcido — los boxes detrás casi se leen */}
          <div className="absolute inset-0 backdrop-blur-md bg-[#020618]/12" />

          {/* Línea sutil arriba */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          {/* Línea sutil abajo */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

          {/* Mensaje minimal */}
          <div className="relative z-10 text-center px-6 py-8">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="relative flex items-center">
                <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-[#75AADB] opacity-50 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#75AADB]/65" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#75AADB]/60">
                Pre Venta
              </span>
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-[0.06em] text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] [text-shadow:0_2px_6px_rgba(0,0,0,0.25)]">
              Próximamente
            </p>
            <p className="text-[10px] sm:text-xs font-medium tracking-wider text-white/25 mt-3">
              Apertura por anunciar
            </p>
          </div>
        </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default Tickets
