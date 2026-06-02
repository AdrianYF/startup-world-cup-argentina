import { Children, useEffect, useRef, type PropsWithChildren } from 'react'

/**
 * Stacked-cards / scroll-stack (estilo Framer): cada hijo se fija arriba
 * (position: sticky) y, a medida que la card siguiente sube y lo tapa, la card
 * que queda atrás se va achicando con `perspective(1200px) scale(...)`, dando
 * sensación de profundidad. CSS puro + un scroll listener con rAF (sin deps).
 * Respeta prefers-reduced-motion (sin scale, solo apilado).
 */
const BASE_TOP = 88 // px por debajo de la navbar fija
const PEEK = 12 // px que asoma el borde superior de cada card apilada
const MIN_SCALE = 0.9

export function ScrollStack({ children }: PropsWithChildren) {
  const containerRef = useRef<HTMLDivElement>(null)
  const items = Children.toArray(children)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-stack-card]'),
    )

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let raf = 0
    const clamp = (n: number, min: number, max: number) =>
      Math.min(max, Math.max(min, n))

    const update = () => {
      raf = 0
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const next = cards[i + 1]
        if (!next) {
          card.style.transform = 'perspective(1200px) scale(1)'
          continue
        }
        const top = BASE_TOP + i * PEEK // punto donde queda pinneada
        const height = card.offsetHeight // layout height (no afectado por scale)
        const start = top + height // next.top acá => overlap 0
        const nextTop = next.getBoundingClientRect().top
        // progreso del tapado de la card siguiente sobre ésta (0 → 1)
        const p = clamp((start - nextTop) / height, 0, 1)
        const scale = 1 - p * (1 - MIN_SCALE)
        card.style.transform = `perspective(1200px) scale(${scale})`
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // recalcular cuando carguen imágenes y cambien las alturas
    window.addEventListener('load', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('load', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [items.length])

  return (
    <div ref={containerRef} className="relative">
      {items.map((child, i) => (
        <div
          key={i}
          data-stack-card
          className="sticky"
          style={{
            top: `${BASE_TOP + i * PEEK}px`,
            zIndex: i + 1,
            transformOrigin: 'center top',
            willChange: 'transform',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export default ScrollStack
