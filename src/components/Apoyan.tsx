const categorias = [
  {
    titulo: 'PRESENTING PARTNERS',
    logos: [
      { nombre: 'Startup World Cup', img: '/Logo-White-246x300.png' },
      { nombre: 'Startup Grind', img: '/sg-stacked-whitepink.png' },
      { nombre: 'Pegasus Tech Ventures', img: '/pegasus-logo.png' },
    ],
  },
  {
    titulo: 'COMMUNITY PARTNERS',
    logos: [
      { nombre: 'Paisanos', img: null },
      { nombre: 'Lovable', img: null },
      { nombre: 'Buidlers', img: null },
    ],
  },
  {
    titulo: 'INSTITUTIONAL PARTNERS',
    logos: [
      { nombre: 'UAI', img: null },
      { nombre: 'UNCUYO', img: null },
    ],
  },
]

function Apoyan() {
  return (
    <section id="info" className="relative py-24 bg-zinc-950">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-black uppercase mb-4">
            <span className="text-white">QUIENES NOS </span>
            <span className="text-yellow-400">APOYAN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Las organizaciones que impulsan la innovación en Argentina y el mundo.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {categorias.map((cat, i) => (
            <div key={i}>
              <p className="text-center text-gray-500 text-xs uppercase tracking-widest mb-6">{cat.titulo}</p>
              <div className="flex flex-wrap justify-center gap-4">
                {cat.logos.map((logo, j) => (
                  <div key={j} className="bg-white/5 border border-white/10 rounded-xl px-8 py-6 flex items-center justify-center min-w-36 hover:border-yellow-500/30 transition-all">
                    {logo.img ? (
                      <img src={logo.img} alt={logo.nombre} className="h-12 w-auto object-contain" />
                    ) : (
                      <span className="text-white font-bold text-lg">{logo.nombre}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default Apoyan