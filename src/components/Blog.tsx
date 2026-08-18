import { Link } from 'react-router-dom'
import { SectionGlow } from './ui/SectionGlow'
import { content } from '../lib/content'
import { fechaLarga } from '../lib/fecha'

/**
 * El blog: lo que pasó, contado acá y no en el feed de alguien.
 *
 * Nació con una sola nota —el campeón nacional— y ese es justo el caso que
 * tenía que resolver: el podio vivía en el Hero, ocupando el hueco del
 * cronómetro, y ahí no se podía compartir, ni fechar, ni contar más de tres
 * nombres. Una nota sí: tiene URL propia, dice cuándo pasó y puede crecer.
 *
 * `resumida` es la versión del landing: la última nota y nada más. La página
 * `/blog` monta la misma sección con todas, para no tener dos maquetas que se
 * despeguen a la tercera nota.
 */

/**
 * La forma de una nota, escrita a mano y no inferida del JSON.
 *
 * Inferirla con `(typeof content.blog)[number]` parece más corto y es una
 * trampa: con una sola nota TypeScript deduce que `felicitacion` y `podio`
 * SIEMPRE están, y la segunda nota sin saludo —que el README promete que se
 * puede— deja de compilar. Los opcionales tienen que decir que lo son.
 */
export type Nota = {
  slug: string
  fecha: string
  titulo: string
  copete: string
  /** El saludo grande en dorado. Sin esto, la nota es una nota y ya. */
  felicitacion?: string
  imagen?: string
  alt?: string
  cuerpo: string[]
  podio?: { puesto: number; nombre: string; img: string; que: string }[]
}

const NOTAS = content.blog as Nota[]

/** El saludo. Va grande porque es lo que la nota vino a decir. */
export function Felicitacion({ nota }: { nota: Nota }) {
  if (!nota.felicitacion) return null
  return (
    <p className="text-2xl sm:text-3xl font-black text-[#d4af37] text-balance">
      {nota.felicitacion}
    </p>
  )
}

/**
 * El podio: un círculo con el logo de cada startup, y su nombre debajo.
 *
 * Sin chapita alrededor. La chapita metía una píldora gris que competía con el
 * logo justo cuando el logo es lo que se quiere mirar; el círculo solo apoya
 * sobre el fondo oscuro y no pelea con nada.
 *
 * Los logos salen recortados del círculo que las tarjetas «STARTUP
 * SELECCIONADA» tienen arriba, medido sobre el arte —el aro mide 286 px y su
 * centro cae en (450, 324) en las tres— y no estimado a ojo: si el recorte no
 * queda concéntrico, el `rounded-full` corta el aro de un lado y se ve torcido.
 *
 * El campeón se distingue por el aro dorado y el nombre en dorado, no por
 * tamaño: los tres círculos iguales se leen como un podio y no como un ranking
 * con letra chica.
 */
export function Podio({ nota }: { nota: Nota }) {
  if (!nota.podio?.length) return null
  return (
    <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6 sm:gap-x-10">
      {nota.podio.map(p => {
        const campeon = p.puesto === 1
        return (
          <li key={p.nombre} className="flex w-32 flex-col items-center gap-2.5 text-center">
            <img
              src={p.img}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden
              className={`h-16 w-16 rounded-full object-cover ring-2 ${
                campeon
                  ? 'ring-[#d4af37]/70 shadow-[0_0_30px_-6px_rgba(212,175,55,0.55)]'
                  : 'ring-white/15'
              }`}
            />
            <div>
              <p className={`text-sm font-black leading-tight ${campeon ? 'text-[#d4af37]' : 'text-white/85'}`}>
                {p.nombre}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase leading-tight tracking-[0.08em] text-white/40">
                {p.que}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** La tarjeta de una nota en el listado. */
function NotaCard({ nota }: { nota: Nota }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 sm:flex sm:items-center sm:gap-8">
      {nota.imagen && (
        <img
          src={nota.imagen}
          alt={nota.alt || ''}
          loading="lazy"
          decoding="async"
          className="mb-6 w-full rounded-xl object-cover sm:mb-0 sm:w-56 sm:shrink-0 aspect-[4/5]"
        />
      )}

      <div className="min-w-0">
        <time
          dateTime={nota.fecha}
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#75AADB]"
        >
          {fechaLarga(nota.fecha)}
        </time>

        <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white text-balance">
          {nota.titulo}
        </h3>

        <p className="mt-3 text-gray-400 leading-relaxed">{nota.copete}</p>

        <div className="mt-5">
          <Felicitacion nota={nota} />
        </div>

        <div className="mt-6 sm:flex sm:justify-start">
          <Podio nota={nota} />
        </div>

        <Link
          to={`/blog/${nota.slug}`}
          className="mt-6 inline-flex items-center gap-2 border border-[#75AADB]/40 hover:bg-[#75AADB]/10 active:scale-95 text-[#75AADB] hover:text-white font-black text-sm px-7 py-3 rounded-full transition-all uppercase tracking-wide"
        >
          Leer la nota
        </Link>
      </div>
    </article>
  )
}

function Blog({ resumida = false }: { resumida?: boolean }) {
  // Más nueva primero. El orden del archivo no manda: quien edita el JSON suma
  // la nota nueva al final, que es lo natural, y no tiene por qué acordarse.
  const notas = [...NOTAS].sort((a, b) => b.fecha.localeCompare(a.fecha))
  if (!notas.length) return null

  const [ultima, ...anteriores] = notas
  const resto = resumida ? [] : anteriores

  return (
    <section id="blog" className="relative py-16 sm:py-24 bg-[#020618] text-white">
      <SectionGlow />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#75AADB] to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase mb-4 text-white">
            BLOG
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Lo que pasó en el evento, contado acá.
          </p>
        </div>

        <NotaCard nota={ultima} />

        {resto.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {resto.map(n => <NotaCard key={n.slug} nota={n} />)}
          </div>
        )}

        {/* Sólo cuando hay algo más para ver: un «ver todas» que lleva a la
            misma nota que ya estás leyendo es una puerta a ningún lado. */}
        {resumida && anteriores.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#75AADB] hover:text-white transition-colors"
            >
              Ver todas las notas
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default Blog
