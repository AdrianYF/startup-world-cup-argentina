
const planes = [
  {
    nombre: 'Básico',
    precioAnterior: '$71.000',
    precio: '$42.000',
    descripcion: 'Para entusiastas y builders.',
    badge: null,
    features: ['Acceso general', 'Expo & Pitch Battle', 'Matchmaking digital'],
  },
  {
    nombre: 'Básico Plus',
    precioAnterior: '$143.500',
    precio: '$85.500',
    descripcion: 'Experiencia completa.',
    badge: 'MÁS POPULAR',
    features: ['Todo lo del Early Ticket', 'Acceso Workshops', 'CoWork Zone', 'Side Events + Night Drinks'],
  },
  {
    nombre: 'Pro',
    precioAnterior: '$723.550',
    precio: '$578.550',
    descripcion: 'Foco en inversión y Growth.',
    badge: null,
    features: ['Todo lo del General', 'Mesa Inversión 1:1*', 'Builders Arena prioritario', 'Cocktail Privado', 'Acceso Startup Grind International Team'],
  },
]

function Tickets() {
  return (
    <section id="tickets" className="relative py-24 bg-zinc-950">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">ELEGÍ TU </span>
            <span className="text-[#75AADB]">PUERTA </span>
            <span className="text-white">DE </span>
            <span className="text-yellow-400">ENTRADA</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Cupos limitados para garantizar calidad de conexiones y experiencias.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {planes.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl p-8 border transition-all ${plan.badge ? 'bg-white/10 border-yellow-500/50 scale-105' : 'bg-white/5 border-white/10 hover:border-yellow-500/30'}`}>
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow-500 text-black text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{plan.badge}</span>
                </div>
              )}
              <h3 className="text-white font-black text-2xl mb-2">{plan.nombre}</h3>
              <div className="mb-4">
                <span className="text-gray-500 line-through text-sm mr-2">{plan.precioAnterior}</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">POR TIEMPO LIMITADO</span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-4xl font-black text-white">{plan.precio}</span>
                  <span className="text-gray-400 text-sm mb-1">ARS</span>
                </div>
                <p className="text-gray-500 text-xs">+ comisión de servicio</p>
              </div>
              <p className="text-gray-400 text-sm mb-6">{plan.descripcion}</p>
              <ul className="flex flex-col gap-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-yellow-400 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="#" className={`block text-center font-black py-3 rounded-full uppercase tracking-wide transition-all ${plan.badge ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'border border-white/30 hover:border-yellow-500 text-white'}`}>
                Conseguir Ticket
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-xs mt-8">* Acceso a mesas de inversión sujeto a curación previa de perfil.</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default Tickets