import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../lib/content'
import { Modal } from '../components/ui/Modal'
import { SpeakerTile } from '../components/Speakers'

const BG = '#020618'
const SURFACE = '#0f172b'
const ACCENT = '#75AADB'
const PLACEHOLDER_IMG =
  'https://grupobcc.com/wp/wp-content/uploads/2015/10/Steve-Wozniak-speaker-apple-conferencias-technology-940x660.jpg'

/**
 * Página dedicada con todos los speakers. Grilla 2-col mobile, 3-col tablet,
 * 4-col desktop para ver el roster completo sin scroll infinito.
 */
function SpeakersAll() {
  const speakers = content.speakers
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* Header */}
      <header className="relative" style={{ backgroundColor: SURFACE }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
          <Link
            to="/#speakers"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#75AADB] text-sm font-bold uppercase tracking-widest transition-colors mb-8"
          >
            <span aria-hidden>←</span>
            Volver al sitio
          </Link>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase mb-4">
            <span className="text-white">TODOS LOS </span>
            <span className="text-[#75AADB]">SPEAKERS</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
            Founders, inversores, mentores y referentes del ecosistema argentino y de la región.
            La grilla se actualiza a medida que se confirman invitados.
          </p>

          <div className="mt-6 flex items-baseline gap-2 text-gray-400 text-xs uppercase tracking-[0.25em] font-bold">
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">{speakers.length}</span>
            <span>speakers confirmados</span>
          </div>
        </div>
      </header>

      {/* Grilla completa */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {speakers.length === 0 ? (
          <p className="text-center text-gray-400 italic py-24">
            Estamos confirmando speakers — vuelve en unos días.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {speakers.map((s, i) => (
              <SpeakerTile key={s.slug} speaker={s} onOpen={() => setOpenIndex(i)} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#75AADB] hover:bg-[#5a93c5] active:scale-95 text-white font-bold uppercase tracking-wide text-sm transition-[transform,background-color]"
          >
            <span aria-hidden>←</span>
            Volver al sitio
          </Link>
        </div>
      </main>

      {/* Modal */}
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
    </div>
  )
}

export default SpeakersAll
