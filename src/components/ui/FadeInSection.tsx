import { useEffect, useRef, useState, type PropsWithChildren } from 'react'

/**
 * Wrapper que aplica fade-in-up cuando el contenido entra al viewport.
 * Single-shot: una vez visible, queda fijo (no re-anima al volver a salir).
 * Respeta prefers-reduced-motion vía la animación en CSS.
 */
export function FadeInSection({
  children,
  delay = 0,
}: PropsWithChildren<{ delay?: number }>) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        })
      },
      { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={visible ? 'fade-in-up' : 'opacity-0'}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export default FadeInSection
