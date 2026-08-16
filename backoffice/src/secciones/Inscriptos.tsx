import { useEffect, useMemo, useRef, useState } from 'react'
import { Boton, Pildoras, Tabs, type Opcion } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Buscador, Dato, Datos } from '../ui/Campos'
import { Cargando, Chip, Roto, Tarjeta, Tarjetas } from '../ui/Estado'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import Tabla, { type Columna } from '../ui/Tabla'
import { aCSV } from '../../../api/_lib/csv.js'
import { esVIP } from '../../../api/_lib/vip.js'
import { filtrar, ordenarPorApellido } from '../lib/buscar'
import { nombreCanal, ordenarCanales } from '../lib/canales'
import { traducirDias, traducirEntrada } from '../lib/traducir'
import { fechaCorta, traerAsistentes, useRecurso, type Asistente } from '../lib/admin'
import type { Dia } from '../lib/tipos'

/**
 * Los inscriptos: la lista entera, sin filtro de día.
 *
 * Es la mitad «sentado» de Personas y por eso vive en su propio chunk: trae la
 * tabla, el cliente de `/api/backoffice` y la lista completa con teléfono y
 * empresa de cada persona. Nada de eso tiene que bajarse en el celular que abre
 * la lista parado en la fila de entrada.
 *
 * Es la vista de soporte: el mail que no llegó, el nombre mal tipeado, el que
 * pagó dos veces. Hasta hace poco todo eso era un UPDATE a mano en el SQL Editor
 * de Supabase, con la persona esperando del otro lado del chat.
 */
type Filtro = 'todos' | 'entraron' | 'faltan' | 'problemas'

