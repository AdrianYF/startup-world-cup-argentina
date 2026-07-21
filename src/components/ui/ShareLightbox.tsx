import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Lightbox con barra de compartir (nativo / X / LinkedIn / copiar link).
 * Lo usan la galería y el comité de selección.
 */

/** Abre una URL en una ventana pop-up centrada (UX típica de "compartir"). */
function openSharePopup(url: string) {
  const w = 600
  const h = 640
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2)
  window.open(url, 'compartir', `width=${w},height=${h},left=${left},top=${top},noopener,noreferrer`)
}

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

type Props = {
  /** Imagen que se muestra en grande (puede diferir de la que linkea el short link). */
  src: string
  alt: string
  /** Label del diálogo para lectores de pantalla. */
  ariaLabel: string
  /** URL que se comparte (short link /swc/<CODE>). */
  shareUrl: string
  /** Texto del compartir nativo. */
  shareText: string
  /** Texto del tweet (X permite prellenarlo; LinkedIn no). */
  tweetText: string
  /** Eyebrow opcional (ej. "CREW · SWC AR 26 / ID V-001") arriba del título. */
  eyebrow?: string
  /** Título opcional (ej. nombre de la startup) mostrado al costado al hacer zoom. */
  titulo?: string
  /** Bio / descripción opcional que se muestra bajo la imagen al hacer zoom. */
  descripcion?: string
  onClose: () => void
}

export function ShareLightbox({ src, alt, ariaLabel, shareUrl, shareText, tweetText, eyebrow, titulo, descripcion, onClose }: Props) {
  const [copied, setCopied] = useState(false)
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
      await navigator.share({ url: shareUrl, text: shareText })
    } catch {
      /* cancelado */
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* sin clipboard */
    }
  }

  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  const iconBtn = 'grid place-items-center w-11 h-11 rounded-full transition-colors cursor-pointer'

  // Portal a <body>: el lightbox escapa del stacking context de FadeInSection y
  // cubre todo (incluido el navbar) — sin eso el navbar queda por encima.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
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

      {/* Imagen + nombre y bio al costado (apilado en mobile). */}
      <div
        className={`flex items-center justify-center gap-4 sm:gap-6 ${
          eyebrow || titulo || descripcion ? 'flex-col sm:flex-row' : 'flex-col'
        }`}
      >
        {/* La imagen en grande (el click no cierra) */}
        <img
          src={src}
          alt={alt}
          onClick={e => e.stopPropagation()}
          className="block max-h-[62vh] max-w-[90vw] sm:max-w-md w-auto rounded-2xl shadow-2xl shadow-black/60 object-contain"
        />

        {/* Eyebrow + nombre + bio (al hacer zoom) */}
        {(eyebrow || titulo || descripcion) && (
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[90vw] sm:w-72 sm:max-w-xs text-left"
          >
            {eyebrow && (
              <p className="pl-4 text-[#75AADB] text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] mb-2">
                {eyebrow}
              </p>
            )}
            {titulo && (
              // fontFamily inline: la regla sin capa de index.css para h1-h6 fuerza
              // el sans y le gana a la utility font-serif de Tailwind (layered).
              <h2
                style={{ fontFamily: '"Fraunces", ui-serif, Georgia, serif' }}
                className="pl-4 text-white text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4"
              >
                {titulo}
              </h2>
            )}
            {descripcion && (
              <blockquote className="relative px-4 pt-8">
                <span
                  aria-hidden
                  className="absolute left-0 top-0 font-serif text-6xl leading-none text-[#75AADB]/50 select-none"
                >
                  &ldquo;
                </span>
                <p className="font-serif italic text-gray-100 text-base sm:text-lg leading-relaxed">
                  {descripcion}
                </p>
              </blockquote>
            )}
          </div>
        )}
      </div>

      {/* Barra de compartir (íconos) — justo debajo de la imagen */}
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

export default ShareLightbox
