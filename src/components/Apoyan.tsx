import { useEffect, useRef, useState, type ReactNode } from 'react'
import { content } from '../lib/content'

type Categoria = (typeof content.apoyan)[number]

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

function Apoyan() {
  const categorias = content.apoyan
  const wallRef = useRef<HTMLDivElement>(null)

  // Spotlight: una luz celeste sigue el cursor sobre el muro de logos (via CSS vars).
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wallRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <section id="apoyan" className="relative py-16 sm:py-24 bg-[#020618] text-white">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-4">
            <span className="text-white">QUIENES NOS </span>
            <span className="text-[#75AADB]">APOYAN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Las organizaciones que impulsan la innovación en Argentina y el mundo.
          </p>
        </div>

        <div ref={wallRef} onMouseMove={onMove} className="group/wall relative">
          {/* Spotlight: resplandor celeste detrás de los logos, sigue el cursor y aparece al hover. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/wall:opacity-100"
            style={{
              background:
                'radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(117,170,219,0.16), transparent 72%)',
            }}
          />
          <div className="relative z-10 flex flex-col gap-4">
            {categorias.map((cat, i) => (
              <CategoriaLogos key={i} cat={cat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Una categoría con reveal escalonado: los logos aparecen en cascada cuando entra al viewport. */
function CategoriaLogos({ cat }: { cat: Categoria }) {
  const ref = useRef<HTMLDivElement>(null)
  const [reduced] = useState(prefiereMenosMovimiento)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (reduced) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reduced])

  // Columnas en desktop (md+): `cols` explícito si la categoría lo define; si
  // no, tantas como logos tenga (pensado para una sola fila). En grilla, las
  // columnas reparten el ancho completo, así los logos quedan bien espaciados.
  const cols =
    'cols' in cat && typeof (cat as { cols?: number }).cols === 'number'
      ? (cat as { cols: number }).cols
      : cat.logos.length
  const colsClass =
    ({ 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' } as Record<number, string>)[
      cols
    ] ?? 'md:grid-cols-3'
  // centrar: los logos van en flex + wrap con la última fila incompleta
  // centrada, en vez de pegada a la izquierda como hace la grilla.
  const centrar = 'centrar' in cat && (cat as { centrar?: boolean }).centrar === true
  // porFila: en modo centrar, limita el ancho del contenedor para que entren
  // exactamente N logos por fila (cada uno w-72 = 288px + gap 16px). Así la
  // categoría se parte en las filas deseadas — ej. 6 logos, 2 por fila → 3 filas.
  const porFila = (cat as { porFila?: number }).porFila
  const contenedorStyle =
    centrar && typeof porFila === 'number'
      ? { maxWidth: `${porFila * 288 + (porFila - 1) * 16 + 12}px` }
      : undefined
  const contenedorClass = centrar
    ? `flex flex-wrap gap-4 items-center justify-center${porFila ? ' mx-auto' : ''}`
    : `grid grid-cols-1 sm:grid-cols-2 ${colsClass} gap-4 items-center justify-items-center`

  return (
    <div>
      <p className="text-center text-gray-400 text-xs uppercase tracking-[0.3em] font-bold mb-4">
        {cat.titulo}
      </p>
      <div ref={ref} className={contenedorClass} style={contenedorStyle}>
        {cat.logos.map((logo, j) => {
          const url = 'url' in logo && typeof logo.url === 'string' ? logo.url : undefined
          // En modo centrado el ancho lo pone cada celda (el grid ya reparte solo).
          const anchoClass = centrar ? 'w-full sm:w-72' : 'w-full'
          // spanFull: en grilla, cuando el logo queda huérfano en la fila de 2 (tablet)
          // ocupa el ancho completo y queda centrado; en desktop (5 columnas) vuelve a 1.
          const spanFull = !centrar && 'spanFull' in logo && (logo as { spanFull?: boolean }).spanFull === true
          const spanClass = spanFull ? ' sm:col-span-2 md:col-span-1' : ''
          // Reveal escalonado: cada logo entra con fade + subida, desfasado por su índice.
          const revealStyle = reduced
            ? undefined
            : {
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 380ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1)',
                transitionDelay: visible ? `${j * 40}ms` : '0ms',
              }
          const Wrapper = ({ children }: { children: ReactNode }) =>
            url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visitar ${logo.nombre} (abre en una nueva pestaña)`}
                className={`flex items-center justify-center ${anchoClass}${spanClass} h-28 sm:h-32`}
                style={revealStyle}
              >
                {children}
              </a>
            ) : (
              <div className={`flex items-center justify-center ${anchoClass}${spanClass} h-28 sm:h-32`} style={revealStyle}>
                {children}
              </div>
            )
          return (
            <Wrapper key={j}>
              {logo.img ? (() => {
                const scale = 'scale' in logo && typeof logo.scale === 'number' ? logo.scale : undefined
                // muted: mismo estilo que UNCUYO (texto), atenuado por defecto y full blanco + glow en hover.
                const muted = 'muted' in logo && (logo as { muted?: boolean }).muted === true
                // brandStrict: marcas con guía de uso propia (ej. Deloitte). Sin filtro ni
                // glow: no se recolorea ni se le agrega nada al logo. Solo escala en hover.
                const brandStrict = 'brandStrict' in logo && (logo as { brandStrict?: boolean }).brandStrict === true
                // Color con contraste sobre bg azul oscuro: brillo+contraste para que los logos pop, drop-shadow celeste sutil.
                const baseFilter = `contrast(1.1) saturate(1.15) brightness(1.05) drop-shadow(0 2px 12px rgba(117,170,219,0.15))`
                const hoverFilter = brandStrict
                  ? 'none'
                  : muted
                  ? `drop-shadow(0 4px 16px rgba(117,170,219,0.5))`
                  : `contrast(1.18) saturate(1.3) brightness(1.12) drop-shadow(0 6px 24px rgba(117,170,219,0.55))`
                const baseFilterFinal = muted || brandStrict ? 'none' : baseFilter
                const baseOpacity = muted ? 0.8 : 1
                const baseTransform = scale ? `scale(${scale})` : 'scale(1)'
                const hoverTransform = scale ? `scale(${scale * 1.05})` : 'scale(1.05)'
                return (
                  <img
                    src={logo.img}
                    alt={logo.nombre}
                    style={{
                      transform: baseTransform,
                      filter: baseFilterFinal,
                      opacity: baseOpacity,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.filter = hoverFilter
                      e.currentTarget.style.transform = hoverTransform
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.filter = baseFilterFinal
                      e.currentTarget.style.transform = baseTransform
                      e.currentTarget.style.opacity = String(baseOpacity)
                    }}
                    className="max-h-24 sm:max-h-32 max-w-[280px] sm:max-w-[320px] w-auto object-contain transition-[filter,transform,opacity] duration-300 ease-out cursor-pointer"
                  />
                )
              })() : (
                <span
                  // scale achica el texto igual que en los logos de imagen (sin scale = tamaño por defecto).
                  style={
                    'scale' in logo && typeof logo.scale === 'number'
                      ? { fontSize: `${logo.scale * 2.25}rem` }
                      : undefined
                  }
                  className="text-white/80 font-black text-3xl sm:text-4xl uppercase tracking-wide whitespace-nowrap hover:text-white hover:drop-shadow-[0_4px_16px_rgba(117,170,219,0.5)] transition-all"
                >
                  {logo.nombre}
                </span>
              )}
            </Wrapper>
          )
        })}
      </div>
    </div>
  )
}

export default Apoyan