function Inscriptos({
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
  /** El freno del export de asistentes cuando quedan ingresos sin mandar. */
  const [avisandoCola, setAvisandoCola] = useState(false)

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
    () => ordenarCanales([...new Set(personas.map(p => p.origen))]),
    [personas],
  )

  const esProblema = (p: Asistente) => p.pagoDoble || p.sinDia || !p.nombre

  /**
   * Las DOS listas del evento, que no son la misma gente.
   *
   * `participantes` son los que efectivamente entraron — las altas de puerta
   * incluidas, porque estuvieron ahí.
   *
   * `inscriptos` son los que sacaron entrada por un canal. Las altas de puerta
   * quedan afuera a propósito: nunca se inscribieron, se anotaron en la puerta
   * el día del evento. Meterlas acá infla el padrón contra el que se mide el
   * no-show y hace que la conversión de cada canal dé más baja de lo que fue.
   */
  const participantes = useMemo(() => personas.filter(p => p.usadaEn), [personas])
  const inscriptos = useMemo(() => personas.filter(p => p.origen !== 'puerta'), [personas])

  const cuentas = useMemo(() => ({
    todos: personas.length,
    entraron: participantes.length,
    faltan: personas.length - participantes.length,
    problemas: personas.filter(esProblema).length,
  }), [personas, participantes])

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
      titulo: 'Name',
      orden: p => p.nombre || 'zzz',
      celda: p => (
        <span className="flex items-center gap-1.5">
          {p.nombre || <span className="text-gray-500">(no name)</span>}
          {p.pagoDoble && <Chip tono="warn">2 payments</Chip>}
          {p.sinDia && <Chip tono="coral">no day</Chip>}
        </span>
      ),
    },
    { clave: 'email', titulo: 'Email', orden: p => p.email, celda: p => p.email },
    {
      clave: 'empresa',
      titulo: 'Company',
      orden: p => p.empresa || '',
      celda: p => p.empresa || '—',
      soloTabla: true,
    },
    {
      clave: 'entrada',
      titulo: 'Ticket',
      // Por lo que se ve y no por el texto crudo: si la columna dice
      // «Complimentary», ordenar por «Cortesía» pone las filas donde nadie las
      // busca.
      orden: p => traducirEntrada(p.entrada),
      celda: p => traducirEntrada(p.entrada),
    },
    {
      clave: 'dias',
      titulo: 'Days',
      orden: p => traducirDias(p.dias),
      celda: p => traducirDias(p.dias),
      soloTabla: true,
    },
    {
      clave: 'origen',
      titulo: 'Channel',
      orden: p => p.origen,
      celda: p => nombreCanal(p.origen),
    },
    {
      clave: 'usadaEn',
      titulo: 'Check-in',
      orden: p => p.usadaEn || '',
      celda: p => (p.usadaEn
        ? <span className="text-swc-ok">{fechaCorta(p.usadaEn)}</span>
        : <span className="text-gray-600">—</span>),
    },
  ], [])

  /**
   * Baja una de las dos listas del evento: los que participaron o los que se
   * inscribieron.
   *
   * Las dos salen completas, sin los filtros de pantalla, y con las MISMAS
   * columnas — así se pueden comparar fila a fila y apilar una debajo de la
   * otra. Y no son subconjunto una de la otra: hay 24 personas que participaron
   * sin haberse inscrito nunca, y 83 inscriptos que no aparecieron. Contra el
   * padrón de inscriptos se mide el no-show; en participantes está quién estuvo
   * en el venue, que es lo que se le muestra a un sponsor.
   *
   * Son los mismos dos archivos que escribe `scripts/exportar-listas.mjs`, pero
   * ese necesita la terminal abierta y el `.env.local` cargado: acá salen del
   * navegador de quien organiza, con la sesión que ya tiene puesta. Reusa el
   * mismo `aCSV` que usa el importador, así el archivo que sale de acá y el que
   * sale de la terminal escapan las comas igual.
   */
  function exportar(nombre: string, filas: Asistente[]) {
    // En inglés, como la pantalla. No siguen a `scripts/exportar-listas.mjs`,
    // que es una herramienta de terminal y escribe los suyos en castellano: los
    // dos archivos de ese script se apilan entre sí, no con éste.
    const columnas = ['name', 'email', 'phone', 'company', 'ticket', 'vip', 'days', 'channel', 'came_in', 'check_in']
    // Por apellido, igual que la tabla y que la lista de la puerta: es como se
    // busca a la gente cuando el CSV termina impreso.
    const csv = aCSV(columnas, ordenarPorApellido(filas).map(p => ({
      name: p.nombre || '',
      email: p.email,
      phone: p.telefono || '',
      company: p.empresa || '',
      ticket: traducirEntrada(p.entrada),
      // Del texto ORIGINAL, no del traducido: es el mismo criterio que corre el
      // CLI, y tiene que leer siempre del mismo lado. La pregunta que llega
      // siempre después del evento —a cuántos VIP tocamos— y que antes había
      // que sacar leyendo `entrada` a ojo.
      vip: esVIP(p.entrada) ? 'yes' : 'no',
      days: traducirDias(p.dias),
      channel: nombreCanal(p.origen),
      // Redundante con `check_in`, que ya está vacío cuando no entró, pero es lo
      // que hace que el archivo se pueda filtrar y sumar en una planilla sin
      // escribir una fórmula sobre una celda de fecha.
      came_in: p.usadaEn ? 'yes' : 'no',
      check_in: p.usadaEn ? fechaCorta(p.usadaEn) : '',
    })))

    // Con BOM, igual que el CLI: sin él, Excel en Windows abre «Muñoz» como
    // «MuÃ±oz». `parseCSV` lo saca al leer, así que el archivo que sale de acá
    // vuelve a entrar por el importador sin tocarlo.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${nombre}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * El export de participantes, con un freno si quedó algo en la cola.
   *
   * El archivo sale de `usadaEn`, que la escribe el servidor cuando el ingreso
   * entra: lo que todavía está en la cola de este dispositivo baja como no-show,
   * sin decirlo. Y el que baja el CSV es justo el que no lo puede saber — la
   * cola no existe del lado del servidor, así que el número se ve bien.
   *
   * Frena, no bloquea: puede ser lo que se quiere —el corte de ahora, con lo que
   * hay— y quien opera sabe si esos pendientes son ingresos o anulaciones.
   */
  function exportarParticipantes(igual = false) {
    if (enCola > 0 && !igual) return setAvisandoCola(true)
    setAvisandoCola(false)
    exportar('participants', participantes)
  }

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Roto error={error} onReintentar={recargar} />

  const filtros: Opcion<Filtro>[] = [
    { id: 'todos', label: 'All', cuenta: cuentas.todos },
    { id: 'entraron', label: 'Came in', cuenta: cuentas.entraron },
    { id: 'faltan', label: 'Missing', cuenta: cuentas.faltan },
    { id: 'problemas', label: 'With a problem', cuenta: cuentas.problemas },
  ]

  const opcionesCanal: Opcion<string>[] = [
    { id: '', label: 'All channels' },
    ...canales.map(c => ({
      id: c,
      label: nombreCanal(c),
      cuenta: personas.filter(p => p.origen === c).length,
    })),
  ]

  return (
    <Operacion
      contexto={
        <>
          <Bloque titulo="The door right now">
            <Datos>
              <Dato label="Open day">{dia.nombre}</Dato>
              <Dato label="Inside" tono="ok">{adentro} of {total}</Dato>
              {/* El número queda acá, que es donde se mira el estado de la
                  puerta. El «Ver pendientes» se fue al aviso del panel de
                  trabajo: era la única acción de esta pantalla escondida en el
                  contexto, que en el celular va al final de todo. */}
              {enCola > 0 && <Dato label="Unsynced" tono="warn">{enCola}</Dato>}
            </Datos>
          </Bloque>

          {/* Segmentado por canal y no por «propia vs. externos»: son tres
              medios distintos —Mercado Pago, Luma, Startup Grind— y lo que se
              mira acá es cuál está trayendo gente y cuál no. */}
          <Bloque titulo="By channel" className="mt-6">
            <Datos>
              {canales.map(c => {
                const delCanal = personas.filter(p => p.origen === c)
                const entraron = delCanal.filter(p => p.usadaEn).length
                return (
                  <Dato key={c} label={nombreCanal(c)}>
                    {delCanal.length}
                    <span className="ml-1.5 font-normal text-gray-500">
                      · {entraron} came in
                    </span>
                  </Dato>
                )
              })}
            </Datos>
          </Bloque>

          <Bloque titulo="To review" className="mt-6">
            <Datos>
              <Dato label="Double payment" tono={cuentas.problemas ? 'warn' : undefined}>
                {personas.filter(p => p.pagoDoble).length}
              </Dato>
              <Dato label="No day" tono="coral">{personas.filter(p => p.sinDia).length}</Dato>
              <Dato label="No name">{personas.filter(p => !p.nombre).length}</Dato>
            </Datos>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              “No day” is the expensive one: those people show up at no door and nobody finds
              out until they are left outside.
            </p>
          </Bloque>

          <Limite>
            Here you fix and remove, but you don't charge or refund: that lives in “Sales”.
            And whoever stops showing up in a CSV is not removed on their own — re-importing
            updates, it never deletes.
          </Limite>
        </>
      }
    >
      {/* Arriba de todo y no sólo en el panel de contexto: en el celular ese
          panel va DESPUÉS de la tabla —ver `Operacion`—, así que el «sin
          sincronizar» quedaba abajo de todo justo en el dispositivo que lo
          tiene. Y es lo único de esta pantalla que no se arregla desde otro
          lado: la cola vive en este navegador y nadie más se entera. */}
      {enCola > 0 && (
        <Aviso
          tono="warn"
          className="mb-5"
          titulo={`${enCola} unsynced on this device`}
          acciones={<Boton tono="secundario" tam="sm" onClick={onPendientes}>See pending</Boton>}
        >
          Taken at the door and still sitting in this browser. Until they go out, those
          people count as not having come in: here, in Metrics and in the participants CSV.
        </Aviso>
      )}

      <Tarjetas>
        <Tarjeta label="On the list" valor={personas.length} />
        <Tarjeta label="Came in" valor={cuentas.entraron} tono="ok" detalle="all three days" />
        <Tarjeta
          label="Channels"
          valor={canales.length}
          detalle={canales.map(nombreCanal).join(' · ')}
        />
        <Tarjeta
          label="To review"
          valor={cuentas.problemas}
          tono={cuentas.problemas ? 'coral' : undefined}
          detalle="double payment, no day or no name"
        />
      </Tarjetas>

      <Tabs opciones={filtros} valor={filtro} onCambio={setFiltro} etiqueta="Filter the registered" />

      <div className="mt-4 mb-4 flex flex-col gap-3">
        <div className="md:max-w-md">
          <Buscador
            id="buscar-inscriptos"
            valor={busqueda}
            onCambio={onBusqueda}
            placeholder="Search by name, email or company"
          />
        </div>
        <Pildoras
          opciones={opcionesCanal}
          valor={canal}
          onCambio={setCanal}
          etiqueta="Channel"
          tam="sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-gray-500">{visibles.length} of {personas.length}</p>
          {/* Los dos bajan su lista entera y no lo que hay en pantalla: los
              filtros son para mirar, no para exportar. Por eso el número de
              arriba dice cuántos se están viendo y cada botón dice cuántos va a
              bajar — que no es lo mismo, ni entre ellos ni con la tabla. */}
          <Boton
            tono="fantasma"
            tam="sm"
            disabled={!participantes.length}
            onClick={() => exportarParticipantes()}
          >
            Export participants ({participantes.length})
          </Boton>
          <Boton
            tono="fantasma"
            tam="sm"
            disabled={!inscriptos.length}
            onClick={() => exportar('registered', inscriptos)}
          >
            Export registered ({inscriptos.length})
          </Boton>
        </div>

        {avisandoCola && enCola > 0 && (
          <Aviso
            tono="warn"
            titulo={`${enCola} still unsynced`}
            acciones={(
              <>
                <Boton tono="secundario" tam="sm" onClick={onPendientes}>See pending</Boton>
                <Boton tono="fantasma" tam="sm" onClick={() => exportarParticipantes(true)}>
                  Download anyway
                </Boton>
              </>
            )}
          >
            The file comes from what reached the server. If those pending items are
            check-ins, those people will show up as no-shows in the CSV.
          </Aviso>
        )}
      </div>

      <Tabla
        columnas={columnas}
        filas={visibles}
        claveDe={p => `${p.origen}-${p.id}`}
        onFila={onAbrir}
        vacio="Nobody with those filters."
      />
    </Operacion>
  )
}

export default Inscriptos
