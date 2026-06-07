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
            // En desktop, cada categoría usa tantas columnas como logos tenga (una sola fila).
            const colsClass =
              ({ 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' } as Record<number, string>)[
                cat.logos.length
              ] ?? 'md:grid-cols-3'
            return (
            <div key={i}>
              <p className="text-center text-gray-400 text-xs uppercase tracking-[0.3em] font-bold mb-4">
                {cat.titulo}
              </p>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${colsClass} gap-4 items-center justify-items-center`}>
                {cat.logos.map((logo, j) => {
                  const url = 'url' in logo && typeof logo.url === 'string' ? logo.url : undefined
                  const Wrapper = ({ children }: { children: ReactNode }) =>
                    url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visitar ${logo.nombre} (abre en una nueva pestaña)`}
                        className="flex items-center justify-center w-full h-28 sm:h-32"
                      >
                        {children}
                      </a>
                    ) : (
                      <div className="flex items-center justify-center w-full h-28 sm:h-32">{children}</div>
                    )
                  return (
                    <Wrapper key={j}>
                    {logo.img ? (() => {
                      const scale = 'scale' in logo && typeof logo.scale === 'number' ? logo.scale : undefined
                      // muted: mismo estilo que UNCUYO (texto), atenuado por defecto y full blanco + glow en hover.
                      const muted = 'muted' in logo && (logo as { muted?: boolean }).muted === true
                      // Color con contraste sobre bg azul oscuro: brillo+contraste para que los logos pop, drop-shadow celeste sutil.
                      const baseFilter = `contrast(1.1) saturate(1.15) brightness(1.05) drop-shadow(0 2px 12px rgba(117,170,219,0.15))`
                      const hoverFilter = muted
                        ? `drop-shadow(0 4px 16px rgba(117,170,219,0.5))`
                        : `contrast(1.18) saturate(1.3) brightness(1.12) drop-shadow(0 6px 24px rgba(117,170,219,0.55))`
                      const baseFilterFinal = muted ? 'none' : baseFilter
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
                      <span className="text-white/80 font-black text-3xl sm:text-4xl uppercase tracking-wide hover:text-white hover:drop-shadow-[0_4px_16px_rgba(117,170,219,0.5)] transition-all">
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
