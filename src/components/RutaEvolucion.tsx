import { content } from '../lib/content'

function RutaEvolucion() {
  const etapas = content.etapas

  return (
    <section id="ruta" className="relative py-24 bg-[#020618]">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-16">
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">RUTA DE </span>
            <span className="text-[#75AADB]">EVOLUCIÓN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Un camino estructurado de 5 etapas diseñadas para escalar tu startup al máximo potencial global.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {etapas.map((etapa, i) => (
            <div
              key={etapa.numero}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#6c5ce7]/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#6c5ce7]/20 text-[#6c5ce7] font-black text-sm w-8 h-8 rounded-lg flex items-center justify-center">
                  {etapa.numero}
                </div>
                <span className="text-[#6c5ce7] text-xs font-bold uppercase tracking-widest">
                  {etapa.potential}
                </span>
              </div>

              <div className="h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#ff7675] rounded-full transition-all"
                  style={{ width: etapa.potential }}
                />
              </div>

              <h3 className="text-white font-black text-lg mb-2 group-hover:text-[#6c5ce7] transition-colors">
                {etapa.titulo}
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                {etapa.descripcion}
              </p>

              {i < etapas.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <div className="text-[#6c5ce7] text-lg">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />
    </section>
  )
}

export default RutaEvolucion
