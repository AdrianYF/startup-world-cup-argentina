import { lazy, Suspense } from 'react'
import { Boton } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Dato, Datos, Rotulo } from '../ui/Campos'
import { Chip } from '../ui/Estado'
import { Hoja } from '../ui/Hoja'
import { hora } from '../lib/buscar'
import { nombreCanal } from '../lib/canales'
import { traducirDias, traducirEntrada } from '../lib/traducir'
import { esAsistente, fechaCorta, type Asistente } from '../lib/admin'
import { etiquetaVip, type Checkin, type Dia, type Persona } from '../lib/tipos'

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
 *   · desde Inscriptos — además, corregir los datos, reenviar el mail y dar de baja
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
  /** Modo inscriptos: habilita edición y las acciones de soporte. */
  editable: boolean
  onAcreditar: () => void
  onAnular: (checkin: Checkin) => void
  onGuardado: () => void
  onCerrar: () => void
}) {
  const completa = esAsistente(persona) ? persona : null
  const yaEntro = ingresos.length > 0
  const canal = nombreCanal(persona.origen)

  return (
    <Hoja
      titulo={persona.nombre || 'No name'}
      subtitulo={persona.email}
      // En la puerta va pegada abajo —el botón de acreditar tiene que caer donde
      // está el pulgar—; en Inscriptos se lee sentado y se centra.
      posicion={editable ? 'auto' : 'abajo'}
      onCerrar={onCerrar}
      chips={
        <>
          {/* Primero el VIP: es lo que cambia a dónde entra la persona, y si
              además come. */}
          {etiquetaVip(persona.entrada) && <Chip tono="oro">{etiquetaVip(persona.entrada)}</Chip>}
          <Chip tono="neutro">{canal}</Chip>
          {persona.pagoDoble && <Chip tono="warn">2 payments</Chip>}
          {completa?.sinDia && <Chip tono="coral">no day</Chip>}
        </>
      }
    >
      {completa?.sinDia && (
        <Aviso tono="error" className="mb-4" titulo="Doesn't show up at any door">
          Their days are “{persona.dias}”, which matches no day of the event. Fix it in
          the source channel, or by re-importing the CSV from “Import”.
        </Aviso>
      )}

      {persona.pagoDoble && (
        <Aviso tono="warn" className="mb-4" titulo="Paid twice for the same ticket">
          They show up in both Startup Grind and Mercado Pago. The refund goes through
          the channel that overcharged; here it gets marked from “Sales”.
        </Aviso>
      )}

      <Datos>
        <Dato label="Ticket">{traducirEntrada(persona.entrada)}</Dato>
        <Dato label="Days">{traducirDias(persona.dias)}</Dato>
        <Dato label="Channel">{canal}</Dato>
        {persona.empresa && <Dato label="Company">{persona.empresa}</Dato>}
        {persona.telefono && <Dato label="Phone">{persona.telefono}</Dato>}
        {completa && <Dato label="Registered">{fechaCorta(completa.registradoEn)}</Dato>}
        {completa && (
          <Dato label="Last check-in" tono={completa.usadaEn ? 'ok' : undefined}>
            {completa.usadaEn ? fechaCorta(completa.usadaEn) : "didn't come in"}
          </Dato>
        )}
      </Datos>

      {/* Los ingresos del día, todos y con su hora.
          Antes se veía sólo el último, y anular pasados los siete segundos del
          «Deshacer» era un update a mano en Supabase con la fila esperando. */}
      {yaEntro && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Rotulo className="mb-2">
            {ingresos.length === 1 ? "Today's check-in" : `${ingresos.length} check-ins today`}
          </Rotulo>
          <ul className="flex flex-col gap-1.5">
            {ingresos.map(c => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300">
                  <span className="font-bold tabular-nums text-swc-ok">{hora(c.creadoEn)}</span>
                  {c.por ? <span className="text-gray-500"> · {c.por}</span> : null}
                </span>
                <Boton tono="fantasma" tam="sm" onClick={() => onAnular(c)}>Undo</Boton>
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
          // En la puerta la ficha se abre con Enter desde el buscador, así que el
          // botón llega enfocado y un segundo Enter acredita: tipear tres letras
          // y dos veces Enter, sin tocar el mouse. En el celular no cambia nada
          // —enfocar un botón no abre teclado— y en Inscriptos no va, porque ahí
          // la acción de la pantalla es corregir datos, no dejar entrar.
          autoFocus={!editable}
        >
          {yaEntro ? 'Check in anyway' : `Check in${editable ? ` for ${dia.nombre}` : ''}`}
        </Boton>
      )}

      {editable && (
        <Suspense fallback={<p className="mt-5 text-xs text-gray-600">Loading actions…</p>}>
          <AccionesPersona persona={persona} onGuardado={onGuardado} />
        </Suspense>
      )}
    </Hoja>
  )
}

export default FichaPersona
