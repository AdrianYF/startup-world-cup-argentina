import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Galería tipo "afterparty": muro de fotos en filas que scrollean en sentidos
 * opuestos. Al clickear una foto se abre un lightbox con opciones para compartir
 * en redes (compartir nativo / WhatsApp / X / Facebook / copiar link).
 *
 * Fotos reales en /public/galeria (foto-01.jpg … foto-55.jpg).
 */

// Dos filas: r1-* (Fotos Seleccionadas 3) arriba, r2-* (Fotos seleccionadas) abajo.
// Mantener ROW1_COUNT/ROW2_COUNT en sync con /public/galeria y con api/og.js.
const ROW1_COUNT = 39
const ROW2_COUNT = 36
const pad = (n: number) => String(n).padStart(2, '0')
const R1 = Array.from({ length: ROW1_COUNT }, (_, i) => `/galeria/r1-${pad(i + 1)}.jpg`)
const R2 = Array.from({ length: ROW2_COUNT }, (_, i) => `/galeria/r2-${pad(i + 1)}.jpg`)
// Diccionario de short links: el orden no importa (el código sale del path).
const ALL = [...R1, ...R2]

// Shuffle (Fisher-Yates) por fila, una vez por carga: cada fila mezcla SUS propias
// fotos (no se mezclan las carpetas). No afecta los short links (salen del path).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const ROW_A = shuffle(R1)
const ROW_B = shuffle(R2)

/** Abre una URL en una ventana pop-up centrada (UX típica de "compartir"). */
function openSharePopup(url: string) {
  const w = 600
  const h = 640
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2)
  window.open(url, 'compartir', `width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`)
}

const SITE = typeof window !== 'undefined' ? window.location.origin : ''
const SHARE_TEXT = 'Startup World Cup Argentina'
const TWEET_TEXT = 'Yo también participo de la Startup World Cup Argentina\n@StartupWC_arg @StartupGrindBA'

/* -------- short links (sin backend) --------
 * Hash (FNV-1a) del path → semilla de un PRNG (xorshift32) que emite N letras
 * a–z → /?g=<code> (ej. "/?g=qmraktbvdxls"). Código opaco, solo-texto y del
 * largo que se quiera. Como no es reversible, resolvemos con tabla code→src. */
const CODE_LEN = 6
function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
function codeFromSrc(src: string): string {
  let h = fnv1a(src) || 1
  let out = ''
  for (let i = 0; i < CODE_LEN; i++) {
    // xorshift32 para más entropía que los 32 bits del hash
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    h >>>= 0
    out += String.fromCharCode(65 + (h % 26)) // A–Z
  }
  return out
}
const SRC_BY_CODE: Record<string, string> = Object.fromEntries(ALL.map(s => [codeFromSrc(s), s]))
const srcFromCode = (code: string) => SRC_BY_CODE[code.toUpperCase()] ?? null
/** Link minimizado con ruta propia: /swc/<CODE> (ruta en main.tsx + OG en /api/og). */
const shortLink = (src: string) => `${SITE}/swc/${codeFromSrc(src)}`

/* -------- íconos clásicos -------- */
const ShareIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const XIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.5H5.67V18h2.67V9.5zM7 5.75a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zM18.34 18v-4.66c0-2.49-1.33-3.65-3.1-3.65-1.43 0-2.07.79-2.43 1.34V9.5h-2.67V18h2.67v-4.39c0-.23.02-.46.09-.63.18-.46.6-.94 1.3-.94.92 0 1.29.7 1.29 1.72V18h2.66z" />
  </svg>
)
const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

