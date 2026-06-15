import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { content } from '../../lib/content'

type Variant = 'compact' | 'full'

/**
 * URL real a la que apunta el QR del ticket: la sección oculta "Mystery Box".
 * Se usa el origin actual para que funcione en cualquier dominio (deploy/preview).
 */
const MYSTERY_BOX_URL =
  (typeof window !== 'undefined' ? window.location.origin : '') + '/mystery-box'

/** Ruta interna a la que lleva "cortar" el ticket en mobile. */
const MYSTERY_BOX_PATH = '/mystery-box'

/* -------- subcomponentes decorativos -------- */

function HolographicSeal({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative rounded-full border-2 border-[#0f172b]/80 shadow-inner overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute inset-0 animate-[spin_8s_linear_infinite]"
        style={{
          background:
            'conic-gradient(from 0deg, #d4af37, #f3e6b3, #a67c00, #d4af37, #f3e6b3, #a67c00, #d4af37)',
        }}
      />
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/40 to-[#0f172b]/30 backdrop-blur-[1px] flex items-center justify-center">
        <span className="font-black text-[#21313f]/90" style={{ fontSize: size * 0.32 }}>
          SWC
        </span>
      </div>
      <div
        className="absolute inset-0 rounded-full mix-blend-overlay opacity-60"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 50%)',
        }}
      />
    </div>
  )
}

function SolDeMayo({ size = 240, opacity = 0.18 }: { size?: number; opacity?: number }) {
  const rays = Array.from({ length: 16 })
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ opacity }}
      className="absolute pointer-events-none"
      aria-hidden
    >
      {rays.map((_, i) => {
        const angle = (i * 360) / rays.length
        return (
          <polygon
            key={i}
            points="50,5 52,40 48,40"
            fill="#a67c00"
            transform={`rotate(${angle} 50 50)`}
          />
        )
      })}
      <circle cx="50" cy="50" r="14" fill="#a67c00" />
      <circle cx="50" cy="50" r="11" fill="#a67c00" />
    </svg>
  )
}

function GuillochePattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.15 }}
      aria-hidden
    >
      <defs>
        <pattern id="guilloche" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0,20 Q10,0 20,20 T40,20" stroke="#0f172b" strokeWidth="0.5" fill="none" />
          <path d="M0,30 Q10,10 20,30 T40,30" stroke="#0f172b" strokeWidth="0.5" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#guilloche)" />
    </svg>
  )
}

/** QR real (escaneable) que lleva a la sección oculta Mystery Box. */
function QRCode({ size = 56 }: { size?: number }) {
  return (
    <QRCodeSVG
      value={MYSTERY_BOX_URL}
      size={size}
      level="M"
      marginSize={1}
      bgColor="#ffffff"
      fgColor="#0f172b"
    />
  )
}

/** Ícono de tijera (línea, hereda currentColor). */
function ScissorsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

/**
 * Genera el path de un borde "rasgado" (zigzag irregular) vertical, en px,
 * para que el corte no sea una línea recta sino un papel desgarrado.
 */
