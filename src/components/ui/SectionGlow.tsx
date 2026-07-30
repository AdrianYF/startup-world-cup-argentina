/**
 * Glows ambientales de sección: dos radiales azules anclados arriba.
 *
 * Nacieron en la Agenda y son el fondo compartido de las secciones dark de
 * contenido (ver /COLORS.md). Hero queda afuera porque ya tiene su propio fondo
 * (video + poster + gradientes), FAQ porque es blanca y Footer porque es cierre.
 *
 * Va como primer hijo de la <section>, que tiene que ser `relative`. El
 * contenedor del contenido también necesita `relative` para quedar por encima:
 * si no, el gradiente lo tapa.
 */
export function SectionGlow() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(1100px 480px at 18% -8%, rgba(37,99,235,0.22), transparent 70%), radial-gradient(900px 420px at 88% 6%, rgba(99,102,241,0.16), transparent 70%)',
      }}
    />
  )
}

export default SectionGlow
