import { content } from '../lib/content'
import { openTicketing } from '../lib/ticketing'

function Tickets() {
  return (
    <section id="tickets" className="relative py-16 sm:py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">ELEGÍ TU </span>
            <span className="text-[#75AADB]">PUERTA </span>
            <span className="text-white">DE </span>
            <span className="text-[#75AADB]">ENTRADA</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Cupos limitados para garantizar calidad de conexiones y experiencias.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {content.tickets.map((plan) => (
            <div key={plan.id} className="relative">
              <div
                className={`relative rounded-2xl p-6 sm:p-8 border-[0.5px] transition-all ${
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
              <h3 className="text-white font-black text-2xl mb-2">{plan.nombre}</h3>
              <div className="mb-4">
                <span className="text-gray-400 line-through text-sm mr-2">{plan.precioAnterior}</span>
                <span className="text-xs bg-[#75AADB]/20 text-[#75AADB] px-2 py-0.5 rounded-full font-bold">POR TIEMPO LIMITADO</span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-4xl font-black text-white">{plan.precio}</span>
                  <span className="text-gray-400 text-sm mb-1">ARS</span>
                </div>
                <p className="text-gray-400 text-xs">+ comisión de servicio</p>
              </div>
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
                className={`block w-full text-center font-black py-3 rounded-full uppercase tracking-wide transition-all cursor-pointer active:scale-95 ${plan.badge ? 'bg-[#75AADB] hover:bg-[#5a93c5] text-white' : 'border border-white/30 hover:border-[#75AADB] text-white'}`}
              >
                Conseguir Ticket
              </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-8">* Acceso a mesas de inversión sujeto a curación previa de perfil.</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default Tickets
