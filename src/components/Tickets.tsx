import { content } from '../lib/content'
import { openTicketing } from '../lib/ticketing'

/** Copy del botón por estado. Solo la tanda a la venta linkea a Startup Grind. */
const CTA: Record<string, string> = {
  venta: 'Conseguir Ticket',
  agotado: 'Agotado',
  proximamente: 'Próximamente',
}

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {content.tickets.map((plan) => {
            const disponible = plan.estado === 'venta'
            const agotado = plan.estado === 'agotado'
            return (
            <div key={plan.id} className="relative">
              <div
                className={`relative rounded-2xl p-6 sm:p-8 border-[0.5px] transition-all ${
                  plan.badge
                    ? 'bg-white/10 border-[#75AADB]/35 sm:scale-105 mt-4 sm:mt-0 shadow-[0_0_20px_-6px_rgba(117,170,219,0.2)]'
                    : 'bg-white/5 border-[#75AADB]/10 hover:border-[#75AADB]/25 shadow-[0_0_14px_-8px_rgba(117,170,219,0.1)] hover:shadow-[0_0_18px_-6px_rgba(117,170,219,0.15)]'
                } ${agotado ? 'opacity-60' : ''}`}
              >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#75AADB] text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{plan.badge}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-white font-black text-2xl">{plan.nombre}</h3>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {plan.cupos}
                </span>
              </div>
              <div className={`text-4xl font-black ${agotado ? 'text-gray-500 line-through' : 'text-white'}`}>
                {plan.precio}
              </div>
              <p className="text-gray-500 text-xs mt-1 mb-5 min-h-4">
                {disponible ? '+ cargo de servicio' : ''}
              </p>
              <p className="text-gray-400 text-sm mb-6">{plan.descripcion}</p>
              <ul className="flex flex-col gap-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-[#75AADB] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={disponible ? () => openTicketing(`tickets-${plan.id}`) : undefined}
                disabled={!disponible}
                aria-label={
                  disponible
                    ? `Conseguir ticket ${plan.nombre} (abre Startup Grind en una nueva pestaña)`
                    : `${plan.nombre}: ${CTA[plan.estado]}`
                }
                style={plan.badge && disponible ? { backgroundImage: 'var(--gradient-cta)' } : undefined}
                className={`block w-full text-center font-black py-3 rounded-full uppercase tracking-wide transition-all ${
                  !disponible
                    ? 'cursor-not-allowed border border-white/15 text-gray-500'
                    : `cursor-pointer active:scale-95 ${plan.badge ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] hover:scale-105' : 'border border-white/30 hover:border-[#ff7675] text-white'}`
                }`}
              >
                {CTA[plan.estado]}
              </button>
              </div>
            </div>
            )
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default Tickets
