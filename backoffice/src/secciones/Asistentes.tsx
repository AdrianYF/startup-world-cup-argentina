import { useCallback, useMemo, useState } from 'react'
import Tabla, { type Columna } from '../ui/Tabla'
import FichaAsistente from '../componentes/FichaAsistente'
import { Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { filtrar, ordenarPorApellido } from '../lib/buscar'
import { fechaCorta, traerAsistentes, useRecurso, type Asistente } from '../lib/admin'

/**
 * La lista entera, sin filtro de día, y con las cosas que la puerta no hace.
 *
 * Es la sección de soporte: el mail que no llegó, el nombre mal tipeado, el
 * acompañante que quedó en blanco, el que pagó dos veces. Hasta ahora todo eso
 * era un UPDATE a mano en el SQL Editor de Supabase, con la persona esperando
 * del otro lado del chat.
 */
type Filtro = 'todos' | 'entraron' | 'faltan' | 'problemas'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'entraron', label: 'Ya entraron' },
  { id: 'faltan', label: 'Faltan' },
  { id: 'problemas', label: 'Con problema' },
]

function Asistentes({ onSinSesion }: { onSinSesion: () => void }) {
  const { datos, error, cargando, recargar } = useRecurso(traerAsistentes, onSinSesion)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [canal, setCanal] = useState('')
  const [abierta, setAbierta] = useState<Asistente | null>(null)

  // En un memo y no `datos?.personas || []` suelto: ese `|| []` devuelve un
  // array nuevo en cada render y haría recalcular todos los memos de abajo.
  const personas = useMemo(() => datos?.personas || [], [datos])

  const canales = useMemo(
    () => [...new Set(personas.map(p => p.origen))].sort(),
    [personas],
  )

  const visibles = useMemo(() => {
    let filas = personas
    if (canal) filas = filas.filter(p => p.origen === canal)
    if (filtro === 'entraron') filas = filas.filter(p => p.usadaEn)
    if (filtro === 'faltan') filas = filas.filter(p => !p.usadaEn)
    // "Con problema" junta lo que alguien tiene que mirar antes del evento: el
    // que pagó dos veces, el que no cae en ningún día y el que no tiene nombre.
    if (filtro === 'problemas') {
      filas = filas.filter(p => p.pagoDoble || p.sinDia || !p.nombre)
    }
    return ordenarPorApellido(filtrar(filas, busqueda))
  }, [personas, canal, filtro, busqueda])

  const problemas = useMemo(
    () => personas.filter(p => p.pagoDoble || p.sinDia || !p.nombre).length,
    [personas],
  )

  const columnas: Columna<Asistente>[] = useMemo(() => [
    {
      clave: 'nombre',
      titulo: 'Nombre',
      orden: p => p.nombre || 'zzz',
      celda: p => (
        <span className="flex items-center gap-1.5">
          {p.nombre || <span className="text-gray-500">(sin nombre)</span>}
          {p.pagoDoble && <Chip tono="warn">2 pagos</Chip>}
          {p.sinDia && <Chip tono="coral">sin día</Chip>}
        </span>
      ),
    },
    { clave: 'email', titulo: 'Email', orden: p => p.email, celda: p => p.email },
    {
      clave: 'empresa',
      titulo: 'Empresa',
      orden: p => p.empresa || '',
      celda: p => p.empresa || '—',
      soloTabla: true,
    },
    { clave: 'entrada', titulo: 'Entrada', orden: p => p.entrada, celda: p => p.entrada },
    { clave: 'dias', titulo: 'Días', orden: p => p.dias, celda: p => p.dias, soloTabla: true },
    {
      clave: 'origen',
      titulo: 'Canal',
      orden: p => p.origen,
      celda: p => (p.origen === 'web' ? 'Venta propia' : p.origen),
    },
    {
      clave: 'usadaEn',
      titulo: 'Ingreso',
      orden: p => p.usadaEn || '',
      celda: p => (p.usadaEn
        ? <span className="text-swc-ok">{fechaCorta(p.usadaEn)}</span>
        : <span className="text-gray-600">—</span>),
    },
  ], [])

  const alGuardar = useCallback(() => {
    setAbierta(null)
    recargar()
  }, [recargar])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  return (
    <>
      <Tarjetas>
        <Tarjeta label="En la lista" valor={personas.length} />
        <Tarjeta
          label="Ya entraron"
          valor={personas.filter(p => p.usadaEn).length}
          tono="ok"
        />
        <Tarjeta label="Canales" valor={canales.length} detalle={canales.join(' · ')} />
        <Tarjeta
          label="Para revisar"
          valor={problemas}
          tono={problemas ? 'coral' : undefined}
          detalle="pago doble, sin día o sin nombre"
        />
      </Tarjetas>

      <div className="mb-4 flex flex-col gap-3">
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, mail o empresa"
          autoComplete="off"
          className="w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-2.5 text-base text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent md:max-w-md"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                f.id === filtro ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 w-px bg-white/10" />
          <button
            onClick={() => setCanal('')}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
              canal === '' ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
            }`}
          >
            Todos los canales
          </button>
          {canales.map(c => (
            <button
              key={c}
              onClick={() => setCanal(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                c === canal ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
              }`}
            >
              {c === 'web' ? 'Venta propia' : c}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {visibles.length} de {personas.length}
        </p>
      </div>

      <Tabla
        columnas={columnas}
        filas={visibles}
        claveDe={p => `${p.origen}-${p.id}`}
        onFila={setAbierta}
        vacio="Nadie con esos filtros."
      />

      {abierta && (
        <FichaAsistente
          persona={abierta}
          onCerrar={() => setAbierta(null)}
          onGuardado={alGuardar}
        />
      )}
    </>
  )
}

export default Asistentes
