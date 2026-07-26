import { useEffect, useState } from 'react'
import { content } from '../lib/content'
import { ShareLightbox } from './ui/ShareLightbox'
import { DeckGrid } from './ui/DeckGrid'
import { codeTable, codeFromUrl, shortLink } from '../lib/shortlink'

/**
 * Comité de Selección — grid de figuritas (cards ya renderizadas como imagen).
 * Al clickear una card se abre el lightbox con las opciones de compartir, igual
 * que la galería: cada card tiene su short link opaco /swc/<CODE> (OG en api/og.js).
 * Mobile: preview de MOBILE_PREVIEW + "Ver todo". Desktop: grid completo.
 */

const BG = '#020618'
const MOBILE_PREVIEW = 6

type Miembro = (typeof content.comite)[number]

// Mismo código opaco que la galería (FNV-1a → xorshift32 → base26), pero sobre la
// imagen de cada card. No colisiona con los códigos de la galería (verificado).
const MIEMBRO_POR_CODE = codeTable(content.comite.map(m => m.img))

// Guard de dev: si al sumar un miembro dos imágenes dan el mismo código, uno
// pisaría al otro en la tabla y su link abriría la card equivocada. Avisar.
if (import.meta.env.DEV && Object.keys(MIEMBRO_POR_CODE).length !== content.comite.length) {
  console.warn('[Comite] colisión de códigos entre miembros: revisá los slugs/imágenes en comite.json')
}

/**
 * Si llegan con un short link (/swc/<CODE> o ?c=<CODE>), la card que hay que abrir.
 * Se resuelve una sola vez al cargar el módulo, antes de que el efecto limpie la
 * URL: leerlo más tarde (en un re-mount) ya daría null.
 */
const MIEMBRO_DEL_LINK: Miembro | null = (() => {
  const code = codeFromUrl('c')
  if (!code) return null
  const img = MIEMBRO_POR_CODE[code.toUpperCase()]
  return img ? content.comite.find(m => m.img === img) ?? null : null
})()

function Comite() {
  const miembros = content.comite
  const [expanded, setExpanded] = useState(false)
  // El link ya trae la card abierta desde el primer render: no hace falta un
  // efecto que la setee después.
  const [open, setOpen] = useState<Miembro | null>(MIEMBRO_DEL_LINK)

  // Llegando por short link (/startups?c=<CODE>): el lightbox ya abre solo; solo
  // limpiamos la URL para que un refresh no lo reabra.
  useEffect(() => {
    if (!MIEMBRO_DEL_LINK) return
    window.history.replaceState({}, '', '/startups')
  }, [])

  const visibles = expanded ? miembros : miembros.slice(0, MOBILE_PREVIEW)

  return (
    <section id="comite" className="relative py-16 sm:py-24" style={{ backgroundColor: BG }}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">COMITÉ DE </span>
            <span className="text-[#75AADB]">SELECCIÓN</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Founders, inversores y referentes del ecosistema que eligen a las startups que compiten por la copa.
          </p>
        </div>

        {/* Mobile: preview + ver todo */}
        <div className="sm:hidden">
          <div className="grid grid-cols-2 gap-4">
            {visibles.map(m => (
              <ComiteTile key={m.slug} miembro={m} onOpen={setOpen} />
            ))}
          </div>
          {!expanded && miembros.length > MOBILE_PREVIEW && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setExpanded(true)}
                className="text-[#75AADB] border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 font-black text-sm px-6 py-2.5 rounded-full transition-all uppercase tracking-wide cursor-pointer"
              >
                Ver los {miembros.length}
              </button>
            </div>
          )}
        </div>

        {/* Desktop/tablet: grilla de 4 columnas (4·4·4·4·3 con los 19 miembros),
            con reparto de mazo en 3D al entrar en viewport.
            En mobile no se reparte: esa grilla arranca recortada y el botón
            "ver los N" cambia la cantidad de items, así que el mazo no tendría
            una posición final estable. */}
        <div className="hidden sm:block">
          <DeckGrid
            gridClass="grid grid-cols-4 gap-6"
            columns={{ base: 4 }}
            gap={{ base: 24 }}
            stagger={0.16}
          >
            {miembros.map(m => (
              <ComiteTile key={m.slug} miembro={m} onOpen={setOpen} />
            ))}
          </DeckGrid>
        </div>
      </div>

      {open && (
        <ShareLightbox
          src={open.img}
          alt={alt(open.nombre)}
          ariaLabel={`Card de ${open.nombre}`}
          shareUrl={shortLink(open.img)}
          shareText={`${open.nombre} — Comité de Selección · Startup World Cup Argentina`}
          tweetText={`${open.nombre} es parte del Comité de Selección de la Startup World Cup Argentina\n@StartupWC_arg @StartupGrindBA`}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}

const alt = (nombre: string) => `${nombre} — Comité de Selección Startup World Cup Argentina 2026`

function ComiteTile({ miembro, onOpen }: { miembro: Miembro; onOpen: (m: Miembro) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(miembro)}
      aria-label={`Ver la card de ${miembro.nombre} y compartirla`}
      className="block w-full cursor-zoom-in rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#75AADB]"
    >
      <img
        src={miembro.img}
        alt={alt(miembro.nombre)}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="w-full aspect-[1080/1350] object-cover block rounded-2xl select-none transition-transform duration-300 hover:scale-[1.03] hover:-translate-y-1"
      />
    </button>
  )
}

export default Comite
