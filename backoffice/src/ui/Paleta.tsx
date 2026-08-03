import { useEffect, useMemo, useRef, useState } from 'react'
import { Rotulo } from './Campos'
import { IconoBuscar, IconoPersona, IconoTick } from './Iconos'
import { nombreCanal } from '../lib/canales'
import { filtrar } from '../lib/buscar'
import { traerAsistentes, type Asistente } from '../lib/admin'
import { SECCIONES, INSCRIPTOS } from '../lib/secciones'
import * as traspaso from '../lib/traspaso'

/**
 * La paleta de comandos: ⌘K.
 *
 * Contesta de una sola forma las dos preguntas que se hacen todo el tiempo en
 * administración: «¿dónde está tal cosa?» y —la que más sube desde la puerta por
 * WhatsApp— «¿fulano está anotado?». Antes eso eran tres pasos: entrar a
 * Inscriptos, esperar la tabla, tipear el apellido en el buscador.
 *
 * Vive sólo en administración y en su propio chunk. En la puerta no existe: ahí
 * no hay teclado, y bajar el padrón entero al celular de la fila es justamente
 * lo que el resto de la app evita.
 *
 * El padrón se pide UNA vez, al abrirla por primera vez. Después queda en
 * memoria de este componente mientras la sesión dure.
 */
type Item =
  | { tipo: 'seccion'; clave: string; titulo: string; detalle: string; ruta: string }
  | { tipo: 'persona'; clave: string; titulo: string; detalle: string; entro: boolean }

/** Cuántas personas se listan. Más que esto ya no se lee, se scrollea. */
const TOPE = 7

