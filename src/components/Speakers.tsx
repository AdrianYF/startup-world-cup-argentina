import { useState } from 'react'
import { content } from '../lib/content'
import { Modal } from './ui/Modal'

/**
 * Grid de speaker tiles chiquitas.
 * Default: foto en blanco y negro + gradient brand encima (violeta → celeste → coral).
 * Hover: el gradient se desvanece y la foto pasa a color. Click: abre modal con
 * la imagen original (full size).
 */

function Speakers() {
  const speakers = content.speakers
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!speakers.length) return null

  return (
    <section id="speakers" className="relative py-24 bg-[#020618]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block border border-white/20 text-gray-400 text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            En el escenario
          </span>
          <h2 className="text-5xl lg:text-6xl font-black uppercase mb-4">
            <span className="text-[#75AADB]">SPEAKERS</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Founders, inversores y referentes del ecosistema. Pasá el mouse o tocá para revelar.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3 max-w-5xl mx-auto">
          {speakers.map((s, i) => (
            <button
              key={s.slug}
              onClick={() => setOpenIndex(i)}
              aria-label={`Ver speaker ${s.nombre}`}
              className="group relative rounded-sm overflow-hidden border border-white/10 hover:border-[#75AADB]/60 transition-all duration-300 cursor-pointer focus-visible:scale-[1.04] active:scale-95"
              style={{ aspectRatio: '4 / 5' }}
            >
              {/* Foto base — B&W por default, color en hover */}
              <img
                src={s.thumb}
                alt={s.nombre}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-out group-hover:scale-105"
              />

              {/* Capa 1: gradient brand sólido que se desvanece en hover */}
              <div
                className="absolute inset-0 transition-opacity duration-500 ease-out group-hover:opacity-0"
                style={{
                  background:
                    'linear-gradient(135deg, #6c5ce7 0%, #75AADB 50%, #ff7675 100%)',
                  mixBlendMode: 'multiply',
                }}
                aria-hidden
              />

              {/* Capa 2: tinte brand sobre la foto (más sutil) */}
              <div
                className="absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-15"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(108,92,231,0.85) 0%, rgba(117,170,219,0.55) 45%, rgba(255,118,117,0.7) 100%)',
                }}
                aria-hidden
              />

              {/* Vignette inferior para legibilidad del nombre */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#020618]/95 via-[#020618]/40 to-transparent pointer-events-none" />

              {/* Nombre abajo — aparece en hover */}
              <div className="absolute inset-x-0 bottom-0 p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 pointer-events-none">
                <p className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight drop-shadow-lg">
                  {s.nombre}
                </p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8 italic">
          Lista de speakers en construcción · se anuncian nuevos cada semana.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

      {/* Modal de speaker — muestra la imagen original */}
      {openIndex !== null && (
        <Modal onClose={() => setOpenIndex(null)} titleId="speaker-modal-title" size="lg">
          <div className="flex flex-col items-center">
            <img
              src={speakers[openIndex].image}
              alt={speakers[openIndex].nombre}
              className="w-full max-w-md rounded-sm shadow-2xl"
            />
            <h3 id="speaker-modal-title" className="sr-only">
              {speakers[openIndex].nombre}
            </h3>

            {speakers[openIndex].linkedin && (
              <a
                href={speakers[openIndex].linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-[#75AADB] hover:text-white text-sm font-bold uppercase tracking-widest"
              >
                Ver perfil en LinkedIn ↗
              </a>
            )}

            <button
              onClick={() => setOpenIndex(null)}
              className="mt-6 bg-[#6c5ce7] hover:bg-[#5848c4] active:scale-95 text-white font-black px-6 py-2 rounded-full transition-all cursor-pointer"
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
