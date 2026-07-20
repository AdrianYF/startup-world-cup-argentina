import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../lib/content'
import { ShareLightbox } from '../components/ui/ShareLightbox'
import { DeckGrid } from '../components/ui/DeckGrid'
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

// Grupos de la selección, en orden de aparición. Cada startup trae su `grupo`.
const GRUPOS: { key: string; nombre: string; dia: string }[] = [
  { key: 'pitch-battle', nombre: 'Pitch Battle', dia: '7 de agosto' },
  { key: 'builders-arena', nombre: 'Builders Arena', dia: '6 de agosto' },
]

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

/** Card (figurita) clickeable que abre el lightbox para compartir. */
function StartupCard({ s, onOpen }: { s: Startup; onOpen: (s: Startup) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(s)}
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
  )
}

const GRID_CLASS = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4'
const GRID_COLS = { base: 3, sm: 4, md: 5, lg: 6 }
const GRID_GAP = { base: 12, sm: 16 }

/** Grilla de un grupo, con reparto de mazo en 3D al entrar en viewport. */
function GrillaConReparto({ items, onOpen }: { items: Startup[]; onOpen: (s: Startup) => void }) {
  return (
    <DeckGrid
      images={items.map(s => s.img)}
      gridClass={GRID_CLASS}
      columns={GRID_COLS}
      gap={GRID_GAP}
    >
      {items.map(s => (
        <StartupCard key={s.slug} s={s} onOpen={onOpen} />
      ))}
    </DeckGrid>
  )
}

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

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase">
            <span className="text-white">STARTUPS </span>
            <span className="text-[#75AADB]">SELECCIONADAS</span>
          </h1>
        </div>
      </header>

      {/* Grupos: Pitch Battle (10) y Builders Arena (14) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {GRUPOS.map(g => {
          const items = startups.filter(s => (s as { grupo?: string }).grupo === g.key)
          if (!items.length) return null
          return (
            <section key={g.key} className="mb-14 sm:mb-20 last:mb-0">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-4xl font-black uppercase leading-tight">
                  <span className="text-white">Selección </span>
                  <span className="text-[#75AADB]">{g.nombre}</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">
                  Startup World Cup · {g.dia}
                </p>
              </div>
              <GrillaConReparto items={items} onOpen={setOpen} />
            </section>
          )
        })}

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
