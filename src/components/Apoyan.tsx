import type { ReactNode } from 'react'
import { content } from '../lib/content'

function Apoyan() {
  const categorias = content.apoyan

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

        <div className="flex flex-col gap-4">
          {categorias.map((cat, i) => {
            // Columnas en desktop (md+): por defecto, tantas como logos tenga la
            // categoría (pensado para una sola fila). Una categoría puede fijarlas
            // con "cols" cuando no entran en una fila — ej. Institutional: 11 logos
            // en grilla de 4 (4·4·3).
            const cols =
              'cols' in cat && typeof (cat as { cols?: number }).cols === 'number'
                ? (cat as { cols: number }).cols
                : cat.logos.length
            const colsClass =
              ({ 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6' } as Record<number, string>)[
                cols
              ] ?? 'md:grid-cols-3'
            // centrar: con la grilla, una última fila incompleta se pega a la izquierda.
            // Flex + wrap la deja centrada (los logos conservan su tamaño: lo fija su
            // propio max-h/scale, no la celda).
            const centrar = 'centrar' in cat && (cat as { centrar?: boolean }).centrar === true
            const contenedorClass = centrar
              ? 'flex flex-wrap gap-4 items-center justify-center'
              : `grid grid-cols-1 sm:grid-cols-2 ${colsClass} gap-4 items-center justify-items-center`
            return (
            <div key={i}>
              <p className="text-center text-gray-400 text-xs uppercase tracking-[0.3em] font-bold mb-4">
                {cat.titulo}
              </p>
              <div className={contenedorClass}>
                {cat.logos.map((logo, j) => {
                  const url = 'url' in logo && typeof logo.url === 'string' ? logo.url : undefined
                  // En modo centrado el ancho lo pone cada celda (el grid ya reparte solo).
                  const anchoClass = centrar ? 'w-full sm:w-72' : 'w-full'
                  const Wrapper = ({ children }: { children: ReactNode }) =>
                    url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visitar ${logo.nombre} (abre en una nueva pestaña)`}
                        className={`flex items-center justify-center ${anchoClass} h-28 sm:h-32`}
                      >
                        {children}
                      </a>
                    ) : (
                      <div className={`flex items-center justify-center ${anchoClass} h-28 sm:h-32`}>{children}</div>
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
          })}
        </div>
      </div>
    </section>
  )
}

export default Apoyan
