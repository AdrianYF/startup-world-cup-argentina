import { Link, useParams } from 'react-router-dom'
import { PageLayout } from '../components/ui/PageLayout'
import { SectionGlow } from '../components/ui/SectionGlow'
import { Felicitacion, Podio, type Nota } from '../components/Blog'
import { fechaLarga } from '../lib/fecha'
import { content } from '../lib/content'

/**
 * Una nota, con su URL propia.
 *
 * Es la mitad del blog que justifica que el blog exista: el podio en el Hero no
 * se podía compartir ni fechar. Acá el link lleva a esto y a nada más.
 *
 * Un slug que no existe no es un error: es un link viejo o mal tipeado, así que
 * se dice y se ofrece el camino de vuelta en vez de dejar la pantalla negra.
 */
function BlogNota() {
  const { slug } = useParams()
  const nota = (content.blog as Nota[]).find(n => n.slug === slug)

  if (!nota) {
    return (
      <PageLayout>
        <section className="relative py-24 text-center">
          <SectionGlow />
          <div className="relative max-w-xl mx-auto px-4">
            <h1 className="text-3xl font-black uppercase text-white">Esa nota no existe</h1>
            <p className="mt-3 text-gray-400">
              Puede que el link esté viejo o mal copiado.
            </p>
            <Link
              to="/blog"
              className="mt-8 inline-flex items-center gap-2 border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 text-[#75AADB] hover:text-white font-black text-sm px-7 py-3 rounded-full transition-all uppercase tracking-wide"
            >
              Ver el blog
            </Link>
          </div>
        </section>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <article className="relative py-16 sm:py-24 bg-[#020618] text-white">
        <SectionGlow />

        <div className="relative max-w-3xl mx-auto px-4">
          <Link
            to="/blog"
            className="text-[11px] font-black uppercase tracking-[0.18em] text-[#75AADB] hover:text-white transition-colors"
          >
            ← Blog
          </Link>

          <header className="mt-6 text-center">
            <time
              dateTime={nota.fecha}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50"
            >
              {fechaLarga(nota.fecha)}
            </time>
            <h1 className="mt-3 text-3xl sm:text-5xl font-black uppercase text-white text-balance">
              {nota.titulo}
            </h1>
            <p className="mt-4 text-lg text-gray-400 leading-relaxed text-balance">
              {nota.copete}
            </p>
          </header>

          {/* La foto grande y arriba de todo: es la que cuenta qué pasó. */}
          {nota.imagen && (
            <figure className="mt-10">
              <img
                src={nota.imagen}
                alt={nota.alt || ''}
                // Sin `lazy`: es lo primero de la nota y diferirla deja el hueco
                // vacío justo donde va lo que la persona vino a ver.
                loading="eager"
                decoding="async"
                // Acotada y centrada: la foto es vertical (1163×1352) y a todo
                // el ancho de la columna se comía la pantalla entera, dejando el
                // saludo y el cuerpo abajo del fold. No se recorta porque el
                // logo de arriba es parte de lo que se está mostrando.
                className="mx-auto w-full max-w-lg rounded-2xl"
              />
              {nota.alt && (
                <figcaption className="mt-3 text-center text-xs text-white/40">
                  {nota.alt}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-10 flex flex-col items-center gap-8">
            <Felicitacion nota={nota} />
            <Podio nota={nota} />
          </div>

          <div className="mt-12 flex flex-col gap-5">
            {nota.cuerpo.map((parrafo, i) => (
              <p key={i} className="text-gray-300 leading-relaxed">
                {parrafo}
              </p>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-8">
            <a
              href={content.config.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 text-[#75AADB] hover:text-white font-black text-sm px-7 py-3 rounded-full transition-all uppercase tracking-wide"
            >
              Seguir las próximas ediciones
            </a>
            <Link
              to="/startups"
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white/60 hover:text-white transition-colors px-4 py-3"
            >
              Ver todas las startups
            </Link>
          </div>
        </div>
      </article>
    </PageLayout>
  )
}

export default BlogNota
