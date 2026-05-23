import { useState } from 'react'

const cards = [
  {
    icon: '⚡',
    categoria: 'Momento Ideación',
    titulo: 'Spark Sessions',
    descripcion: 'Sesiones intensivas para validar tu idea, encontrar co-founders y definir tu propuesta de valor en tiempo récord.',
    popup: 'Las Spark Sessions son bloques de 90 minutos donde equipos de hasta 4 personas trabajan con un mentor especializado para validar su idea de negocio, identificar su mercado objetivo y definir su propuesta de valor única. Al finalizar, cada equipo presenta sus conclusiones al grupo.',
  },
  {
    icon: '👥',
    categoria: 'Networking Pro',
    titulo: 'Matchmaking Digital',
    descripcion: 'Algoritmo de conexión inteligente entre founders, inversores y corporaciones. Cada reunión tiene un propósito.',
    popup: 'Nuestro sistema de Matchmaking Digital analiza el perfil de cada participante y genera reuniones 1:1 estratégicas entre founders, inversores y corporaciones. Cada conexión está diseñada para generar valor real, no networking vacío. Se agendarán hasta 5 reuniones por participante durante el evento.',
  },
  {
    icon: '🎯',
    categoria: 'Conexiones con Intención',
    titulo: 'Deal Flow Arena',
    descripcion: 'Espacio exclusivo donde startups se conectan directamente con fondos de inversión y corporaciones en busca de innovación.',
    popup: 'El Deal Flow Arena es un espacio curado donde las startups seleccionadas presentan su traction y modelo de negocio directamente a fondos de inversión y corporaciones. A diferencia del Pitch Battle, aquí el foco está en generar conversaciones de inversión y alianzas estratégicas en un formato más íntimo.',
  },
]

function BuildersArena() {
  const [popupIndex, setPopupIndex] = useState<number | null>(null)

  return (
    <section id="builders" className="relative py-24 bg-black">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-7xl font-black uppercase mb-4">
            <span className="text-white">BUILDERS </span>
            <span className="text-[#75AADB]">ARENA</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            El espacio donde comienza todo. Ideal para probar ideas y conectar problemas con soluciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => setPopupIndex(i)}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-yellow-500/50 hover:bg-white/10 transition-all group text-left w-full cursor-pointer"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <span className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-3 block">
                {card.categoria}
              </span>
              <h3 className="text-white font-black text-2xl mb-3 group-hover:text-yellow-400 transition-colors">
                {card.titulo}
              </h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                {card.descripcion}
              </p>
              <span className="text-gray-500 text-sm">Ver más →</span>
            </button>
          ))}
        </div>

      </div>

      {/* Popup */}
      {popupIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setPopupIndex(null)}
        >
          <div
            className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-4">{cards[popupIndex].icon}</div>
            <span className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-2 block">
              {cards[popupIndex].categoria}
            </span>
            <h3 className="text-white font-black text-2xl mb-3">{cards[popupIndex].titulo}</h3>
            <p className="text-gray-300 leading-relaxed mb-6">{cards[popupIndex].popup}</p>
            <button
              onClick={() => setPopupIndex(null)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-2 rounded-full transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default BuildersArena