function Strip({
  imgs,
  reverse = false,
  duration = '60s',
  onOpen,
}: {
  imgs: string[]
  reverse?: boolean
  duration?: string
  onOpen: (src: string) => void
}) {
  // Duplicamos la lista para que el loop a -50% sea perfecto.
  const loop = [...imgs, ...imgs]
  return (
    <div
      className="marquee-track flex w-max gap-4 sm:gap-6"
      style={{ animationDuration: duration, animationDirection: reverse ? 'reverse' : 'normal' }}
    >
      {loop.map((src, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onOpen(src)}
          aria-label="Ver foto y compartir"
          className="shrink-0 cursor-zoom-in rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#75AADB]"
        >
          <img
            src={src}
            alt="Foto del evento Startup World Cup Argentina"
            loading="lazy"
            draggable={false}
            className="h-52 sm:h-64 lg:h-72 w-auto rounded-2xl select-none shadow-xl shadow-black/40 ring-1 ring-white/5 transition-[transform,filter] duration-300 ease-out hover:brightness-105 hover:scale-[1.04] hover:shadow-2xl hover:shadow-[#75AADB]/20"
          />
        </button>
      ))}
    </div>
  )
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const abs = shortLink(src)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const shareNative = async () => {
    try {
      await navigator.share({ url: abs, text: SHARE_TEXT })
    } catch {
      /* cancelado */
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(abs)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* sin clipboard */
    }
  }

  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(abs)}&text=${encodeURIComponent(TWEET_TEXT)}`
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(abs)}`

  const iconBtn =
    'grid place-items-center w-11 h-11 rounded-full transition-colors cursor-pointer'

  // Portal a <body>: el lightbox escapa del stacking context de FadeInSection y
  // cubre todo (incluido el navbar) — sin eso el navbar queda por encima.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto del evento"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/85 backdrop-blur-sm px-4 py-10 animate-[fade-in_200ms_ease-out]"
    >
      {/* Cerrar */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl cursor-pointer"
      >
        ✕
      </button>

      {/* Foto centrada en el viewport con marca de agua (el click no cierra) */}
      <div className="relative" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt="Foto del evento Startup World Cup Argentina"
          className="block max-h-[72vh] max-w-[90vw] sm:max-w-2xl w-auto rounded-2xl shadow-2xl shadow-black/60 object-contain"
        />
        {/* Marca de agua: lockup del navbar (SWC · Argentina 26 · | · Startup Grind), translúcido y sin sombra */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 opacity-60"
        >
          <span className="flex items-baseline gap-1.5">
            <span className="font-black text-white leading-none tracking-tight text-base sm:text-lg">SWC</span>
            <span className="text-white font-bold uppercase tracking-[0.2em] leading-none text-[8px] sm:text-[10px]">
              Argentina 26
            </span>
          </span>
          <span className="text-white/40 font-light leading-none text-base sm:text-lg">|</span>
          <img
            src="/SGBA-logo.png"
            alt=""
            className="h-7 sm:h-9 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </div>

      {/* Barra de compartir (íconos) — justo debajo de la foto */}
      <div
        onClick={e => e.stopPropagation()}
        className="flex items-center justify-center gap-3 rounded-full bg-black/40 backdrop-blur-sm px-3 py-2"
      >
        {canNativeShare && (
          <button type="button" onClick={shareNative} aria-label="Compartir" title="Compartir" className={`${iconBtn} bg-[#75AADB] hover:bg-[#5a93c5] text-white`}>
            <ShareIcon />
          </button>
        )}
        <a href={x} target="_blank" rel="noopener noreferrer" aria-label="Compartir en X" title="X" className={`${iconBtn} bg-white/10 hover:bg-white/20 text-white`}>
          <XIcon />
        </a>
        <button type="button" onClick={() => openSharePopup(li)} aria-label="Compartir en LinkedIn" title="LinkedIn" className={`${iconBtn} bg-[#0A66C2] hover:brightness-110 text-white`}>
          <LinkedInIcon />
        </button>
        <button type="button" onClick={copyLink} aria-label={copied ? 'Link copiado' : 'Copiar link'} title={copied ? '¡Copiado!' : 'Copiar link'} className={`${iconBtn} ${copied ? 'bg-[#25D366] text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
      </div>
    </div>,
    document.body,
  )
}

function Galeria() {
  const [open, setOpen] = useState<string | null>(null)

  // Si llegan con un short link (ruta /g/<code> o ?g=<code>), abrir esa foto y limpiar la URL.
  useEffect(() => {
    const fromPath = window.location.pathname.match(/^\/(?:swc|g)\/([A-Za-z]+)\/?$/i)
    const code = fromPath ? fromPath[1] : new URLSearchParams(window.location.search).get('g')
    if (!code) return
    const src = srcFromCode(code)
    if (!src) return
    setOpen(src)
    window.history.replaceState({}, '', '/#galeria')
    document.getElementById('galeria')?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <section id="galeria" className="relative py-20 sm:py-28 bg-[#020618] text-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 text-center mb-20 sm:mb-28">
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95]">
          <span className="text-white">LA </span>
          <span className="text-[#75AADB]">GALERÍA</span>
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-4">
          Viví la experiencia Startup World Cup Argentina.
        </p>
      </div>

      {/* Muro de fotos: dos filas en sentidos opuestos */}
      <div className="flex flex-col gap-5 sm:gap-7">
        <Strip imgs={ROW_A} duration="80s" onOpen={setOpen} />
        <Strip imgs={ROW_B} reverse duration="70s" onOpen={setOpen} />
      </div>

      {/* fades laterales para que las fotos "entren/salgan" suave */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#020618] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#020618] to-transparent z-10" />

      {open && <Lightbox src={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

export default Galeria
