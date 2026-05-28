import { useEffect, useRef, useState } from 'react'

type Direction = 'left' | 'right'

type Props = {
  src: string
  alt: string
  /** 'right' (default): rotación base -10°, scroll desplaza a la izq. 'left': mirror */
  direction?: Direction
  /** Si true, agrega bordes redondeados + ring blanco (estilo "polaroid"). Default false. */
  frame?: boolean
  className?: string
}

/**
 * Card con efecto 3D estilo "figurita":
 *  - Tilt al mouse (rotateX/Y según posición)
 *  - Idle float diagonal (animation CSS)
 *  - Rotación base 3D + parallax al scroll
 *  - Capa holográfica iridiscente con gradient CTA
 */
export function TiltCard({ src, alt, direction = 'right', frame = false, className = '' }: Props) {
  const dir = direction === 'right' ? 1 : -1
  const baseRy = -10 * dir

  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, hover: false })
  const [scroll, setScroll] = useState({ ry: baseRy, ty: 0 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const ry = (x - 0.5) * 22
    const rx = (0.5 - y) * 18
    setTilt({ rx, ry, hover: true })
  }

  function handleMouseLeave() {
    setTilt({ rx: 0, ry: 0, hover: false })
  }

  useEffect(() => {
    let raf = 0
    function onScroll() {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = wrapperRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const cardCenter = rect.top + rect.height / 2
        const progress = (cardCenter - vh / 2) / (vh / 2)
        const clamped = Math.max(-1, Math.min(1, progress))
        // direction=right → rotateY shifts negative; left → positive (espejo)
        const ry = baseRy + clamped * -15 * dir
        const ty = clamped * -30
        setScroll({ ry, ty })
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [baseRy, dir])

  const floatAnimName = `tilt-float-${direction}`

  return (
    <div
      ref={wrapperRef}
      className={`relative max-w-sm mx-auto w-full ${className}`}
      style={{ perspective: '1200px' }}
    >
      <div
        style={{
          transform: `rotateY(${scroll.ry}deg) translateY(${scroll.ty}px)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${tilt.hover ? 30 : 0}px)`,
            transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            animation: tilt.hover ? 'none' : `${floatAnimName} 12s ease-in-out infinite`,
          }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="w-full h-auto block"
          />

          {/* Frame overlay encima de la imagen — borde blanco sobre los edges sin tapar el contenido */}
          {frame && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none rounded-3xl border-[3px] border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            />
          )}

          {/* Capa holográfica iridiscente — gradient brand, intensifica al hover, ángulo sigue el tilt */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-300 rounded-3xl overflow-hidden"
            style={{
              opacity: tilt.hover ? 0.6 : 0.2,
              background: `linear-gradient(${110 + tilt.ry * 3}deg,
                rgba(79,70,229,0.0) 15%,
                rgba(79,70,229,0.5) 28%,
                rgba(108,92,231,0.55) 42%,
                rgba(192,132,252,0.6) 55%,
                rgba(255,118,117,0.55) 70%,
                rgba(255,118,117,0.0) 85%)`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes tilt-float-right {
          0%, 100% { transform: translate3d(0, 0, 0) rotateY(0deg); }
          50%      { transform: translate3d(3px, -4px, 0) rotateY(-1.5deg); }
        }
        @keyframes tilt-float-left {
          0%, 100% { transform: translate3d(0, 0, 0) rotateY(0deg); }
          50%      { transform: translate3d(-3px, -4px, 0) rotateY(1.5deg); }
        }
      `}</style>
    </div>
  )
}
