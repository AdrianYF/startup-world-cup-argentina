import { useState } from 'react'
import { content } from '../lib/content'
import { Modal } from './ui/Modal'

/**
 * Speakers — paleta reducida a 5 colores y tipografía alineada con el resto del sitio.
 * Colores: bg #020618 · surface #0f172b · white · gray-400 · accent #75AADB (celeste).
 * Estructura: badge → h2 uppercase → subtítulo → wave divider → grilla 5-col.
 */

const SURFACE = '#0f172b'
const BG = '#020618'
const ACCENT = '#75AADB'
const PLACEHOLDER_IMG =
  'https://grupobcc.com/wp/wp-content/uploads/2015/10/Steve-Wozniak-speaker-apple-conferencias-technology-940x660.jpg'

function Speakers() {
  const speakers = content.speakers
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!speakers.length) {
    return (
      <section id="speakers" className="relative py-16 sm:py-24 text-center" style={{ backgroundColor: BG }}>
        <div className="max-w-2xl mx-auto px-4">
          <span className="inline-block border border-white/20 text-gray-400 text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            En el escenario
          </span>
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">SPEAKERS</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Estamos confirmando founders, inversores y referentes del ecosistema.
            La grilla se publica en las próximas semanas.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="speakers" className="relative" style={{ backgroundColor: BG }}>
      {/* Banda superior */}
      <div className="relative pt-24 pb-32 md:pb-40" style={{ backgroundColor: SURFACE }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block border border-white/20 text-gray-400 text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            En el escenario
          </span>
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-white">SPEAKERS</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Founders, inversores y referentes del ecosistema argentino y la región.
          </p>
        </div>

        {/* Wave divider */}
        <svg
          className="absolute -bottom-px left-0 w-full h-16 md:h-24 block"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,40 C240,90 480,10 720,45 C960,80 1200,15 1440,55 L1440,100 L0,100 Z"
            fill={BG}
          />
        </svg>
      </div>

      {/* Grilla 5x4 */}
      <div className="relative -mt-24 md:-mt-32 z-10 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {speakers.map((s, i) => (
              <button
                key={s.slug}
                onClick={() => setOpenIndex(i)}
                aria-label={`Ver speaker ${s.nombre}`}
                className="group relative overflow-hidden rounded-sm border border-white/10 cursor-pointer text-left will-change-transform transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/30 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 active:scale-[0.98]"
                style={{ aspectRatio: '1 / 1' }}
              >
                <img
                  src={s.thumb || PLACEHOLDER_IMG}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG }}
                  alt={s.nombre}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover will-change-transform transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />

                {/* Vignette para legibilidad del título */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#020618] via-[#020618]/60 to-transparent pointer-events-none" />

                {/* Título + rol */}
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <h3 className="text-white text-sm md:text-base font-black leading-tight">
                    {s.nombre}
                  </h3>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-1 truncate">
                    {s.rol}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-gray-400 text-xs mt-10 italic">
            Lista en construcción · se anuncian nuevos cada semana.
          </p>
        </div>
      </div>

      {/* Modal de speaker */}
      {openIndex !== null && (
        <Modal onClose={() => setOpenIndex(null)} titleId="speaker-modal-title" size="lg">
          <div className="flex flex-col items-center">
            <img
              src={speakers[openIndex].image || PLACEHOLDER_IMG}
              onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG }}
              alt={speakers[openIndex].nombre}
              className="w-full max-w-md rounded-sm shadow-2xl"
            />
            <h3 id="speaker-modal-title" className="text-white text-2xl font-black mt-4 text-center">
              {speakers[openIndex].nombre}
            </h3>
            <p className="text-gray-400 text-sm mt-1 text-center">
              {speakers[openIndex].rol}
            </p>

            {speakers[openIndex].linkedin && (
              <a
                href={speakers[openIndex].linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-sm font-bold uppercase tracking-widest transition-colors"
                style={{ color: ACCENT }}
              >
                Ver perfil en LinkedIn
              </a>
            )}

            <button
              onClick={() => setOpenIndex(null)}
              className="mt-6 text-white font-black px-6 py-2 rounded-full transition-[transform,background-color] active:scale-95 cursor-pointer"
              style={{ backgroundColor: ACCENT }}
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default Speakers
