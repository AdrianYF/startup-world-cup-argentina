import { SectionGlow } from './ui/SectionGlow'

/**
 * imatchin - matchmaking del evento. Va entre Participan y Apoyan: primero ves
 * quién viene, después la invitación a que te encuentren a vos.
 *
 * El CTA solo se renderiza si `IMATCHIN_URL` tiene valor, para no publicar un
 * botón que no lleva a ningún lado mientras falte el link.
 */

/** URL del alta de perfil en imatchin. Vacío = no se muestra el botón. */
const IMATCHIN_URL = 'https://imatchin.com'

function Imatchin() {
  return (
    <section id="imatchin" className="relative py-16 sm:py-24 bg-[#020618] text-white">
      <SectionGlow />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="relative max-w-3xl mx-auto px-4 flex flex-col items-center text-center gap-6">
        {/*
          Versión en blanco, como el resto de public/logos/*-white. El original
          es #0a66c2 y sobre el fondo dark daba 3.39:1: "atchin" se perdía. Acá
          la tinta va en blanco y el "im" queda calado, dejando ver el fondo.

          SVG y no el webp: el raster venía de un original de 101x43 y a 40px de
          alto en pantallas retina ya se veía blando. El vectorial no tiene ese
          techo.

          width/height son los del viewBox (923x464): reservan la proporción
          correcta antes de que cargue. Con los del raster viejo (101x43) el
          espacio quedaba más ancho de la cuenta y la caja saltaba al pintar.
        */}
        <img
          src="/logos/imatchin-white.svg"
          alt="imatchin"
          width={923}
          height={464}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-10 w-auto"
        />

        <h2 className="m-0 text-2xl sm:text-4xl font-black leading-tight text-balance">
          No dejes tu próxima conexión al azar.
        </h2>

        <p className="m-0 text-gray-400 text-lg max-w-2xl">
          Creá tu perfil y hacé que te encuentren.
        </p>

        {IMATCHIN_URL && (
          <a
            href={IMATCHIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Creá tu perfil en imatchin (abre en una nueva pestaña)"
            className="inline-flex items-center gap-2 border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 text-[#75AADB] hover:text-white font-black text-sm px-7 py-3 rounded-full transition-all uppercase tracking-wide cursor-pointer"
          >
            Creá tu perfil
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </section>
  )
}

export default Imatchin
