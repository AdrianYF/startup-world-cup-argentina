import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../lib/content'
import { ShareLightbox } from '../components/ui/ShareLightbox'
import { codeTable, codeFromUrl, shortLink } from '../lib/shortlink'

/**
 * Página dedicada con las startups seleccionadas. Cada card es una figurita
 * (imagen) compartible: click → lightbox con compartir nativo / X / LinkedIn /
 * copiar link, y su propio short link opaco /swc/<CODE> (OG en api/og.js, que
 * redirige a /startups?s=<CODE>).
 */

const BG = '#020618'
const SURFACE = '#0f172b'

type Startup = (typeof content.startups)[number]

// Mismo código opaco que la galería y el comité (FNV-1a → xorshift32 → base26),
// sobre la imagen de cada card. No colisiona con las otras secciones (verificado).
const STARTUP_POR_CODE = codeTable(content.startups.map(s => s.img))

if (import.meta.env.DEV && Object.keys(STARTUP_POR_CODE).length !== content.startups.length) {
  console.warn('[Startups] colisión de códigos entre startups: revisá los slugs/imágenes en startups.json')
}

/**
 * Si llegan con un short link (/startups?s=<CODE>), la card que hay que abrir.
 * Se resuelve una sola vez al cargar el módulo, antes de que el efecto limpie la
 * URL: leerlo más tarde (en un re-mount de StrictMode) ya daría null.
 */
const STARTUP_DEL_LINK: Startup | null = (() => {
  const code = codeFromUrl('s')
  if (!code) return null
  const img = STARTUP_POR_CODE[code.toUpperCase()]
  return img ? content.startups.find(s => s.img === img) ?? null : null
})()

const alt = (nombre: string) => `${nombre} — Startup seleccionada · Startup World Cup Argentina 2026`

function StartupsPage() {
  const startups = content.startups
  const [open, setOpen] = useState<Startup | null>(STARTUP_DEL_LINK)

  useEffect(() => {
    if (STARTUP_DEL_LINK) {
      // Llegó por short link: limpiar la URL para que un refresh no reabra sola.
      window.history.replaceState({}, '', '/startups')
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>
      {/* Header */}
      <header className="relative" style={{ backgroundColor: SURFACE }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
          <Link
            to="/#startups"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#75AADB] text-sm font-bold uppercase tracking-widest transition-colors mb-8"
          >
            ← Volver al sitio
          </Link>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase mb-4">
            <span className="text-white">STARTUPS </span>
            <span className="text-[#75AADB]">SELECCIONADAS</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Las startups elegidas que compiten en la Startup World Cup Argentina.
            Tocá una card para compartirla.
          </p>

          <div className="mt-6 flex items-baseline gap-2 text-gray-400 text-xs uppercase tracking-[0.25em] font-bold">
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{startups.length}</span>
            <span>startups seleccionadas</span>
          </div>
        </div>
      </header>

      {/* Grilla completa */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {startups.map(s => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setOpen(s)}
              aria-label={`Ver la card de ${s.nombre} y compartirla`}
              className="block w-full cursor-zoom-in rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#75AADB]"
            >
              <img
                src={s.img}
                alt={alt(s.nombre)}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="w-full h-auto block rounded-2xl select-none transition-transform duration-300 hover:scale-[1.03] hover:-translate-y-1"
              />
            </button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/#startups"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-bold uppercase tracking-wide text-sm transition-[transform,background-color]"
          >
            Volver al sitio
          </Link>
        </div>
      </main>

      {open && (
        <ShareLightbox
          src={open.img}
          alt={alt(open.nombre)}
          ariaLabel={`Card de ${open.nombre}`}
          shareUrl={shortLink(open.img)}
          shareText={`${open.nombre} — Startup seleccionada · Startup World Cup Argentina`}
          tweetText={`${open.nombre} es una de las startups seleccionadas de la Startup World Cup Argentina\n@StartupWC_arg @StartupGrindBA`}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}

export default StartupsPage
