import { useEffect, useRef, type ReactNode } from 'react'
import { useEscape } from '../../lib/useEscape'

/**
 * Modal primitivo único — reemplaza los popups duplicados en PitchBattle,
 * BuildersArena y Partners. Aplica los principios de Don Norman:
 *  - Error recovery: ESC + click outside + botón Cerrar (3 caminos para salir)
 *  - Visibility: foco visible (heredado de :focus-visible global)
 *  - Constraints: focus-trap impide salir con TAB → keyboard users no se pierden
 *  - Feedback: animación entrada/salida + aria-modal
 *  - Consistency: misma API en todos los call sites
 *
 * Convención: render condicional — el caller decide cuándo montar.
 */

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Props = {
  onClose: () => void
  children: ReactNode
  titleId?: string
  /** label accesible si no hay título visible */
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ onClose, children, titleId, ariaLabel, size = 'md' }: Props) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020618]/70 backdrop-blur-sm px-4 animate-[fade-in_0.2s_ease-out]"
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
        className={`bg-[#0f172b] border border-[#75AADB]/40 rounded-2xl p-8 w-full ${sizeClasses[size]} shadow-2xl shadow-[#75AADB]/20 animate-[modal-in_0.25s_cubic-bezier(0.16,1,0.3,1)] outline-none`}
      >
        {children}
      </div>
    </div>
  )
}

export default Modal
