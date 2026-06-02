import { content } from '../lib/content'
import { GradientText } from './ui/GradientText'
import { ScrollStack } from './ui/ScrollStack'

// Todos los boxes en azul SWC #007bff (rgba 0,123,255 al 20%).
const ETAPA_COLORS = ['#007bff', '#007bff', '#007bff', '#007bff', '#007bff'] as const

type Etapa = (typeof content.etapas)[number]

/**
 * Card de etapa. `opaque` agrega una base oscura sólida para que, al apilarse
 * en mobile (ScrollStack), las cards no se transparenten entre sí.
 */
function EtapaCard({
  etapa,
  i,
  total,
  opaque = false,
}: {
  etapa: Etapa
  i: number
  total: number
  opaque?: boolean
}) {
  const color = ETAPA_COLORS[i] ?? ETAPA_COLORS[ETAPA_COLORS.length - 1]
  return (
    <div
      className="relative border border-white/10 hover:border-white/25 rounded-3xl p-6 transition-all group"
      style={{
        background: opaque
          ? `linear-gradient(to bottom, ${color}33, transparent), #0a1626`
          : `linear-gradient(to bottom, ${color}33, transparent)`,
      }}
    >
      <h3 className="text-white font-black text-lg mb-3 group-hover:text-[#75AADB] transition-colors">
        {etapa.titulo}
      </h3>

      <p className="text-gray-400 text-sm leading-relaxed">{etapa.descripcion}</p>

      {i < total - 1 && (
        <div
          aria-hidden
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-5 lg:-right-7 z-10 w-6 h-6 lg:w-8 lg:h-8 items-center justify-center rounded-full bg-[#020618] border border-[#75AADB]/30 text-white shadow-[0_0_12px_-2px_rgba(117,170,219,0.4)]"
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
  )
}

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

        {/* Mobile: las cards colapsan/apilan con el efecto stacked-cards */}
        <div className="md:hidden">
          <ScrollStack>
            {etapas.map((etapa, i) => (
              <EtapaCard
                key={etapa.numero}
                etapa={etapa}
                i={i}
                total={etapas.length}
                opaque
              />
            ))}
          </ScrollStack>
        </div>

        {/* Desktop: fila de 5 etapas con conectores */}
        <div className="hidden md:grid grid-cols-5 gap-4 lg:gap-6">
          {etapas.map((etapa, i) => (
            <EtapaCard key={etapa.numero} etapa={etapa} i={i} total={etapas.length} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
    </section>
  )
}

export default RutaEvolucion
