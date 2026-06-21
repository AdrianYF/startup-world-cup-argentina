/**
 * Galería tipo "afterparty" de START Summit: muro de fotos en filas inclinadas
 * (diagonal) que scrollean solas en sentidos opuestos, fondo oscuro.
 *
 * Las imágenes son PLACEHOLDERS (picsum.photos). Para usar las reales: reemplazar
 * los arrays ROW_* por rutas de /public (ej. '/galeria/foto-1.jpg').
 */

const ph = (seed: string) => `https://picsum.photos/seed/${seed}/640/440`

const ROW_A = ['swc-a1', 'swc-a2', 'swc-a3', 'swc-a4', 'swc-a5', 'swc-a6', 'swc-a7', 'swc-a8'].map(ph)
const ROW_B = ['swc-b1', 'swc-b2', 'swc-b3', 'swc-b4', 'swc-b5', 'swc-b6', 'swc-b7', 'swc-b8'].map(ph)
const ROW_C = ['swc-c1', 'swc-c2', 'swc-c3', 'swc-c4', 'swc-c5', 'swc-c6', 'swc-c7', 'swc-c8'].map(ph)

function Strip({
  imgs,
  reverse = false,
  duration = '60s',
}: {
  imgs: string[]
  reverse?: boolean
  duration?: string
}) {
  // Duplicamos la lista para que el loop a -50% sea perfecto.
  const loop = [...imgs, ...imgs]
  return (
    <div
      className="marquee-track flex w-max gap-4 sm:gap-6"
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
          className="h-44 sm:h-60 lg:h-64 w-auto aspect-[16/11] object-cover rounded-2xl shrink-0 select-none shadow-xl shadow-black/40 ring-1 ring-white/5"
        />
      ))}
    </div>
  )
}

function Galeria() {
  return (
    <section id="galeria" className="relative py-20 sm:py-28 bg-[#020618] text-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 text-center mb-12 sm:mb-16">
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95]">
          <span className="text-white">LA </span>
          <span className="text-[#75AADB]">GALERÍA</span>
        </h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mt-4">
          Viví la experiencia Startup World Cup Argentina.
        </p>
      </div>

      {/* Muro inclinado: filas en diagonal, scale para tapar las esquinas de la rotación */}
      <div className="-rotate-3 sm:-rotate-[4deg] scale-[1.12]">
        <div className="flex flex-col gap-4 sm:gap-6">
          <Strip imgs={ROW_A} duration="62s" />
          <Strip imgs={ROW_B} reverse duration="54s" />
          <Strip imgs={ROW_C} duration="70s" />
        </div>
      </div>

      {/* fades laterales para que las fotos "entren/salgan" suave */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#020618] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#020618] to-transparent z-10" />
    </section>
  )
}

export default Galeria
