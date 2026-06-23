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
  const abs = SITE + src
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
      // Intentar compartir el archivo (mejor en mobile); si no, compartir el link.
      const res = await fetch(src)
      const blob = await res.blob()
      const file = new File([blob], src.split('/').pop() || 'foto.jpg', { type: blob.type })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: SHARE_TEXT })
        return
      }
    } catch {
      /* sigue al fallback de link */
    }
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
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(abs)}`

  const pill =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors cursor-pointer'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto del evento"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-sm p-4 animate-[fade-in_200ms_ease-out]"
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

      {/* Foto (el click no cierra) */}
      <img
        src={src}
        alt="Foto del evento Startup World Cup Argentina"
        onClick={e => e.stopPropagation()}
        className="max-h-[72vh] max-w-[92vw] w-auto rounded-2xl shadow-2xl shadow-black/60 object-contain"
      />

      {/* Barra de compartir */}
      <div onClick={e => e.stopPropagation()} className="flex flex-wrap items-center justify-center gap-2.5">
        {canNativeShare && (
          <button type="button" onClick={shareNative} className={`${pill} bg-[#75AADB] hover:bg-[#5a93c5] text-white`}>
            Compartir
          </button>
        )}
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${pill} bg-[#25D366] hover:brightness-110 text-white`}>
          WhatsApp
        </a>
        <a href={x} target="_blank" rel="noopener noreferrer" className={`${pill} bg-white/10 hover:bg-white/20 text-white`}>
          X
        </a>
        <a href={fb} target="_blank" rel="noopener noreferrer" className={`${pill} bg-[#1877F2] hover:brightness-110 text-white`}>
          Facebook
        </a>
        <button type="button" onClick={copyLink} className={`${pill} bg-white/10 hover:bg-white/20 text-white`}>
          {copied ? '¡Copiado!' : 'Copiar link'}
        </button>
      </div>
    </div>
  )
}

function Galeria() {
  const [open, setOpen] = useState<string | null>(null)

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
