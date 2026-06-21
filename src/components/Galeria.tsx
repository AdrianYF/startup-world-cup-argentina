/**
 * Galería tipo "muro de fotos" (estilo afterparty de START Summit): dos filas de
 * fotos que scrollean solas en sentidos opuestos, fondo oscuro.
 *
 * Las imágenes son PLACEHOLDERS (picsum.photos). Para usar las reales: reemplazar
 * los arrays ROW_A / ROW_B por rutas de /public (ej. '/galeria/foto-1.jpg').
 */

const ph = (seed: string) => `https://picsum.photos/seed/${seed}/520/360`

const ROW_A = ['swc-a1', 'swc-a2', 'swc-a3', 'swc-a4', 'swc-a5', 'swc-a6', 'swc-a7', 'swc-a8'].map(ph)
const ROW_B = ['swc-b1', 'swc-b2', 'swc-b3', 'swc-b4', 'swc-b5', 'swc-b6', 'swc-b7', 'swc-b8'].map(ph)

function Strip({
  imgs,
  reverse = false,
  duration = '48s',
}: {
  imgs: string[]
  reverse?: boolean
  duration?: string
}) {
  // Duplicamos la lista para que el loop a -50% sea perfecto.
  const loop = [...imgs, ...imgs]
  return (
    <div className="overflow-hidden">
      <div
        className="marquee-track flex w-max gap-4"
        style={{ animationDuration: duration, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {loop.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            aria-hidden
            loading="lazy"
            draggable={false}
            className="h-36 sm:h-52 w-auto aspect-[13/9] object-cover rounded-2xl shrink-0 select-none shadow-lg shadow-black/30"
          />
        ))}
      </div>
    </div>
  )
}

function Galeria() {
  return (
    <section id="galeria" className="relative py-16 sm:py-24 bg-[#020618] text-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight">
          <span className="text-white">GA</span>
          <span className="text-[#75AADB]">LERÍA</span>
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-4">
          Viví la experiencia Startup World Cup Argentina.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        <Strip imgs={ROW_A} duration="52s" />
        <Strip imgs={ROW_B} reverse duration="46s" />
      </div>

      {/* fades laterales para que las fotos "entren/salgan" suave */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#020618] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#020618] to-transparent" />
    </section>
  )
}

export default Galeria
