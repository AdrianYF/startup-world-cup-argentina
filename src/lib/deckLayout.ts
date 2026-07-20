import { useEffect, useState } from 'react'

/**
 * Geometría de la grilla de cards, compartida entre el DOM y el reparto 3D.
 *
 * Vive separado de DeckDeal3D.tsx a propósito: la página necesita estas medidas
 * siempre, pero el chunk de three.js sólo debe descargarse si el reparto se va
 * a ejecutar. Si se importaran del mismo módulo, el import dinámico se anula.
 */

/** Las cards son 1080×1350 uniformes. */
export const CARD_ASPECT = 1350 / 1080

export type DeckLayout = {
  /** Ancho del contenedor en píxeles CSS. */
  width: number
  columns: number
  gap: number
}

export function cardWidth({ width, columns, gap }: DeckLayout) {
  return (width - gap * (columns - 1)) / columns
}

/** Alto total que ocupa la grilla con este layout, en píxeles CSS. */
export function deckHeight(layout: DeckLayout, count: number) {
  const w = cardWidth(layout)
  const rows = Math.ceil(count / layout.columns)
  return rows * w * CARD_ASPECT + (rows - 1) * layout.gap
}

/** Centro y tamaño de la card i, en píxeles CSS relativos al contenedor. */
export function cardCenter(layout: DeckLayout, i: number) {
  const w = cardWidth(layout)
  const h = w * CARD_ASPECT
  const col = i % layout.columns
  const row = Math.floor(i / layout.columns)
  return {
    x: col * (w + layout.gap) + w / 2,
    y: row * (h + layout.gap) + h / 2,
    w,
    h,
  }
}

/** Valor por breakpoint, espejando las clases responsive de Tailwind. */
export type PorBreakpoint = { base: number; sm?: number; md?: number; lg?: number }

/** Breakpoints de Tailwind, para resolver PorBreakpoint contra el viewport. */
function resolver(v: PorBreakpoint, vw: number) {
  if (vw >= 1024 && v.lg !== undefined) return v.lg
  if (vw >= 768 && v.md !== undefined) return v.md
  if (vw >= 640 && v.sm !== undefined) return v.sm
  return v.base
}

/**
 * Mide el contenedor y resuelve columnas y gap contra el viewport. Los valores
 * tienen que espejar las clases Tailwind de la grilla real: si divergen, las
 * cards aterrizan corridas respecto del DOM que queda debajo.
 */
export function useDeckLayout(
  ref: React.RefObject<HTMLElement | null>,
  columns: PorBreakpoint,
  gap: PorBreakpoint,
): DeckLayout | null {
  const [layout, setLayout] = useState<DeckLayout | null>(null)

  // Serializado: los objetos literales del caller cambian de identidad en cada
  // render y reinstalarían el ResizeObserver eternamente.
  const claveCols = JSON.stringify(columns)
  const claveGap = JSON.stringify(gap)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const cols = JSON.parse(claveCols) as PorBreakpoint
    const gaps = JSON.parse(claveGap) as PorBreakpoint
    const measure = () => {
      const vw = window.innerWidth
      setLayout({
        width: el.clientWidth,
        columns: resolver(cols, vw),
        gap: resolver(gaps, vw),
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, claveCols, claveGap])

  return layout
}
