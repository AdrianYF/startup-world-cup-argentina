import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
// Directo desde content/: sólo lo usa esta ruta, así queda en su propio chunk.
import startupsJson from '../content/startups.json'
import { PageLayout } from '../components/ui/PageLayout'
import { FadeInSection } from '../components/ui/FadeInSection'
import Startups from '../components/Startups'
import Comite from '../components/Comite'
import { ShareLightbox } from '../components/ui/ShareLightbox'
import { DeckGrid } from '../components/ui/DeckGrid'
import { codeTable, codeFromUrl, shortLink } from '../lib/shortlink'

const BG = '#020618'

type Startup = (typeof startupsJson)[number]

const GRUPOS: { key: string; nombre: string }[] = [
  { key: 'pitch-battle', nombre: 'Pitch Battle' },
  { key: 'builders-arena', nombre: 'Builders Arena' },
]

const STARTUP_POR_CODE = codeTable(startupsJson.map(s => s.img))

if (import.meta.env.DEV && Object.keys(STARTUP_POR_CODE).length !== startupsJson.length) {
  console.warn('[Startups] colisión de códigos entre startups: revisá los slugs/imágenes en startups.json')
}

/**
 * La startup que pide la URL, si pide alguna.
 *
 * Es una función y no una constante de módulo a propósito. Como constante se
 * evaluaba una sola vez, al importar el chunk: alcanzaba cuando el único camino
 * era pegar `/swc/<code>` en la barra, pero desde el podio del blog se llega
 * navegando dentro de la SPA, y la segunda vez el chunk ya estaba cargado — el
 * valor era el de la primera visita y abría la card equivocada.
 */
function startupDelLink(): Startup | null {
  const code = codeFromUrl('s')
  if (!code) return null
  const img = STARTUP_POR_CODE[code.toUpperCase()]
  return img ? startupsJson.find(s => s.img === img) ?? null : null
}

const alt = (nombre: string) => `${nombre} — Startup seleccionada · Startup World Cup Argentina 2026`

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
        className="w-full aspect-[1080/1350] object-cover block rounded-2xl select-none transition-transform duration-300 hover:scale-[1.03] hover:-translate-y-1"
      />
      <span className="mt-2 block text-center text-white text-xs sm:text-sm font-bold uppercase tracking-wide truncate">
        {s.nombre}
      </span>
    </button>
  )
}

const GRID_CLASS = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4'
const GRID_COLS = { base: 3, sm: 4, md: 5, lg: 6 }
const GRID_GAP = { base: 12, sm: 16 }

function GrillaConReparto({ items, onOpen }: { items: Startup[]; onOpen: (s: Startup) => void }) {
  return (
    <DeckGrid gridClass={GRID_CLASS} columns={GRID_COLS} gap={GRID_GAP}>
      {items.map(s => (
        <StartupCard key={s.slug} s={s} onOpen={onOpen} />
      ))}
    </DeckGrid>
  )
}

function Seleccion() {
  const startups = startupsJson
  // En el estado inicial y no en un efecto: el código ya está en la URL en el
  // primer render, así que la card abre sin un frame de parpadeo. Que se vuelva
  // a leer en cada navegación lo resuelve el `key` de arriba, no un setState.
  const [open, setOpen] = useState<Startup | null>(startupDelLink)

  useEffect(() => {
    // Llegó por link: limpiar la URL para que un refresh no reabra sola.
    if (codeFromUrl('s')) window.history.replaceState({}, '', '/startups')
  }, [])

  return (
    <section id="seleccion" className="relative py-16 sm:py-24" style={{ backgroundColor: BG }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase">
            <span className="text-white">STARTUPS </span>
            <span className="text-[#75AADB]">SELECCIONADAS</span>
          </h2>
        </div>

        {GRUPOS.map(g => {
          const items = startups.filter(s => (s as { grupo?: string }).grupo === g.key)
          if (!items.length) return null
          return (
            <div key={g.key} className="mb-14 sm:mb-20 last:mb-0">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-4xl font-black uppercase leading-tight">
                  <span className="text-white">Selección </span>
                  <span className="text-[#75AADB]">{g.nombre}</span>
                </h3>
              </div>
              <GrillaConReparto items={items} onOpen={setOpen} />
            </div>
          )
        })}
      </div>

      {open && (
        <ShareLightbox
          src={open.img}
          alt={alt(open.nombre)}
          ariaLabel={`Card de ${open.nombre}`}
          shareUrl={shortLink(open.img)}
          shareText={`${open.nombre} — Startup seleccionada · Startup World Cup Argentina`}
          tweetText={`${open.nombre} es una de las startups seleccionadas de la Startup World Cup Argentina\n@StartupWC_arg @StartupGrindBA`}
          titulo={open.nombre}
          descripcion={open.descripcion}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}

function StartupsPage() {
  const { search } = useLocation()
  return (
    <PageLayout>
      <FadeInSection>
        <Startups />
      </FadeInSection>
      <FadeInSection>
        <Comite />
      </FadeInSection>
      <FadeInSection>
        {/* `key` con la query: llegar de nuevo con otro `?s=` reinicia el estado
            de la sección y la card correcta abre desde el primer render. Sin
            esto, el valor inicial era el de la primera visita al chunk. */}
        <Seleccion key={search} />
      </FadeInSection>
    </PageLayout>
  )
}

export default StartupsPage
