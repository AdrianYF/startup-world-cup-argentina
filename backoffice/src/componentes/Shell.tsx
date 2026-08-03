import { useEffect, useState, type ReactNode } from 'react'
import { Boton } from '../ui/Acciones'
import { IconoSalir } from '../ui/Iconos'
import { SECCIONES } from '../lib/secciones'
import { PUERTA } from '../lib/ruta'

/**
 * El marco de ADMINISTRACIÓN: la navegación, quién está adentro y la salida.
 *
 * La puerta no pasa por acá. Es a propósito: esta barra tiene cinco secciones
 * que no sirven para acreditar a nadie, y arriba de la pantalla que se usa de
 * pie eran cinco formas de irse a cualquier otro lado sin querer —incluida
 * Ventas, que tiene el botón de reembolsar—. Quien acredita abre la raíz y no ve
 * nada de esto.
 *
 * Era un sidebar fijo de 56 y pasó a ser una franja arriba. El motivo es la
 * sección que más se mira sentado: las tablas de Ventas y del padrón usan todo
 * el ancho que se les dé, y 224px de sidebar permanente eran 224px que no tenía
 * la tabla. Arriba, la navegación ocupa alto —que sobra— en vez de ancho.
 */
function Shell({ ruta, ir, quien, onSalir, children }: {
  ruta: string
  ir: (id: string) => void
  quien: string
  onSalir: () => void
  children: ReactNode
}) {
  const [menu, setMenu] = useState(false)

  // Navegar cierra el cajón acá y no en un efecto sobre `ruta`: es una
  // consecuencia del click, no una sincronización con nada de afuera.
  const irYCerrar = (id: string) => {
    setMenu(false)
    ir(id)
  }

  useEffect(() => {
    if (!menu) return
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [menu])

  const enlaces = (vertical: boolean) => (
    <nav
      aria-label="Secciones"
      className={vertical ? 'flex flex-col gap-0.5' : 'flex items-center gap-0.5'}
    >
      {SECCIONES.map(s => (
        <button
          key={s.id || 'personas'}
          onClick={() => irYCerrar(s.id)}
          aria-current={s.id === ruta ? 'page' : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
            vertical ? 'text-left' : ''
          } ${
            s.id === ruta
              ? 'bg-swc-accent/15 text-swc-accent'
              : 'text-swc-muted hover:bg-white/[0.04] hover:text-swc-light'
          }`}
        >
          {s.label}
        </button>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-swc-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          {/* Vuelve a la puerta, que es la raíz. Es la salida más usada de acá:
              se entra a administración a responder una pregunta y se vuelve. */}
          <button
            onClick={() => irYCerrar(PUERTA)}
            className="flex shrink-0 items-baseline gap-2"
            aria-label="Volver a la acreditación"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-swc-accent">
              SWC
            </span>
            <span className="text-base font-black text-swc-light">Admin</span>
          </button>

          <div className="ml-4 hidden lg:block">{enlaces(false)}</div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {quien && (
              <p className="hidden max-w-[10rem] truncate text-xs font-bold text-swc-light sm:block">
                {quien}
              </p>
            )}
            <Boton tono="fantasma" tam="sm" onClick={onSalir} className="hidden items-center gap-1.5 sm:inline-flex">
              <IconoSalir tam={13} />
              Salir
            </Boton>
            <Boton
              tono="fantasma"
              tam="sm"
              onClick={() => setMenu(true)}
              aria-label="Abrir el menú"
              className="lg:hidden"
            >
              Menú
            </Boton>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setMenu(false)}
            aria-label="Cerrar el menú"
          />
          <div className="relative ml-auto flex h-full w-64 flex-col justify-between border-l border-white/10 bg-swc-surface px-3 py-5">
            <div>
              <p className="mb-6 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-swc-accent">
                Backoffice
              </p>
              {enlaces(true)}
            </div>

            <div className="border-t border-white/10 pt-3">
              {quien && (
                <p className="mb-2 truncate px-3 text-xs font-bold text-swc-light">{quien}</p>
              )}
              <Boton tono="fantasma" tam="sm" ancho onClick={onSalir}>Salir</Boton>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">{children}</div>

      <Pie />
    </div>
  )
}

/**
 * El pie: de qué evento es esto y qué se está mirando.
 *
 * Sólo en pantalla grande. En el celular de la puerta no hay nada abajo salvo la
 * barra de acciones, y un pie ahí es alto de scroll que se paga en la fila.
 */
function Pie() {
  return (
    <footer className="hidden border-t border-white/10 px-4 py-5 lg:block">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
        <p>Startup World Cup Argentina 2026 · backoffice del evento</p>
        <p>La lista trae mail y teléfono de cada persona: no la proyectes ni la compartas.</p>
      </div>
    </footer>
  )
}

export default Shell
