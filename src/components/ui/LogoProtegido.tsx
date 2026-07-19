/**
 * Logo "protegido": tratamiento para marcas con guía de uso estricta (Deloitte,
 * Workplace). Sigue las reglas típicas de esas guías:
 *
 * - Variante blanca del logo sobre un fondo sólido oscuro (secundario sobre negro),
 *   sin rediseñar, sin recolorear, sin filtros ni glow.
 * - El fondo sólido aísla al logo del spotlight de la sección: no se le "agrega"
 *   ningún color detrás ni queda sobre imágenes.
 * - Área de protección: padding alrededor del logo (ningún otro elemento entra).
 * - Tamaño legible y parejo entre las marcas protegidas.
 *
 * No incluye su propio <a>: el link lo pone el contenedor de la sección.
 */
export function LogoProtegido({
  src,
  alt,
  sinPadding = false,
}: {
  src: string
  alt: string
  /** Sin el área de protección (padding). El fondo sólido igual aísla del spotlight. */
  sinPadding?: boolean
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg bg-[#020618] ${sinPadding ? 'p-0' : 'px-6 py-4'}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="h-10 w-auto object-contain sm:h-11"
      />
    </span>
  )
}

export default LogoProtegido
