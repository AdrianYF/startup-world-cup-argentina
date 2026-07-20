/**
 * Logo "protegido": tratamiento para marcas con guía de uso estricta (Deloitte,
 * Workplace). Sigue las reglas típicas de esas guías:
 *
 * - Variante blanca del logo, sin rediseñar, sin recolorear, sin filtros ni glow.
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
  /** Sin el área de protección (padding). */
  sinPadding?: boolean
}) {
  return (
    <span
      className={`flex items-center justify-center ${sinPadding ? 'p-0' : 'px-6 py-4'}`}
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
