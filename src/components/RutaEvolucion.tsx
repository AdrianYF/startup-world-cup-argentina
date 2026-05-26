import { content } from '../lib/content'
import { GradientText } from './ui/GradientText'

function RutaEvolucion() {
  const etapas = content.etapas

  return (
    <section id="ruta" className="relative py-16 sm:py-24 bg-[#020618]">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">RUTA DE </span>
            <GradientText>EVOLUCIÓN</GradientText>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Un camino estructurado de 5 etapas diseñadas para escalar tu startup al máximo potencial global.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6">
          {etapas.map((etapa, i) => (
            <div
              key={etapa.numero}
              className="relative bg-white/5 border-[0.5px] border-[#75AADB]/10 hover:border-[#75AADB]/25 rounded-2xl p-6 transition-all group shadow-[0_0_14px_-8px_rgba(117,170,219,0.1)] hover:shadow-[0_0_18px_-6px_rgba(117,170,219,0.15)]"
            >
              <h3 className="text-white font-black text-lg mb-3 group-hover:text-[#75AADB] transition-colors">
                {etapa.titulo}
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                {etapa.descripcion}
              </p>

              {i < etapas.length - 1 && (
                <div
                  aria-hidden
                  className="hidden md:flex absolute -right-3 lg:-right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 lg:w-8 lg:h-8 items-center justify-center rounded-full bg-[#020618] border border-[#75AADB]/30 text-white shadow-[0_0_12px_-2px_rgba(117,170,219,0.4)]"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Lucide chevron-right */}
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default RutaEvolucion
