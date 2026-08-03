import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { type PorBreakpoint, cardCenter, useDeckLayout } from '../../lib/deckLayout'

/**
 * Grilla de figuritas con reparto de "mazo" al entrar en viewport.
 *
 * Las cards son las imágenes REALES del DOM (no un canvas): salen apiladas del
 * centro de la grilla y se reparten a su celda con un giro leve, usando sólo
 * CSS transforms. Así se ven las cartas dándose desde el primer frame — sin
 * placeholder azul, sin dorsos, sin esperar a que carguen texturas de WebGL.
 *
 * `columns` y `gap` tienen que espejar las clases Tailwind de `gridClass`, para
 * que el punto de partida de cada card (calculado desde el layout) caiga cerca
 * del centro real de la grilla.
 */
export function DeckGrid({
  gridClass,
  columns,
  gap,
  stagger = 0.07,
  children,
}: {
  gridClass: string
  columns: PorBreakpoint
  gap: PorBreakpoint
  /** Desfase entre cards (segundos). Más alto = reparto más progresivo. */
  stagger?: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useDeckLayout(ref, columns, gap)
  const items = Children.toArray(children)

  // Se pregunta una vez, al montar, y no en cada render: `matchMedia` durante el
  // render es una lectura del navegador en medio de algo que tiene que ser puro.
  const [reduce] = useState(
    () => typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  // Sin animación la deck ya está repartida: se arranca activa en vez de
  // prenderla con un setState adentro del efecto.
  const [activo, setActivo] = useState(reduce)

  // Dispara el reparto cuando la grilla entra en viewport. Mismo rootMargin que
  // FadeInSection en el resto del sitio.
  //
  // Antes de repartir precargamos las imágenes de la grilla (son loading=lazy):
  // si la deck arrancara con imágenes a medio cargar, las cards se repartirían
  // vacías y la imagen aparecería después (los "espacios vacíos que se cargan
  // luego"). Esperamos a que decodifiquen, con un tope para no bloquear.
  useEffect(() => {
    if (activo) return
    const el = ref.current
    if (!el) return

    // Con `reduce` ya arrancó activa (ver el useState de arriba): no hay reparto
    // que precargar ni que animar.
    if (reduce) return

    let cancelado = false

    const precargarYRepartir = async () => {
      const imgs = Array.from(el.querySelectorAll('img'))
      imgs.forEach(img => {
        img.loading = 'eager'
      })
      await Promise.race([
        Promise.allSettled(imgs.map(img => (img.decode ? img.decode() : Promise.resolve()))),
        new Promise(res => setTimeout(res, 2500)), // tope: no esperar imágenes lentas
      ])
      if (!cancelado) setActivo(true)
    }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          io.disconnect()
          void precargarYRepartir()
        }
      },
      { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => {
      cancelado = true
      io.disconnect()
    }
  }, [activo, reduce])

  // Red de seguridad: si el observer nunca dispara (medición rara), mostramos
  // las cards igual. Nunca pueden quedar invisibles.
  useEffect(() => {
    if (activo) return
    const t = setTimeout(() => setActivo(true), 6000)
    return () => clearTimeout(t)
  }, [activo])

  const deckX = layout ? layout.width / 2 : 0

  return (
    <div ref={ref} className={gridClass}>
      {items.map((child, i) => {
        // Delta desde la celda de la card hasta el centro del mazo (su punto de
        // partida). Sin layout todavía, arranca sin desplazamiento.
        let dx = 0
        let dy = 0
        if (layout) {
          const c = cardCenter(layout, i)
          dx = deckX - c.x
          // El mazo arranca un poco por encima del centro vertical de la grilla.
          dy = layout.width * 0.25 - c.y
        }
        const rot = ((i % 7) - 3) * 3 // abanico leve, determinístico

        const dealing = activo && !reduce
        const style: React.CSSProperties = dealing
          ? {
              // vars que consume el keyframe deck-deal (index.css)
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
              ['--rot' as string]: `${rot}deg`,
              animation: 'deck-deal 0.6s cubic-bezier(0.2,0.75,0.25,1) both',
              animationDelay: `${i * stagger}s`,
            }
          : // Antes del reparto: invisibles (la grilla está fuera de viewport).
            // Con reduce-motion: visibles al toque, sin animación.
            { opacity: activo ? 1 : 0 }

        return (
          <div key={i} style={style}>
            {child}
          </div>
        )
      })}
    </div>
  )
}

export default DeckGrid
