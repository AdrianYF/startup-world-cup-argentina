import { useEffect } from 'react'

/**
 * Hook que escucha la tecla Escape y dispara onEscape mientras `active` sea true.
 * Don Norman §9: error recovery — todo modal debe tener salida con ESC.
 */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, onEscape])
}
