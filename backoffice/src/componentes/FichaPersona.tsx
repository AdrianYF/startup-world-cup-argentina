import { lazy, Suspense } from 'react'
import { Boton } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Dato, Datos, Rotulo } from '../ui/Campos'
import { Chip } from '../ui/Estado'
import { Hoja } from '../ui/Hoja'
import { hora } from '../lib/buscar'
import { esAsistente, fechaCorta, type Asistente } from '../lib/admin'
import type { Checkin, Dia, Persona } from '../lib/tipos'

/**
 * La ficha de una persona. Una sola, para los dos modos.
 *
 * Antes eran dos: `Panel` en la puerta —datos y el botón de acreditar— y
 * `FichaAsistente` en la mesa —edición, reenvío, baja—. Sobre la misma fila de
 * la misma tabla. Si en la puerta veías el mail mal escrito tenías que cambiar
 * de sección y buscar a la persona otra vez.
 *
 * Lo que cambia entre los dos modos no es la ficha, son las acciones que
 * habilita el contexto:
 *
 *   · desde el día  — acreditar y anular ingresos; nada que se pueda romper
 *   · desde el padrón — además, corregir los datos, reenviar el mail y dar de baja
 *
 * Las acciones de la mesa van en un chunk aparte a propósito: se abren sentado y
 * con wifi, y no tienen por qué viajar en el bundle que se baja parado en la
 * fila de entrada.
 */
const AccionesPersona = lazy(() => import('./AccionesPersona'))

function FichaPersona({
  persona, ingresos, dia, editable, onAcreditar, onAnular, onGuardado, onCerrar,
}: {
  persona: Persona | Asistente
  /** Los ingresos del día vigente. Vacío si esta persona no está en esa lista. */
  ingresos: Checkin[]
  /** El día contra el que se acredita. Sin día no se puede dejar entrar a nadie. */
  dia: Dia | null
  /** Modo padrón: habilita edición y las acciones de soporte. */
  editable: boolean
  onAcreditar: () => void
  onAnular: (checkin: Checkin) => void
  onGuardado: () => void
  onCerrar: () => void
}) {
  const completa = esAsistente(persona) ? persona : null
  const yaEntro = ingresos.length > 0
  const esWeb = persona.origen === 'web'

  return (
    <Hoja
      titulo={persona.nombre || 'Sin nombre'}
      subtitulo={persona.email}
      anclada={!editable}
      onCerrar={onCerrar}
      chips={
        <>
          <Chip tono="neutro">{esWeb ? 'venta propia' : persona.origen}</Chip>
          {persona.pagoDoble && <Chip tono="warn">2 pagos</Chip>}
          {completa?.sinDia && <Chip tono="coral">sin día</Chip>}
        </>
      }
    >
      {completa?.sinDia && (
        <Aviso tono="error" className="mb-4" titulo="No aparece en ninguna puerta">
          Sus días son «{persona.dias}» y eso no coincide con ningún día del evento.
          Se corrige en el canal de origen, o reimportando el CSV desde «Importar».
        </Aviso>
      )}

      {persona.pagoDoble && (
        <Aviso tono="warn" className="mb-4" titulo="Pagó dos veces la misma entrada">
          Figura en Startup Grind y en la venta propia. El reembolso se hace en el canal
          donde se cobró de más; acá se marca desde «Ventas».
        </Aviso>
      )}

      <Datos>
        <Dato label="Entrada">{persona.entrada}</Dato>
        <Dato label="Días">{persona.dias}</Dato>
        <Dato label="Canal">{esWeb ? 'Venta propia' : persona.origen}</Dato>
        {persona.empresa && <Dato label="Empresa">{persona.empresa}</Dato>}
        {persona.telefono && <Dato label="Teléfono">{persona.telefono}</Dato>}
        {completa && <Dato label="Registrada">{fechaCorta(completa.registradoEn)}</Dato>}
        {completa && (
          <Dato label="Último ingreso" tono={completa.usadaEn ? 'ok' : undefined}>
            {completa.usadaEn ? fechaCorta(completa.usadaEn) : 'no entró'}
          </Dato>
        )}
      </Datos>

      {/* Los ingresos del día, todos y con su hora.
          Antes se veía sólo el último, y anular pasados los siete segundos del
          «Deshacer» era un update a mano en Supabase con la fila esperando. */}
      {yaEntro && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Rotulo className="mb-2">
            {ingresos.length === 1 ? 'Ingreso de hoy' : `${ingresos.length} ingresos hoy`}
          </Rotulo>
          <ul className="flex flex-col gap-1.5">
            {ingresos.map(c => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300">
                  <span className="font-bold tabular-nums text-swc-ok">{hora(c.creadoEn)}</span>
                  {c.por ? <span className="text-gray-500"> · {c.por}</span> : null}
                </span>
                <Boton tono="fantasma" tam="sm" onClick={() => onAnular(c)}>Anular</Boton>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Si ya entró, el botón no desaparece: el caso real es alguien que vuelve
          de fumar, no un fraude. Sólo baja de tono. */}
      {dia && (
        <Boton
          tono={yaEntro ? 'fantasma' : 'ok'}
          tam="lg"
          ancho
          onClick={onAcreditar}
          className="mt-5"
        >
          {yaEntro ? 'Acreditar igual' : `Acreditar${editable ? ` para el ${dia.nombre}` : ''}`}
        </Boton>
      )}

      {editable && (
        <Suspense fallback={<p className="mt-5 text-xs text-gray-600">Cargando acciones…</p>}>
          <AccionesPersona persona={persona} onGuardado={onGuardado} />
        </Suspense>
      )}
    </Hoja>
  )
}

export default FichaPersona
