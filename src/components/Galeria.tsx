import { useEffect, useState } from 'react'

/**
 * Galería tipo "afterparty": muro de fotos en filas que scrollean en sentidos
 * opuestos. Al clickear una foto se abre un lightbox con opciones para compartir
 * en redes (compartir nativo / WhatsApp / X / Facebook / copiar link).
 *
 * Fotos reales en /public/galeria (foto-01.jpg … foto-55.jpg).
 */

const PHOTO_COUNT = 55
const ALL = Array.from({ length: PHOTO_COUNT }, (_, i) => `/galeria/foto-${String(i + 1).padStart(2, '0')}.jpg`)
const third = Math.ceil(ALL.length / 3)
const ROW_A = ALL.slice(0, third)
const ROW_B = ALL.slice(third, third * 2)
const ROW_C = ALL.slice(third * 2)

const SITE = typeof window !== 'undefined' ? window.location.origin : ''
const SHARE_TEXT = 'Startup World Cup Argentina'

/* -------- short links (sin backend) --------
 * Hash (FNV-1a) del path → semilla de un PRNG (xorshift32) que emite N letras
 * a–z → /?g=<code> (ej. "/?g=qmraktbvdxls"). Código opaco, solo-texto y del
 * largo que se quiera. Como no es reversible, resolvemos con tabla code→src. */
const CODE_LEN = 12
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
const shortLink = (src: string) => `${SITE}/?g=${codeFromSrc(src)}`

/* -------- íconos clásicos -------- */
const ShareIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.518 5.26l-.999 3.648 3.97-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
)
const XIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
            className="h-44 sm:h-60 lg:h-64 w-auto rounded-2xl select-none shadow-xl shadow-black/40 ring-1 ring-white/5 transition-transform duration-300 hover:scale-[1.03]"
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

  const wa = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${abs}`)}`
  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(abs)}&text=${encodeURIComponent(SHARE_TEXT)}`

  const iconBtn =
    'grid place-items-center w-11 h-11 rounded-full transition-colors cursor-pointer'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto del evento"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-[fade-in_200ms_ease-out]"
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

      {/* Foto centrada en el viewport (el click no cierra) */}
      <img
        src={src}
        alt="Foto del evento Startup World Cup Argentina"
        onClick={e => e.stopPropagation()}
        className="max-h-[80vh] max-w-[92vw] w-auto rounded-2xl shadow-2xl shadow-black/60 object-contain"
      />

      {/* Barra de compartir (íconos) — flota abajo, no descentra la foto */}
      <div
        onClick={e => e.stopPropagation()}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 rounded-full bg-black/40 backdrop-blur-sm px-3 py-2"
      >
        {canNativeShare && (
          <button type="button" onClick={shareNative} aria-label="Compartir" title="Compartir" className={`${iconBtn} bg-[#75AADB] hover:bg-[#5a93c5] text-white`}>
            <ShareIcon />
          </button>
        )}
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Compartir por WhatsApp" title="WhatsApp" className={`${iconBtn} bg-[#25D366] hover:brightness-110 text-white`}>
          <WhatsAppIcon />
        </a>
        <a href={x} target="_blank" rel="noopener noreferrer" aria-label="Compartir en X" title="X" className={`${iconBtn} bg-white/10 hover:bg-white/20 text-white`}>
          <XIcon />
        </a>
        <button type="button" onClick={copyLink} aria-label={copied ? 'Link copiado' : 'Copiar link'} title={copied ? '¡Copiado!' : 'Copiar link'} className={`${iconBtn} ${copied ? 'bg-[#25D366] text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>
      </div>
    </div>
  )
}

function Galeria() {
  const [open, setOpen] = useState<string | null>(null)

  // Si llegan con un short link (/?g=<code>), abrir esa foto y limpiar la URL.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('g')
    if (!code) return
    const src = srcFromCode(code)
    if (!src) return
    setOpen(src)
    const url = new URL(window.location.href)
    url.searchParams.delete('g')
    window.history.replaceState({}, '', url.pathname + url.search + '#galeria')
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

      {/* Muro de fotos (filas rectas) */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <Strip imgs={ROW_A} duration="62s" onOpen={setOpen} />
        <Strip imgs={ROW_B} reverse duration="54s" onOpen={setOpen} />
        <Strip imgs={ROW_C} duration="70s" onOpen={setOpen} />
      </div>

      {/* fades laterales para que las fotos "entren/salgan" suave */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#020618] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#020618] to-transparent z-10" />

      {open && <Lightbox src={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

export default Galeria
