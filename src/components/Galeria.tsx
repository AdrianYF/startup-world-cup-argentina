import { useEffect, useState } from 'react'
import { ShareLightbox } from './ui/ShareLightbox'
import { codeTable, codeFromUrl, shortLink } from '../lib/shortlink'

/**
 * Galería tipo "afterparty": muro de fotos en filas que scrollean en sentidos
 * opuestos. Al clickear una foto se abre un lightbox con opciones para compartir
 * en redes (compartir nativo / X / LinkedIn / copiar link).
 *
 * Fotos reales en /public/galeria (foto-01.jpg … foto-55.jpg).
 */

// Tres filas: r1-* arriba, r2-* al medio, r3-* abajo.
// Mantener ROW1_COUNT/ROW2_COUNT/ROW3_COUNT en sync con /public/galeria y con api/og.js.
const ROW1_COUNT = 39
const ROW2_COUNT = 36
const ROW3_COUNT = 15
const pad = (n: number) => String(n).padStart(2, '0')
const R1 = Array.from({ length: ROW1_COUNT }, (_, i) => `/galeria/r1-${pad(i + 1)}.jpg`)
const R2 = Array.from({ length: ROW2_COUNT }, (_, i) => `/galeria/r2-${pad(i + 1)}.jpg`)
const R3 = Array.from({ length: ROW3_COUNT }, (_, i) => `/galeria/r3-${pad(i + 1)}.jpg`)
// Diccionario de short links: el orden no importa (el código sale del path).
const ALL = [...R1, ...R2, ...R3]

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
const ROW_C = shuffle(R3)

const SHARE_TEXT = 'Startup World Cup Argentina'
const TWEET_TEXT = 'Yo también participo de la Startup World Cup Argentina\n@StartupWC_arg @StartupGrindBA'

const SRC_BY_CODE = codeTable(ALL)
const srcFromCode = (code: string) => SRC_BY_CODE[code.toUpperCase()] ?? null

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

function Galeria() {
  const [open, setOpen] = useState<string | null>(null)

  // Si llegan con un short link (ruta /swc/<code>, /g/<code> o ?g=<code>), abrir esa foto
  // y limpiar la URL (el lightbox es modal, no hace falta scrollear).
  useEffect(() => {
    const code = codeFromUrl('g')
    if (!code) return
    const src = srcFromCode(code)
    if (!src) return // el código es de otra sección (ej. el comité)
    setOpen(src)
    window.history.replaceState({}, '', '/galeria')
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

      {/* Muro de fotos: tres filas en sentidos alternados */}
      <div className="flex flex-col gap-5 sm:gap-7">
        <Strip imgs={ROW_A} duration="80s" onOpen={setOpen} />
        <Strip imgs={ROW_B} reverse duration="70s" onOpen={setOpen} />
        <Strip imgs={ROW_C} duration="90s" onOpen={setOpen} />
      </div>

      {/* fades laterales para que las fotos "entren/salgan" suave */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#020618] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#020618] to-transparent z-10" />

      {open && (
        <ShareLightbox
          // El muro usa las fotos limpias; la marca de agua horneada (wm/) se ve solo acá.
          src={open.replace('/galeria/', '/galeria/wm/')}
          alt="Foto del evento Startup World Cup Argentina"
          ariaLabel="Foto del evento"
          shareUrl={shortLink(open)}
          shareText={SHARE_TEXT}
          tweetText={TWEET_TEXT}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}

export default Galeria
