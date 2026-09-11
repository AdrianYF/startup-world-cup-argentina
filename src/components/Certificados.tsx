import { useEffect, useState } from 'react'
// Directo desde content/: sólo lo usa esta ruta, así queda en su propio chunk.
import certificadosJson from '../content/certificados.json'
import { SectionGlow } from './ui/SectionGlow'
import { ShareLightbox } from './ui/ShareLightbox'
import { codeTable, codeFromUrl, shortLink } from '../lib/shortlink'

/** Una entrada de certificados.json. Las escribe scripts/certificados.mjs. */
export type Certificado = { slug: string; nombre: string; rol: string; img: string; pdf: string }

const CERTIFICADOS: Certificado[] = certificadosJson

// El JSON viene por rol; para encontrarse a uno mismo sirve más el orden alfabético.
const POR_NOMBRE = [...CERTIFICADOS].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

/** Cómo se lee cada rol del JSON en la card; uno que no esté acá sale capitalizado. */
const ROL_LABEL: Record<string, string> = { startup: 'Startup', jurado: 'Jurado' }
const labelDeRol = (rol: string) => ROL_LABEL[rol] ?? rol.charAt(0).toUpperCase() + rol.slice(1)

const CERT_POR_CODE = codeTable(CERTIFICADOS.map(c => c.img))

if (import.meta.env.DEV && Object.keys(CERT_POR_CODE).length !== CERTIFICADOS.length) {
  console.warn('[Certificados] colisión de códigos entre certificados: revisá los slugs/imágenes en certificados.json')
}

/**
 * El certificado que pide la URL, si pide alguno.
 *
 * Es una función y no una constante de módulo a propósito, por lo mismo que en
 * StartupsPage: la constante se evaluaba una sola vez al importar el chunk, y
 * llegar otra vez con otro `?cert=` navegando dentro de la SPA abría el de la
 * primera visita.
 */
function certDelLink(): Certificado | null {
  const code = codeFromUrl('cert')
  if (!code) return null
  const img = CERT_POR_CODE[code.toUpperCase()]
  return img ? CERTIFICADOS.find(c => c.img === img) ?? null : null
}

const alt = (nombre: string) => `Certificado de participación de ${nombre} · Startup World Cup Argentina 2026`

const StarIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
  </svg>
)

function CertificadoCard({ c, onOpen }: { c: Certificado; onOpen: (c: Certificado) => void }) {
  const inicial = c.nombre.trim().charAt(0).toUpperCase()
  return (
    <button
      type="button"
      onClick={() => onOpen(c)}
      aria-label={`Ver el certificado de ${c.nombre}`}
      className="group flex w-full flex-col items-center rounded-2xl border border-[#75AADB]/30 bg-white/[0.03] px-6 py-8 text-center transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-[#75AADB]/70 hover:bg-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-[#75AADB]"
    >
      {/* Inicial en un círculo, como una ficha: el certificado en sí se ve al tocar. */}
      <span
        aria-hidden
        className="grid h-32 w-32 place-items-center rounded-full border-2 border-[#75AADB] bg-[#0f172b] text-4xl font-black text-[#75AADB] transition-colors group-hover:bg-[#162036]"
      >
        {inicial}
      </span>

      <span className="mt-6 block text-white text-xl font-bold leading-snug">{c.nombre}</span>
      <span className="mt-1 block text-[#75AADB] text-sm font-semibold">
        {labelDeRol(c.rol)} · 6 y 7 de agosto de 2026
      </span>

      <span className="mt-8 inline-flex items-center gap-1.5 text-[#75AADB] text-[11px] font-bold uppercase tracking-[0.18em]">
        <StarIcon />
        Certificado de participación
      </span>
    </button>
  )
}

function Certificados() {
  // En el estado inicial y no en un efecto: el código ya está en la URL en el
  // primer render, así que el certificado abre sin un frame de parpadeo. Que se
  // vuelva a leer en cada navegación lo resuelve el `key` de la página.
  const [open, setOpen] = useState<Certificado | null>(certDelLink)

  useEffect(() => {
    // Llegó por link: limpiar la URL para que un refresh no reabra solo.
    if (codeFromUrl('cert')) window.history.replaceState({}, '', '/certificados')
  }, [])

  return (
    <section id="certificados" className="relative py-16 sm:py-24 bg-[#020618] text-white">
      <SectionGlow />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16">
          <p className="inline-flex items-center gap-3 text-[#75AADB] text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <StarIcon size={16} />
            Reconocimiento
            <StarIcon size={16} />
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">Certificados </span>
            <span className="text-[#75AADB]">de participación</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Las personas que participaron de la Startup World Cup Argentina 2026, en Buenos Aires,
            el 6 y 7 de agosto. Tocá una card para ver y descargar el certificado.
          </p>
        </div>

        {POR_NOMBRE.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {POR_NOMBRE.map(c => (
              <CertificadoCard key={c.slug} c={c} onOpen={setOpen} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">Todavía no hay certificados publicados.</p>
        )}

        {/* La razón de ser de la página: el QR impreso en cada certificado apunta acá. */}
        <p className="mt-10 text-center text-xs sm:text-sm text-gray-500">
          El código QR impreso en cada certificado apunta a esta página.
        </p>
      </div>

      {open && (
        <ShareLightbox
          src={open.img}
          alt={alt(open.nombre)}
          ariaLabel={`Certificado de ${open.nombre}`}
          shareUrl={shortLink(open.img)}
          shareText={`Certificado de participación de ${open.nombre} · Startup World Cup Argentina`}
          tweetText={`${open.nombre} participó de la Startup World Cup Argentina 2026\n@StartupWC_arg @StartupGrindBA`}
          eyebrow={`${labelDeRol(open.rol)} · SWC Argentina 2026`}
          titulo={open.nombre}
          apaisada
          descarga={{ href: open.pdf, label: 'Descargar PDF' }}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}

export default Certificados