export function Paleta({ ruta, ir, onCerrar }: {
  ruta: string
  ir: (id: string) => void
  onCerrar: () => void
}) {
  const [q, setQ] = useState('')
  const [activo, setActivo] = useState(0)
  const [personas, setPersonas] = useState<Asistente[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const listaRef = useRef<HTMLUListElement>(null)

  /* Escape a nivel ventana y no sólo en el input: alcanza con haber pasado el
     mouse por una fila para que el foco no esté donde uno cree. */
  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [onCerrar])

  /* El padrón, una sola vez. Si falla no se rompe nada: la paleta sigue
     sirviendo para navegar, que es la mitad de lo que hace. */
  useEffect(() => {
    let vivo = true
    traerAsistentes()
      .then(r => { if (vivo) setPersonas(r.personas) })
      .catch(() => { if (vivo) setPersonas([]) })
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  const items = useMemo<Item[]>(() => {
    const texto = q.trim().toLowerCase()

    const secciones: Item[] = SECCIONES
      .filter(s => s.id !== ruta && (!texto || s.label.toLowerCase().includes(texto)))
      .map(s => ({
        tipo: 'seccion',
        clave: `s-${s.id}`,
        titulo: s.label,
        detalle: s.bajada,
        ruta: s.id,
      }))

    // Buscar gente recién con dos letras: con una, el resultado es el padrón
    // entero cortado en siete, que no ayuda a nadie.
    if (texto.length < 2 || !personas) return secciones

    const gente: Item[] = filtrar(personas, q).slice(0, TOPE).map(p => ({
      tipo: 'persona',
      clave: `p-${p.origen}-${p.id}`,
      titulo: p.nombre || p.email,
      detalle: [p.empresa, nombreCanal(p.origen), p.dias].filter(Boolean).join(' · '),
      entro: Boolean(p.usadaEn),
    }))

    return [...secciones, ...gente]
  }, [q, personas, ruta])

  /**
   * Tipear vuelve al primer resultado.
   *
   * Va acá y no en un efecto sobre `q`: es la consecuencia de una tecla, no una
   * sincronización con nada de afuera. Sin esto, escribir una letra más te deja
   * parado sobre un resultado que ya no es el que estabas mirando.
   */
  function escribir(v: string) {
    setQ(v)
    setActivo(0)
  }

  function ejecutar(item: Item) {
    if (item.tipo === 'seccion') {
      ir(item.ruta)
    } else {
      // Se llega a Inscriptos con el nombre ya puesto en el buscador. La ficha no
      // se abre sola a propósito: desde acá se llega buscando «Lujan» y son tres,
      // y elegir cuál es una decisión de quien mira, no de la paleta.
      traspaso.dejar(item.titulo)
      ir(INSCRIPTOS)
    }
    onCerrar()
  }

  function alTecla(e: React.KeyboardEvent) {
    if (!items.length) return

    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      setActivo(i => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      setActivo(i => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      ejecutar(items[activo])
    }
  }

  /* Que el elegido quede a la vista cuando se navega con las flechas. */
  useEffect(() => {
    listaRef.current?.children[activo]?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  const secciones = items.filter(i => i.tipo === 'seccion')
  const gente = items.filter(i => i.tipo === 'persona')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar e ir a"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
    >
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      {/* El vidrio: desenfoque, un borde de 1px y un brillo interno arriba, que
          es lo que hace que se lea como una superficie y no como un rectángulo
          translúcido. */}
      <div className="swc-paleta relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-swc-surface/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <IconoBuscar tam={18} className="text-gray-500" />
          <input
            autoFocus
            value={q}
            onChange={e => escribir(e.target.value)}
            onKeyDown={alTecla}
            placeholder="Buscar una persona o ir a una sección…"
            aria-label="Buscar una persona o ir a una sección"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent py-4 text-base text-swc-light outline-none placeholder:text-gray-600"
          />
          <kbd className="hidden shrink-0 rounded border border-white/15 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 sm:block">
            ESC
          </kbd>
        </div>

        <ul ref={listaRef} className="max-h-[52vh] overflow-y-auto py-2">
          {secciones.length > 0 && <Grupo>Ir a</Grupo>}
          {items.map((item, i) => (
            <li key={item.clave}>
              {item.tipo === 'persona' && i === secciones.length && (
                <Grupo>
                  {cargando ? 'Buscando…' : `${gente.length === TOPE ? `Primeras ${TOPE}` : gente.length} en la lista`}
                </Grupo>
              )}
              <button
                onClick={() => ejecutar(item)}
                onMouseMove={() => setActivo(i)}
                aria-current={i === activo}
                style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
                className={`swc-cascada flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                  i === activo ? 'bg-swc-accent/12' : ''
                }`}
              >
                <span className={`shrink-0 ${i === activo ? 'text-swc-accent' : 'text-gray-600'}`}>
                  {item.tipo === 'seccion' ? <IconoBuscar tam={16} /> : <IconoPersona tam={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-swc-light">{item.titulo}</span>
                  <span className="block truncate text-xs text-gray-500">{item.detalle}</span>
                </span>
                {item.tipo === 'persona' && item.entro && (
                  <IconoTick tam={15} className="shrink-0 text-swc-ok" titulo="Ya entró" />
                )}
              </button>
            </li>
          ))}

          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              {cargando
                ? 'Cargando la lista…'
                : q.trim().length < 2
                  ? 'Escribí al menos dos letras para buscar una persona.'
                  : `Nadie ni ninguna sección con «${q.trim()}».`}
            </li>
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-600">
          <span><Tecla>↑</Tecla><Tecla>↓</Tecla> moverse</span>
          <span><Tecla>↵</Tecla> abrir</span>
          {personas && <span className="ml-auto tabular-nums">{personas.length} inscriptos</span>}
        </div>
      </div>
    </div>
  )
}

function Grupo({ children }: { children: React.ReactNode }) {
  return <Rotulo className="px-4 pt-2 pb-1 text-gray-600">{children}</Rotulo>
}

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mr-1 inline-block rounded border border-white/15 px-1 text-[10px] text-gray-500">
      {children}
    </kbd>
  )
}

export default Paleta
