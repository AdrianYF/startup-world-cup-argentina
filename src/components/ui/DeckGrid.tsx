import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { type PorBreakpoint, deckHeight, useDeckLayout } from '../../lib/deckLayout'

// El chunk de three.js sólo se descarga si el reparto se va a ejecutar.
const DeckDeal3D = lazy(() => import('./DeckDeal3D').then(m => ({ default: m.DeckDeal3D })))

/**
 * Grilla de figuritas con reparto de mazo en 3D al entrar en viewport.
 *
 * Mientras reparte, el canvas se superpone y la grilla real del DOM queda
 * invisible pero presente: conserva el layout, el foco y el lector de pantalla.
 * Al terminar, el canvas se desmonta y todo el click / hover / lightbox sigue
 * siendo DOM nativo.
 *
 * `columns` y `gap` tienen que espejar las clases Tailwind de `gridClass`.
 * Si divergen, las cards aterrizan corridas respecto del DOM de abajo.
 */
export function DeckGrid({
  images,
  gridClass,
  columns,
  gap,
  children,
}: {
  images: string[]
  gridClass: string
  columns: PorBreakpoint
  gap: PorBreakpoint
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useDeckLayout(ref, columns, gap)

  /**
   * 'entrega' existe para evitar el parpadeo del final: si el canvas se
   * desmontara en el mismo momento en que la grilla se vuelve visible, queda
   * un frame con el área vacía. En 'entrega' los dos están pintados a la vez
   * — y como la cámara es ortográfica y está mapeada a píxeles, el último
   * frame del 3D coincide exacto con la grilla, así que el cruce no se nota.
   */
  const [fase, setFase] = useState<'espera' | 'repartiendo' | 'entrega' | 'listo'>('espera')

  useEffect(() => {
    if (fase !== 'espera') return
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFase('listo')
      return
    }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setFase('repartiendo')
          io.disconnect()
        }
      },
      { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [fase])

  // Red de seguridad: si el reparto no avisa que terminó (WebGL caído, texturas
  // que no cargan, pestaña en segundo plano que congela el rAF), la grilla se
  // muestra igual. Nunca puede quedar invisible.
  useEffect(() => {
    if (fase !== 'repartiendo') return
    const t = setTimeout(() => setFase('listo'), 6000)
    return () => clearTimeout(t)
  }, [fase])

  // Ya visible la grilla, esperamos dos frames pintados antes de sacar el
  // canvas. Un solo rAF corre ANTES del paint del commit que la muestra.
  useEffect(() => {
    if (fase !== 'entrega') return
    let id = 0
    const a = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setFase('listo'))
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(id)
    }
  }, [fase])

  const visible = fase === 'entrega' || fase === 'listo'
  const repartiendo = (fase === 'repartiendo' || fase === 'entrega') && layout !== null

  return (
    <div className="relative">
      {/* Sin transición de opacidad: el cruce lo cubre el canvas en 'entrega'.
          Un fade acá reabre el hueco que produce el parpadeo. */}
      <div
        ref={ref}
        className={`${gridClass} ${visible ? 'opacity-100' : 'opacity-0'}`}
        aria-busy={!visible}
      >
        {children}
      </div>

      {repartiendo && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ height: deckHeight(layout, images.length) }}
        >
          <Suspense fallback={null}>
            <DeckDeal3D images={images} layout={layout} onDone={() => setFase('entrega')} />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default DeckGrid
