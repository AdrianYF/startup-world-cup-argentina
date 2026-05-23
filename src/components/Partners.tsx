import { useState } from 'react'

const partners = [
  {
    icon: '🛡️',
    categoria: 'CATEGORÍA EXCLUSIVA',
    titulo: 'Presenting Partner',
    descripcion: 'La máxima categoría del evento.',
    features: ['Branding en escenario principal y pantallas', 'Title Sponsorship (presented by)', 'Mesa destacada en Builders Arena', 'Acceso completo a base de datos', 'Reverse Pitch de 10 min'],
    popup: 'El Presenting Partner es la categoría exclusiva del evento. Incluye naming rights, presencia en todos los touchpoints del evento, acceso completo a la base de datos de participantes, y un Reverse Pitch de 10 minutos ante todas las startups. Solo disponible para una empresa.',
  },
  {
    icon: '✨',
    categoria: 'REVERSE PITCH PARTNER',
    titulo: 'Premier Partner',
    descripcion: 'Visibilidad premium y acceso a deal flow estratégico.',
    features: ['Branding en escenario principal y pantallas', 'Reverse Pitch de 5 min', 'Challenge propio en Builders Arena', 'Acceso a salas de reuniones 1:1', '4 Tickets General Admission'],
    popup: 'El Premier Partner incluye un Reverse Pitch de 5 minutos ante todas las startups del evento, un Challenge propio en Builders Arena donde las startups compiten resolviendo un problema de tu empresa, y acceso a reuniones 1:1 con las mejores startups seleccionadas.',
  },
  {
    icon: '🏅',
    categoria: 'NETWORKING & BRAND',
    titulo: 'Platinum Partner',
    descripcion: 'Presencia en zona de networking y acceso al ecosistema.',
    features: ['Branding en loop de sponsors', 'Stand estándar en Expo', 'Participación en panel', '2 Tickets General Admission', 'Mención en redes sociales'],
    popup: 'El Platinum Partner te da presencia en la zona de networking más activa del evento, un stand propio en la Expo, participación como panelista en una de las charlas del evento, y visibilidad de marca en todas las comunicaciones digitales.',
  },
  {
    icon: '⭐',
    categoria: 'BRAND AWARENESS',
    titulo: 'Gold Partner',
    descripcion: 'Visibilidad de marca y presencia en el evento.',
    features: ['Logo en materiales del evento', 'Mención en redes sociales', '2 Tickets General Admission', 'Stand compartido en Expo'],
    popup: 'El Gold Partner es ideal para empresas que buscan visibilidad de marca en el ecosistema emprendedor argentino. Incluye presencia en todos los materiales impresos y digitales, stand compartido en la Expo y 2 tickets para tu equipo.',
  },
  {
    icon: '🤝',
    categoria: 'COMMUNITY PARTNER',
    titulo: 'Community Partner',
    descripcion: 'Alianza estratégica para potenciar el ecosistema.',
    features: ['Logo en website y materiales', 'Mención en comunicaciones', '1 Ticket General Admission', 'Acceso a red de contactos'],
    popup: 'El Community Partner es para organizaciones del ecosistema emprendedor que quieren asociarse al evento. Ideal para aceleradoras, universidades, cámaras y asociaciones. Incluye co-branding y acceso a la red de contactos del evento.',
  },
]

const CARD_WIDTH = 320
const CARD_GAP = 20

function Partners() {
  const [current, setCurrent] = useState(0)
  const [popup, setPopup] = useState<number | null>(null)
  const n = partners.length

  const prev = () => setCurrent(i => (i - 1 + n) % n)
  const next = () => setCurrent(i => (i + 1) % n)

  // Triplicamos el array para simular loop infinito
  const repeated = [...partners, ...partners, ...partners]
  const offset = n + current
  const translateX = -(offset * (CARD_WIDTH + CARD_GAP)) + (window.innerWidth / 2) - (CARD_WIDTH / 2)

  return (
    <section id="partners" className="relative py-24 bg-black overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-black uppercase mb-3">
            <span className="text-white">QUIERO SER </span>
            <span className="text-yellow-400">PARTNER</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada categoría combina visibilidad, innovación abierta y oportunidades reales de negocio.
          </p>
        </div>
      </div>

      {/* Cinta de cards */}
      <div className="relative w-full" style={{ height: 300 }}>
        <div
          className="absolute flex"
          style={{
            gap: CARD_GAP,
            transform: `translateX(${translateX}px)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            top: 0,
          }}
        >
          {repeated.map((p, i) => {
            const isCenter = i === offset
            const dist = Math.abs(i - offset)
            const scale = isCenter ? 1 : dist === 1 ? 0.9 : 0.8
            const opacity = isCenter ? 1 : dist === 1 ? 0.6 : 0.35

            return (
              <div
                key={i}
                onClick={() => {
                  if (isCenter) setPopup(i % n)
                  else if (i < offset) prev()
                  else next()
                }}
                style={{
                  width: CARD_WIDTH,
                  flexShrink: 0,
                  transform: `scale(${scale})`,
                  opacity,
                  transition: 'transform 0.5s ease, opacity 0.5s ease',
                  cursor: 'pointer',
                  transformOrigin: 'center center',
                }}
                className={`rounded-2xl p-6 border h-64
                  ${isCenter
                    ? 'bg-white/10 border-yellow-500/50'
                    : 'bg-white/5 border-white/10'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-yellow-400 text-xs uppercase tracking-widest font-bold block mb-1">{p.categoria}</span>
                    <h3 className="text-white font-black text-lg">{p.titulo}</h3>
                    <p className="text-gray-400 text-xs mt-1">{p.descripcion}</p>
                  </div>
                  <span className="text-2xl">{p.icon}</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {p.features.slice(0, 3).map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-gray-300 text-xs">
                      <span className="text-yellow-400">✓</span>{f}
                    </li>
                  ))}
                  {p.features.length > 3 && (
                    <li className="text-yellow-400 text-xs font-bold mt-1">+{p.features.length - 3} más →</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Arrows y dots */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={prev} className="text-white bg-white/10 hover:bg-yellow-500/20 border border-white/20 hover:border-yellow-500/50 rounded-full w-10 h-10 flex items-center justify-center transition-all text-sm">←</button>
          <button onClick={next} className="text-white bg-white/10 hover:bg-yellow-500/20 border border-white/20 hover:border-yellow-500/50 rounded-full w-10 h-10 flex items-center justify-center transition-all text-sm">→</button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {partners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-yellow-500 w-6' : 'bg-white/30 w-2'}`} />
          ))}
        </div>
      </div>

      {/* Popup */}
      {popup !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setPopup(null)}>
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">{partners[popup].icon}</div>
            <span className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-2 block">{partners[popup].categoria}</span>
            <h3 className="text-white font-black text-2xl mb-3">{partners[popup].titulo}</h3>
            <ul className="flex flex-col gap-2 mb-4">
              {partners[popup].features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-yellow-400 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm">{partners[popup].popup}</p>
            <div className="flex gap-3">
              <a href="mailto:partners@startupworldcupargentina.com" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-2 rounded-full transition-all text-sm">Contactar →</a>
              <button onClick={() => setPopup(null)} className="border border-white/20 text-white font-bold px-6 py-2 rounded-full transition-all text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default Partners