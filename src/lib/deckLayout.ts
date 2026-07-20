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

/**
 * Layout responsive espejando las clases Tailwind de la grilla:
 * grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6, gap-3 sm:gap-4.
 */
export function useDeckLayout(ref: React.RefObject<HTMLElement | null>): DeckLayout | null {
  const [layout, setLayout] = useState<DeckLayout | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const vw = window.innerWidth
      setLayout({
        width: el.clientWidth,
        columns: vw >= 1024 ? 6 : vw >= 768 ? 5 : vw >= 640 ? 4 : 3,
        gap: vw >= 640 ? 16 : 12,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return layout
}
