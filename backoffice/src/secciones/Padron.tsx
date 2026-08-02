import { useEffect, useMemo, useRef, useState } from 'react'
import { Boton, Pildoras, Tabs, type Opcion } from '../ui/Acciones'
import { Buscador, Dato, Datos } from '../ui/Campos'
import { Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import Tabla, { type Columna } from '../ui/Tabla'
import { filtrar, ordenarPorApellido } from '../lib/buscar'
import { fechaCorta, traerAsistentes, useRecurso, type Asistente } from '../lib/admin'
import type { Dia } from '../lib/tipos'

/**
 * El padrón: la lista entera, sin filtro de día.
 *
 * Es la mitad «sentado» de Personas y por eso vive en su propio chunk: trae la
 * tabla, el cliente de `/api/backoffice` y el padrón completo con teléfono y
 * empresa de cada persona. Nada de eso tiene que bajarse en el celular que abre
 * la lista parado en la fila de entrada.
 *
 * Es la vista de soporte: el mail que no llegó, el nombre mal tipeado, el que
 * pagó dos veces. Hasta hace poco todo eso era un UPDATE a mano en el SQL Editor
 * de Supabase, con la persona esperando del otro lado del chat.
 */
type Filtro = 'todos' | 'entraron' | 'faltan' | 'problemas'

function Padron({
  busqueda, onBusqueda, onAbrir, onSinSesion, recarga, dia, adentro, total, enCola, onPendientes,
}: {
  busqueda: string
  onBusqueda: (v: string) => void
  onAbrir: (p: Asistente) => void
  onSinSesion: () => void
  /** Sube cuando la ficha guarda algo. Es la señal para volver a pedir la lista. */
  recarga: number
  dia: Dia
  adentro: number
  total: number
  enCola: number
  onPendientes: () => void
}) {
  const { datos, error, cargando, recargar } = useRecurso(traerAsistentes, onSinSesion)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [canal, setCanal] = useState('')

  // La primera carga ya la hace `useRecurso` al montarse; esto es sólo para los
  // guardados posteriores.
  const montado = useRef(false)
  useEffect(() => {
    if (!montado.current) { montado.current = true; return }
    recargar()
  }, [recarga, recargar])

  // En un memo y no `datos?.personas || []` suelto: ese `|| []` devuelve un
  // array nuevo en cada render y haría recalcular todos los memos de abajo.
  const personas = useMemo(() => datos?.personas || [], [datos])

  const canales = useMemo(
    () => [...new Set(personas.map(p => p.origen))].sort(),
    [personas],
  )

  const esProblema = (p: Asistente) => p.pagoDoble || p.sinDia || !p.nombre

  const cuentas = useMemo(() => ({
    todos: personas.length,
    entraron: personas.filter(p => p.usadaEn).length,
    faltan: personas.filter(p => !p.usadaEn).length,
    problemas: personas.filter(esProblema).length,
  }), [personas])

  const visibles = useMemo(() => {
    let filas = personas
    if (canal) filas = filas.filter(p => p.origen === canal)
    if (filtro === 'entraron') filas = filas.filter(p => p.usadaEn)
    if (filtro === 'faltan') filas = filas.filter(p => !p.usadaEn)
    // «Con problema» junta lo que alguien tiene que mirar antes del evento: el
    // que pagó dos veces, el que no cae en ningún día y el que no tiene nombre.
    if (filtro === 'problemas') filas = filas.filter(esProblema)
    return ordenarPorApellido(filtrar(filas, busqueda))
  }, [personas, canal, filtro, busqueda])

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

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const filtros: Opcion<Filtro>[] = [
    { id: 'todos', label: 'Todos', cuenta: cuentas.todos },
    { id: 'entraron', label: 'Ya entraron', cuenta: cuentas.entraron },
    { id: 'faltan', label: 'Faltan', cuenta: cuentas.faltan },
    { id: 'problemas', label: 'Con problema', cuenta: cuentas.problemas },
  ]

  const opcionesCanal: Opcion<string>[] = [
    { id: '', label: 'Todos los canales' },
    ...canales.map(c => ({ id: c, label: c === 'web' ? 'Venta propia' : c })),
  ]

  return (
    <Operacion
      contexto={
        <>
          <Bloque titulo="La puerta ahora">
            <Datos>
              <Dato label="Día abierto">{dia.nombre}</Dato>
              <Dato label="Adentro" tono="ok">{adentro} de {total}</Dato>
              {enCola > 0 && <Dato label="Sin sincronizar" tono="warn">{enCola}</Dato>}
            </Datos>
            {enCola > 0 && (
              <Boton tono="secundario" tam="sm" className="mt-3" onClick={onPendientes}>
                Ver pendientes
              </Boton>
            )}
          </Bloque>

          <Bloque titulo="Para revisar" className="mt-6">
            <Datos>
              <Dato label="Pago doble" tono={cuentas.problemas ? 'warn' : undefined}>
                {personas.filter(p => p.pagoDoble).length}
              </Dato>
              <Dato label="Sin día" tono="coral">{personas.filter(p => p.sinDia).length}</Dato>
              <Dato label="Sin nombre">{personas.filter(p => !p.nombre).length}</Dato>
            </Datos>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              «Sin día» es el caso caro: esa gente no aparece en ninguna puerta y no se
              entera nadie hasta que se queda afuera.
            </p>
          </Bloque>

          <Limite>
            Acá se corrige y se da de baja, pero no se cobra ni se reembolsa: eso vive en
            «Ventas». Y quien deja de aparecer en un CSV no se da de baja solo —
            reimportar actualiza, nunca borra.
          </Limite>
        </>
      }
    >
      <Tarjetas>
        <Tarjeta label="En la lista" valor={personas.length} />
        <Tarjeta label="Ya entraron" valor={cuentas.entraron} tono="ok" detalle="los tres días" />
        <Tarjeta label="Canales" valor={canales.length} detalle={canales.join(' · ')} />
        <Tarjeta
          label="Para revisar"
          valor={cuentas.problemas}
          tono={cuentas.problemas ? 'coral' : undefined}
          detalle="pago doble, sin día o sin nombre"
        />
      </Tarjetas>

      <Tabs opciones={filtros} valor={filtro} onCambio={setFiltro} etiqueta="Filtrar el padrón" />

      <div className="mt-4 mb-4 flex flex-col gap-3">
        <div className="md:max-w-md">
          <Buscador
            id="buscar-padron"
            valor={busqueda}
            onCambio={onBusqueda}
            placeholder="Buscar por nombre, mail o empresa"
          />
        </div>
        <Pildoras
          opciones={opcionesCanal}
          valor={canal}
          onCambio={setCanal}
          etiqueta="Canal"
          tam="sm"
        />
        <p className="text-xs text-gray-500">{visibles.length} de {personas.length}</p>
      </div>

      <Tabla
        columnas={columnas}
        filas={visibles}
        claveDe={p => `${p.origen}-${p.id}`}
        onFila={onAbrir}
        vacio="Nadie con esos filtros."
      />
    </Operacion>
  )
}

export default Padron
