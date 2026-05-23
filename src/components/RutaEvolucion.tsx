const etapas = [
  {
    numero: '01',
    potential: '20%',
    titulo: 'Networking Hub',
    descripcion: 'Workshops estratégicos y Side events exclusivos.',
  },
  {
    numero: '02',
    potential: '45%',
    titulo: 'Builders Arena',
    descripcion: 'Mesa de Inversión y Matchmaking Digital estructurado.',
  },
  {
    numero: '03',
    potential: '70%',
    titulo: 'Expo & Partners',
    descripcion: 'Conexión directa con sponsors, corporaciones y fondos.',
  },
  {
    numero: '04',
    potential: '85%',
    titulo: 'Competencia Oficial',
    descripcion: 'Pitch Battle principal con jurado internacional y clasificación global.',
  },
  {
    numero: '05',
    potential: '100%',
    titulo: 'Global Reach',
    descripcion: 'Expansión internacional y acceso a mercados globales.',
  },
]

function RutaEvolucion() {
  return (
    <section id="ruta" className="relative py-24 bg-black">
      
      {/* Línea decorativa top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Título */}
        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">RUTA DE </span>
            <span className="text-[#75AADB]">EVOLUCIÓN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Un camino estructurado de 5 etapas diseñadas para escalar tu startup al máximo potencial global.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {etapas.map((etapa, i) => (
            <div 
              key={etapa.numero}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-yellow-500/50 transition-all group"
            >
              {/* Número y potential */}
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500/20 text-yellow-400 font-black text-sm w-8 h-8 rounded-lg flex items-center justify-center">
                  {etapa.numero}
                </div>
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                  {etapa.potential}
                </span>
              </div>

              {/* Barra de potencial */}
              <div className="h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-[#75AADB] rounded-full transition-all"
                  style={{ width: etapa.potential }}
                />
              </div>

              {/* Título */}
              <h3 className="text-white font-black text-lg mb-2 group-hover:text-yellow-400 transition-colors">
                {etapa.titulo}
              </h3>

              {/* Descripción */}
              <p className="text-gray-400 text-sm leading-relaxed">
                {etapa.descripcion}
              </p>

              {/* Conector entre cards (no en el último) */}
              {i < etapas.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <div className="text-yellow-500 text-lg">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Línea decorativa bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
    </section>
  )
}

export default RutaEvolucion