function buildTornPath(height: number, width: number) {
  if (height <= 0) return ''
  const cx = width / 2
  const seg = 7 // alto de cada diente
  const n = Math.max(2, Math.ceil(height / seg))
  // amplitudes pseudo-aleatorias pero deterministas (sin Math.random)
  const amp = (i: number) => 2 + ((i * 37) % 5) * 0.6
  let d = `M ${cx} 0`
  for (let i = 1; i <= n; i++) {
    const y = Math.min(i * seg, height)
    const x = cx + (i % 2 === 0 ? amp(i) : -amp(i))
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

/**
 * Cartelito "NO CORTAR" tipo sticker (reemplaza al QR en mobile).
 * Es solo decorativo/instructivo: la acción real es arrastrar la tijera.
 */
function NoCutSign() {
  return (
    <div
      className="relative -rotate-6 select-none rounded border border-[#0f172b]/50 bg-white/85 px-1.5 py-1 text-center shadow-sm"
      aria-hidden
    >
      <div className="flex items-center justify-center gap-0.5 text-[#b91c1c]">
        <ScissorsIcon size={11} />
        <span className="text-[7px] font-black leading-none tracking-tight">NO</span>
      </div>
      <div className="text-[8px] font-black leading-none tracking-[0.12em] text-[#0f172b]">
        CORTAR
      </div>
    </div>
  )
}

/* -------- variantes del ticket -------- */

function CompactTicket({ formatUSD }: { formatUSD: string }) {
  return (
    <div className="inline-flex items-stretch font-mono select-none drop-shadow-lg">
      <div className="relative bg-gradient-to-br from-[#f3e6b3] via-[#d4af37] to-[#d4af37] rounded-l-lg px-4 py-2 border border-r-0 border-[#d4af37] overflow-hidden">
        <GuillochePattern />
        <div className="relative flex items-center gap-3">
          <HolographicSeal size={32} />
          <div>
            <div className="text-[8px] font-black tracking-[0.2em] uppercase text-[#21313f]/80">
              Premio Final
            </div>
            <div className="text-xl font-black leading-none text-[#21313f] mt-0.5">
              USD {formatUSD}
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-3 bg-[#d4af37] border border-[#d4af37] border-l-0 border-r-0">
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-[#0f172b]/50" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f172b] rounded-full" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f172b] rounded-full" />
      </div>

      <div className="bg-gradient-to-br from-[#d4af37] to-[#ffffff] rounded-r-lg px-3 py-2 border border-l-0 border-[#d4af37] flex items-center justify-center">
        <span className="text-[#21313f] text-sm font-black tracking-widest">AR·26</span>
      </div>
    </div>
  )
}

function FullTicket({ formatUSD }: { formatUSD: string }) {
  const navigate = useNavigate()

  // Progreso del corte (0 = arriba, 1 = abajo del todo) y estado del ticket.
  const [progress, setProgress] = useState(0)
  const [cut, setCut] = useState(false)
  // Mientras se arrastra no hay transición (la tijera sigue al dedo); al soltar/auto sí.
  const [smooth, setSmooth] = useState(true)

  // Alto de la perforación, para dibujar el borde rasgado a escala real.
  const [trackH, setTrackH] = useState(0)

  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const dragStart = useRef({ y: 0, p: 0, moved: false })

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setTrackH(el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const tornWidth = 14
  const tornPath = buildTornPath(trackH, tornWidth)

  const finishCut = () => {
    setSmooth(true)
    setProgress(1)
    setCut(true)
    // Esperá a que termine la animación de corte antes de navegar.
    window.setTimeout(() => navigate(MYSTERY_BOX_PATH), 700)
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (cut) return
    draggingRef.current = true
    dragStart.current = { y: e.clientY, p: progress, moved: false }
    setSmooth(false)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!draggingRef.current || cut) return
    const h = trackRef.current?.clientHeight ?? 1
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dy) > 4) dragStart.current.moved = true
    const next = Math.max(0, Math.min(1, dragStart.current.p + dy / h))
    setProgress(next)
    if (next >= 0.97) {
      draggingRef.current = false
      finishCut()
    }
  }

  const onPointerUp = () => {
    if (!draggingRef.current || cut) return
    draggingRef.current = false
    if (!dragStart.current.moved) {
      // Tap simple: corte automático (la tijera baja sola).
      finishCut()
    } else if (progress < 0.97) {
      // Soltó antes de terminar: el ticket "se salva" y vuelve arriba.
      setSmooth(true)
      setProgress(0)
    }
  }

  const cutTransition = smooth ? 'top 500ms cubic-bezier(.4,0,.2,1), height 500ms cubic-bezier(.4,0,.2,1)' : 'none'

  return (
    <div className="relative font-mono select-none">

      {/* Halos */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#d4af37]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#d4af37]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative rounded-xl sm:rounded-2xl border border-[#d4af37] overflow-hidden">

        {/* Fondo dorado */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f3e6b3] via-[#d4af37] to-[#fff8e6]" />

        {/* Sol de Mayo */}
        <SolDeMayo size={320} opacity={0.08} />

        {/* Guilloche pattern */}
        <GuillochePattern />

        {/* Franjas blancas (bandera argentina) */}
        <div className="absolute top-0 left-0 right-16 sm:right-28 h-1 sm:h-1.5 bg-white" />
        <div className="absolute bottom-0 left-0 right-16 sm:right-28 h-1 sm:h-1.5 bg-white" />

        <div className="relative flex items-stretch text-[#21313f]">

          {/* === CUERPO PRINCIPAL === */}
          <div className="flex-1 p-4 sm:p-7 pt-5 sm:pt-8 min-w-0">

            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
              <div
                aria-hidden
                className="h-7 sm:h-10 opacity-70 shrink-0"
                style={{
                  aspectRatio: '318 / 390',
                  backgroundColor: 'rgb(32 49 63)',
                  WebkitMaskImage: 'url(/SWC-logo.png)',
                  maskImage: 'url(/SWC-logo.png)',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
              <div className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-80">
                Startup World Cup · Argentina 2026
              </div>
            </div>

            {/* Premio - protagonista */}
            <div className="relative border-y-2 border-dashed border-[#0f172b]/40 py-3 sm:py-5 my-1 sm:my-2">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <SolDeMayo size={180} opacity={0.22} />
              </div>

              <div className="relative">
                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-70 mb-1">
                  Premio Final
                </div>
                <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                  <span className="text-xl sm:text-3xl font-black opacity-70 leading-none">USD</span>
                  <span className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none drop-shadow-[0_2px_0_rgba(255,255,255,0.5)]">
                    {formatUSD}
                  </span>
                </div>
              </div>
            </div>

            {/* Fecha + Venue */}
            <div className="flex items-start justify-between mt-3 sm:mt-5 gap-2">
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-60">Fecha</div>
                <div className="text-xs sm:text-sm font-black mt-0.5 truncate">07·08·2026</div>
              </div>
              <div className="text-right min-w-0">
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] opacity-60">Venue</div>
                <div className="text-xs sm:text-sm font-black mt-0.5 truncate">BUENOS AIRES</div>
              </div>
            </div>
          </div>

          {/* === PERFORACIÓN === */}
          <div
            ref={trackRef}
            className="relative w-3 sm:w-5 bg-[#d4af37] border-l-2 border-dashed border-[#0f172b]/50 flex-shrink-0"
          >
            <div className="absolute -top-1.5 sm:-top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-5 sm:h-5 bg-[#0f172b] rounded-full" />
            <div className="absolute -bottom-1.5 sm:-bottom-2.5 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-5 sm:h-5 bg-[#0f172b] rounded-full" />

            {/* Borde rasgado que se revela a medida que baja la tijera (solo mobile) */}
            <div
              aria-hidden
              className="sm:hidden absolute top-0 left-1/2 -translate-x-1/2 overflow-hidden z-10 pointer-events-none"
              style={{
                width: tornWidth,
                height: `calc(${progress} * (100% - 28px) + 14px)`,
                transition: cutTransition,
              }}
            >
              <svg width={tornWidth} height={trackH} viewBox={`0 0 ${tornWidth} ${trackH}`} className="block">
                {/* realce claro = grosor del papel */}
                <path d={tornPath} fill="none" stroke="#fff8e6" strokeWidth="2.6" strokeLinejoin="round" strokeOpacity="0.65" />
                {/* línea del corte */}
                <path d={tornPath} fill="none" stroke="#0f172b" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Tijera arrastrable que tijeretea mientras baja (solo mobile) */}
            <button
              type="button"
              aria-label="Deslizá la tijera para cortar el ticket"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`sm:hidden absolute left-1/2 -translate-x-1/2 z-20 grid place-items-center w-7 h-7 rounded-full bg-[#0f172b] text-[#f3e6b3] shadow-lg touch-none cursor-grab active:cursor-grabbing ${
                progress === 0 && !cut ? 'animate-pulse' : ''
              }`}
              style={{ top: `calc(${progress} * (100% - 28px))`, transition: cutTransition }}
            >
              <span
                className="grid place-items-center"
                style={{ animation: progress > 0 ? 'ticket-snip 170ms ease-in-out infinite' : undefined }}
              >
                <ScissorsIcon size={15} />
              </span>
            </button>
          </div>

          {/* === STUB === */}
          <div
            className="relative w-16 sm:w-28 bg-gradient-to-b from-[#d4af37] via-[#d4af37] to-[#ffffff] flex flex-col items-center justify-center p-2 sm:p-4 text-center gap-2 sm:gap-4 flex-shrink-0"
            style={
              cut
                ? {
                    // El recorte se desprende y cae con gravedad.
                    animation: 'ticket-fall 700ms cubic-bezier(.45,.05,.55,.95) forwards',
                    transformOrigin: 'top center',
                    boxShadow: '-8px 0 12px -6px rgba(0,0,0,0.35)',
                  }
                : {
                    // Mientras se corta, el papel se separa apenas (sin transición durante el drag).
                    transform: `translateX(${(progress * 4).toFixed(1)}px)`,
                    transition: smooth ? 'transform 500ms cubic-bezier(.4,0,.2,1)' : 'none',
                  }
            }
          >
            <GuillochePattern />

            <div className="relative sm:hidden">
              <HolographicSeal size={32} />
            </div>
            <div className="relative hidden sm:block">
              <HolographicSeal size={52} />
            </div>

            {/* Mobile: cartel "NO CORTAR" (la acción real es arrastrar la tijera) */}
            <div className="relative sm:hidden">
              <NoCutSign />
            </div>
            {/* Desktop: QR escaneable a la Mystery Box */}
            <div className="relative bg-white p-1 rounded border border-[#0f172b]/40 hidden sm:block">
              <QRCode size={44} />
            </div>

            <div className="relative">
              <div className="text-[10px] sm:text-base font-black tracking-widest">AR · 26</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------- componente principal -------- */

export function WorldCupTicket({ variant = 'full' }: { variant?: Variant }) {
  const premio = content.config.evento.premioUSD
  const formatUSD = new Intl.NumberFormat('en-US').format(premio)

  if (variant === 'compact') {
    return <CompactTicket formatUSD={formatUSD} />
  }

  return <FullTicket formatUSD={formatUSD} />
}

export default WorldCupTicket
