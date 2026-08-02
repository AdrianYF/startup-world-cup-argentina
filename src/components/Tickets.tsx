import { useEffect, useRef, useState } from 'react'
import { content } from '../lib/content'
import { SectionGlow } from './ui/SectionGlow'
import TicketCheckoutModal from './TicketCheckoutModal'
import { fetchTiers, formatARS, TIER_POR_TICKET, type TierId, type TierLive } from '../lib/checkout'

/** Copy del botón por estado. */
const CTA: Record<string, string> = {
  venta: 'Conseguir Ticket',
  agotado: 'Agotado',
  proximamente: 'Próximamente',
}

/** Ancho de cada tanda. Se usa para el padding que permite centrar cualquiera. */
const CARD_W = 280

/**
 * "$35.000" → 35000. Sólo se usa como respaldo si /api/tiers no contestó: el
 * precio que se cobra siempre lo pone el backend, esto es para no mostrar un
 * hueco en el modal mientras tanto.
 */
function precioDesdeTexto(precio: string): number {
  return Number(precio.replace(/[^\d]/g, '')) || 0
}

function Tickets() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const destacadaRef = useRef<HTMLDivElement>(null)

  // Tier abierto en el modal de compra (null = cerrado).
  const [comprando, setComprando] = useState<TierId | null>(null)

  // Precio y cupo reales. La tabla `tiers` del backend es la fuente de verdad;
  // tickets.json sólo pinta las cards. Si la API no contesta, `live` queda null
  // y la sección sigue mostrando los valores del JSON: preferimos eso a romperla.
  const [live, setLive] = useState<Record<string, TierLive> | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    fetchTiers(ac.signal).then(tiers => {
      if (!tiers) return
      setLive(Object.fromEntries(tiers.map(t => [t.id, t])))
    })
    return () => ac.abort()
  }, [])

  // El carrusel arranca centrado en la tanda a la venta: es la única accionable
  // y antes quedaba fuera de pantalla en mobile, detrás de dos tandas agotadas.
  // Sin `smooth`: al montar tiene que estar ahí, no animarse hasta ahí.
  useEffect(() => {
    const scroller = scrollerRef.current
    const card = destacadaRef.current
    if (!scroller || !card) return
    scroller.scrollLeft = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2
  }, [])

  return (
    <section id="tickets" className="relative py-16 sm:py-24 bg-[#020618]">
      <SectionGlow />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4 text-white">
            ASEGURATE TU ENTRADA
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Cupos limitados para garantizar calidad de conexiones y experiencias.</p>
        </div>
        {/*
          Carrusel centrado en la tanda a la venta. El padding lateral de media
          pantalla menos media card es lo que permite que cualquier tanda quede
          en el centro — incluidas la primera y la última.

          La máscara desvanece los bordes: las tandas agotadas se van apagando a
          medida que salen de foco, en vez de cortarse de golpe contra el borde.
        */}
        <div
          ref={scrollerRef}
          className="swc-scrollbar-simple overflow-x-auto overscroll-x-contain snap-x snap-mandatory pt-6 pb-4"
          style={{
            maskImage: 'linear-gradient(90deg, transparent 0, #000 16%, #000 84%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 16%, #000 84%, transparent 100%)',
          }}
        >
          <div
            className="flex gap-6 items-stretch w-max"
            style={{ paddingInline: `calc(50% - ${CARD_W / 2}px)` }}
          >
            {content.tickets.map((plan) => {
            // El tier del backend que corresponde a esta card (las tandas viejas
            // no tienen: son historia, no se venden).
            const tier = TIER_POR_TICKET[plan.id]
            const datos = tier && live ? live[tier] : undefined

            // Sin datos vivos mandamos el JSON; con datos vivos manda la base,
            // que es la única que sabe cuánto queda del cupo web.
            const sinCupo = datos ? datos.disponible <= 0 : false
            const disponible = plan.estado === 'venta' && Boolean(tier) && !sinCupo
            const agotado = plan.estado === 'agotado' || sinCupo
            const precio = datos ? formatARS(datos.precio) : plan.precio
            const estadoLabel = agotado ? 'agotado' : plan.estado

            // La VIP se destaca con el dorado, no con la escala: dos cards
            // agrandadas al lado compiten y ninguna gana.
            const oro = plan.acento === 'oro'
            // Solo la tanda a la venta con badge se resalta; el tag "Próximamente" no destaca la card.
            const conBadge = Boolean(plan.badge) && disponible
            const destacado = conBadge && !oro
            return (
            <div
              key={plan.id}
              // Dónde abre el carrusel. Sigue siendo la tanda general aunque la
              // VIP también tenga badge: es la de volumen, y abrir en $65.000
              // sería una primera impresión distinta de la que queremos.
              ref={destacado ? destacadaRef : undefined}
              className="relative shrink-0 w-[280px] snap-center"
            >
              <div
                // Las cards con badge llevan más padding-top para que el título
                // despegue del badge que asoma arriba.
                style={conBadge ? { paddingTop: '28px' } : undefined}
                className={`relative rounded-2xl p-6 sm:p-8 border-[0.5px] transition-all ${
                  oro
                    ? 'bg-[#d4af37]/[0.07] border-[#d4af37]/45 shadow-[0_0_24px_-6px_rgba(212,175,55,0.35)] hover:border-[#d4af37]/70'
                    : destacado
                      ? 'bg-white/10 border-[#75AADB]/35 sm:scale-105 shadow-[0_0_20px_-6px_rgba(117,170,219,0.2)]'
                      : 'bg-white/5 border-[#75AADB]/10 hover:border-[#75AADB]/25 shadow-[0_0_14px_-8px_rgba(117,170,219,0.1)] hover:shadow-[0_0_18px_-6px_rgba(117,170,219,0.15)]'
                } ${agotado ? 'opacity-60' : ''}`}
              >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className={`text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap ${
                    // Texto oscuro sobre dorado: el blanco no pasa AA (2,10).
                    oro
                      ? 'bg-[#d4af37] text-[#0f172b]'
                      : disponible ? 'bg-[#75AADB] text-white' : 'bg-[#0f172b] border border-[#75AADB]/40 text-[#75AADB]'
                  }`}>{plan.badge}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-white font-black text-2xl">{plan.nombre}</h3>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {plan.cupos}
                </span>
              </div>
              <div className={`text-4xl font-black ${agotado ? 'text-gray-500 line-through' : 'text-white'}`}>
                {precio}
              </div>
              <p className="text-gray-500 text-xs mt-1 mb-5 min-h-4">
                {disponible ? '+ cargo de servicio' : ''}
              </p>
              <p className="text-gray-400 text-sm mb-6">{plan.descripcion}</p>
              <ul className="flex flex-col gap-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className={`mt-0.5 ${oro ? 'text-[#d4af37]' : 'text-[#75AADB]'}`}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={disponible && tier ? () => setComprando(tier) : undefined}
                disabled={!disponible}
                aria-label={
                  disponible
                    ? `Comprar ${plan.nombre}`
                    : `${plan.nombre}: ${CTA[estadoLabel]}`
                }
                style={destacado ? { backgroundImage: 'var(--gradient-cta)' } : undefined}
                className={`block w-full text-center font-black py-3 rounded-full uppercase tracking-wide transition-all ${
                  !disponible
                    ? 'cursor-not-allowed border border-white/15 text-gray-500'
                    : oro
                      // Plano y con texto oscuro: sobre dorado el blanco da 2,10
                      // y no llega al 4,5 de AA.
                      ? 'cursor-pointer bg-[#d4af37] text-[#0f172b] hover:bg-[#c19f2f] hover:scale-105 active:scale-95'
                      : `cursor-pointer active:scale-95 ${plan.badge ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] hover:scale-105' : 'border border-white/30 hover:border-[#ff7675] text-white'}`
                }`}
              >
                {CTA[estadoLabel]}
              </button>
              {disponible && datos && datos.disponible <= 5 && (
                <p className="mt-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#ff7675]">
                  {datos.disponible === 1 ? 'Queda 1' : `Quedan ${datos.disponible}`}
                </p>
              )}
              </div>
            </div>
            )
          })}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      {comprando && (() => {
        // La card de la que salió el modal: de ahí vienen los perks y el badge.
        const card = content.tickets.find(t => TIER_POR_TICKET[t.id] === comprando)
        const datos = live?.[comprando]
        if (!card) return null
        return (
          <TicketCheckoutModal
            tier={comprando}
            nombre={datos?.nombre || card.nombre}
            precio={datos?.precio ?? precioDesdeTexto(card.precio)}
            cargo={datos?.cargo ?? null}
            disponible={datos?.disponible ?? null}
            perks={card.features}
            badge={card.badge}
            descripcion={card.descripcion}
            acento={card.acento}
            onClose={() => setComprando(null)}
          />
        )
      })()}
    </section>
  )
}

export default Tickets
