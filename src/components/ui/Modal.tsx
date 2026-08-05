import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscape } from '../../lib/useEscape'

/**
 * Modal primitivo único - reemplaza los popups duplicados que había en cada
 * sección (PitchBattle, Participan, Footer). Aplica los principios de Don Norman:
 *  - Error recovery: ESC + click outside + botón Cerrar (3 caminos para salir)
 *  - Visibility: foco visible (heredado de :focus-visible global)
 *  - Constraints: focus-trap impide salir con TAB → keyboard users no se pierden
 *  - Feedback: animación entrada/salida + aria-modal
 *  - Consistency: misma API en todos los call sites
 *
 * Convención: render condicional - el caller decide cuándo montar.
 */

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Props = {
  onClose: () => void
  children: ReactNode
  titleId?: string
  /** label accesible si no hay título visible */
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  /**
   * El panel se limita al alto de la pantalla y scrollea por dentro.
   *
   * Sin esto, un modal más alto que la pantalla no se puede leer entero: el
   * contenido que sobra queda fuera del `inset-0`, y el `overflow: hidden` que
   * este mismo componente le pone al body al abrirse deja al dedo sin nada que
   * scrollear. En el checkout —título, precio, desglose, perks y cuatro
   * campos— eso es el botón de pagar, que en un iPhone no aparece nunca.
   *
   * Va en `dvh` y no en `vh` porque en Safari de iOS `100vh` es la pantalla
   * SIN la barra de direcciones: el modal termina más alto que lo visible y el
   * último tramo queda tapado justo por la barra.
   *
   * Es opt-in y no el default para no cambiarle el alto a los modales que hoy
   * resuelven el scroll adentro (Footer, Participan).
   */
  scroll?: boolean
}

/**
 * El modo `scroll`. El `2rem` es el aire que queda arriba y abajo del panel.
 *
 * `overscroll-contain` es para el final del recorrido: sin eso, seguir tirando
 * cuando ya no hay más contenido arrastra la página de atrás, que quedó fija a
 * mitad de camino y aparece moviéndose detrás del fondo borroso.
 */
const SCROLL_CLASSES = 'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain swc-scrollbar'

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

export function Modal({ onClose, children, titleId, ariaLabel, size = 'md', scroll = false }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // ESC para cerrar
  useEscape(true, onClose)

  // Mount: capturar trigger + focus inicial + lock scroll body
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null

    const node = dialogRef.current
    if (!node) return

    const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const first = focusables[0]
    if (first) first.focus()
    else node.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      // Restaurar foco al trigger original
      triggerRef.current?.focus?.()
    }
  }, [])

  // Focus trap: Tab y Shift+Tab quedan dentro del modal
  useEffect(() => {
    const node = dialogRef.current
    if (!node) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(el => !el.hasAttribute('disabled'))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [])

  // Portal a <body>: el modal debe cubrir TODO. Renderizado dentro de una
  // sección envuelta en FadeInSection (que crea stacking context por su
  // animación), su z-index quedaba atrapado y elementos flotantes como el botón
  // de WhatsApp (z-40 en el root) pintaban por encima. En body compite en el
  // contexto raíz y su z-[120] gana sobre todo.
  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020618]/80 backdrop-blur-md px-4 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={!titleId ? ariaLabel : undefined}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={`bg-[#0f172b] border border-[#75AADB]/40 rounded-2xl p-8 w-full ${sizeClasses[size]} shadow-2xl shadow-[#75AADB]/20 animate-[modal-in_0.25s_cubic-bezier(0.16,1,0.3,1)] outline-none${scroll ? ` ${SCROLL_CLASSES}` : ''}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
