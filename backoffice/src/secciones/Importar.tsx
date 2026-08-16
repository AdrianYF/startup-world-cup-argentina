import { useState, type ChangeEvent } from 'react'
import { Boton, Pildoras, PildorasMulti, type Opcion } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Campo, Dato, Datos, Rotulo } from '../ui/Campos'
import { Chip } from '../ui/Estado'
import { Bloque, Limite, Operacion } from '../ui/Operacion'
import { Pasos, type Paso } from '../ui/Pasos'
import { mensajeDeError } from '../lib/api'
import { importarCSV, type ResumenImport } from '../lib/admin'

/**
 * El CSV de Luma o Startup Grind, desde el navegador.
 *
 * El mismo import que hace `scripts/importar-asistentes.mjs` —comparten la
 * lógica en `api/_lib/importar.js`— pero sin necesitar la terminal ni el
 * `.env.local`. El día del evento, quien recibe el CSV por mail no siempre es
 * quien tiene el repo clonado.
 *
 * Es la pantalla que más justifica el panel de contexto: escribe sobre la lista
 * de acreditación, con el evento encima, y no tiene deshacer. El paso que se
 * saltea —la vista previa— es el único que separa un upsert correcto de haber
 * pisado la lista.
 */
const CANALES = [
  {
    id: 'luma',
    label: 'Luma',
    ayuda: 'event slug, e.g. quzhnee8',
    // Sin prefijo de días a propósito: Luma corre un evento por día y no hay uno
    // que esté bien la mayoría de las veces. Antes había un default de «Mié 5» y
    // era una trampa: importar el CSV del jueves sin tocar nada etiquetaba a esa
    // gente con el día equivocado, no aparecían en ninguna lista, y como el día
    // existe tampoco saltaba la alarma de «sin día».
    dias: [] as string[],
    aviso: 'Luma runs one event per day. Pick which one you are importing — there is no default precisely because guessing wrong leaves those people outside the door.',
  },
  {
    id: 'startupgrind',
    label: 'Startup Grind',
    ayuda: 'event id, e.g. 31263',
    // Una sola tanda que habilita los dos días. Viene marcado, pero se ve y se
    // puede desmarcar: es un prefijo, no un default invisible.
    dias: ['Jue 6', 'Vie 7'],
    aviso: '',
  },
]

/**
 * Los días asignables, en el formato EXACTO que espera `acreditacion.dias`.
 *
 * Duplica `DIAS_EVENTO` de `api/_lib/puerta.js`, y por eso se elige en vez de
 * escribirse: el match es un `includes` sobre texto libre, así que un «Jueves 6»
 * o un «jue 6» tipeados a mano no coinciden con nada y esa persona no aparece en
 * ninguna lista. El servidor valida igual — si esto se desincroniza, el import
 * falla con un error legible en vez de dejar gente invisible.
 *
 * «Mié 5» sigue asignable aunque esta puerta no lo atienda: es el side event en
 * otro venue y su gente igual entra al padrón, que es lo que hace que el cruce
 * por canal y la detección de pagos dobles funcionen.
 */
const DIAS_IMPORT: Opcion<string>[] = [
  { id: 'Mié 5', label: 'Mié 5' },
  { id: 'Jue 6', label: 'Jue 6' },
  { id: 'Vie 7', label: 'Vie 7' },
]

const PASOS: Paso[] = [
  { id: 'archivo', label: 'Channel and file', detalle: 'Where the export came from and which event it belongs to.' },
  { id: 'previa', label: 'Preview', detalle: 'Which columns it found and how many people it touches. Writes nothing.' },
  { id: 'escribir', label: 'Import', detalle: 'Upsert by channel + event + email. Updates, never duplicates.' },
]

function Importar({ onSinSesion }: { onSinSesion: () => void }) {
  const [origen, setOrigen] = useState('startupgrind')
  const [evento, setEvento] = useState('')
  const [dias, setDias] = useState<string[]>(
    () => CANALES.find(c => c.id === 'startupgrind')!.dias,
  )
  const [csv, setCsv] = useState('')
  const [archivo, setArchivo] = useState('')
  const [previa, setPrevia] = useState<ResumenImport | null>(null)
  const [escrito, setEscrito] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState('')

  const canal = CANALES.find(c => c.id === origen)!
  // El texto tal cual va a quedar en la base. Se arma en el orden de
  // `DIAS_IMPORT`, no en el de los clicks: es un dato, no una preferencia.
  const textoDias = dias.join(' + ')
  const listo = Boolean(csv && evento.trim() && dias.length)

  // El paso en curso sale del estado, no de un contador: si alguien cambia el
  // archivo después de la previa, la previa deja de valer y el flujo retrocede.
  const paso = escrito ? 2 : previa ? 2 : listo ? 1 : 0

  function elegir(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setArchivo(f.name)
    setPrevia(null)
    setEscrito(false)
    setError('')
    f.text().then(setCsv).catch(() => setError("We couldn't read that file."))
  }

  /** Cambiar cualquier entrada invalida la previa: describía otro import. */
  function invalidar() {
    setPrevia(null)
    setEscrito(false)
  }

  async function correr(seco: boolean) {
    setOcupado(seco ? 'previa' : 'import')
    setError('')
    try {
      const r = await importarCSV({ csv, origen, evento: evento.trim(), dias: textoDias, seco })
      if (r.error) {
        setError(r.error + (r.columnas ? ` · columns in the file: ${r.columnas.join(', ')}` : ''))
        setPrevia(null)
      } else {
        setPrevia(r)
        setEscrito(Boolean(r.escrito))
      }
    } catch (err) {
      // Un 401 acá significa que la sesión venció mientras se armaba el import.
      if (String(err).includes('sin_sesion')) onSinSesion()
      setError(mensajeDeError(err))
    } finally {
      setOcupado('')
    }
  }

  const opcionesCanal: Opcion<string>[] = CANALES.map(c => ({ id: c.id, label: c.label }))

  return (
    <Operacion
      contexto={
        <>
          <Bloque titulo="Import flow">
            <Pasos pasos={PASOS} actual={paso} />
          </Bloque>

          <Bloque titulo="What it writes" className="mt-6">
            <Datos>
              <Dato label="Upsert key">channel + event + email</Dato>
              <Dato label="Repeated email">updates the row</Dato>
              <Dato label="Days" tono={dias.length ? undefined : 'coral'}>
                {textoDias || 'none picked'}
              </Dato>
            </Datos>
          </Bloque>

          <Limite>
            Re-importing the same event updates by email, it doesn't duplicate. But whoever
            stops showing up in the CSV — a refund in Startup Grind — is <strong>not</strong>
            removed on their own: that happens from “Registered”, taking them off the list.
          </Limite>
        </>
      }
    >
      <div className="flex max-w-xl flex-col gap-4">
        <div>
          <Rotulo className="mb-1.5">Channel</Rotulo>
          <Pildoras
            opciones={opcionesCanal}
            valor={origen}
            onCambio={id => {
              setOrigen(id)
              // Los días vuelven al prefijo del canal nuevo: los del anterior
              // describían otro evento.
              setDias(CANALES.find(c => c.id === id)!.dias)
              invalidar()
            }}
            etiqueta="Export channel"
          />
        </div>

        <Campo
          id="im-evento"
          label="Event id"
          value={evento}
          onChange={e => { setEvento(e.target.value); invalidar() }}
          placeholder={canal.ayuda}
          autoComplete="off"
          ayuda="It is the upsert key together with the channel and the email: re-importing the same event updates instead of duplicating."
        />

        <div>
          <Rotulo className="mb-1.5">Days this batch enables</Rotulo>
          <PildorasMulti
            opciones={DIAS_IMPORT}
            valores={dias}
            onCambio={ids => { setDias(ids); invalidar() }}
            etiqueta="Days this batch enables"
          />
          <p className="mt-1 text-xs text-gray-500">
            {dias.length
              ? <>Stored as “<span className="text-gray-300">{textoDias}</span>”.{' '}</>
              : "Pick at least one: with no days, those people show up on no list. "}
            Wednesday the 5th is the side event at another venue — it enters the master list but
            opens no door here.
          </p>
        </div>

        {canal.aviso && <Aviso tono="info">{canal.aviso}</Aviso>}

        <div>
          <Rotulo className="mb-1.5">CSV file</Rotulo>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-4">
            <input type="file" accept=".csv,text/csv" onChange={elegir} className="hidden" />
            <span className="rounded-full border border-swc-accent/40 px-4 py-1.5 text-xs font-black text-swc-accent">
              Choose
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-400">
              {archivo || 'The export from the organizer panel'}
            </span>
          </label>
        </div>
      </div>

      {error && <Aviso tono="error" className="mt-5 max-w-xl">{error}</Aviso>}

      <div className="mt-5 flex flex-wrap gap-2">
        <Boton
          tono="secundario"
          tam="lg"
          disabled={!listo}
          onClick={() => correr(true)}
          ocupado={ocupado === 'previa' ? 'Reading…' : undefined}
        >
          See what will happen
        </Boton>
        {/* Escribir sólo se habilita después de la vista previa: es la lista de
            acreditación del evento y no hay «deshacer». */}
        <Boton
          tono="ok"
          tam="lg"
          disabled={!previa || escrito || Boolean(ocupado)}
          onClick={() => correr(false)}
          ocupado={ocupado === 'import' ? 'Importing…' : undefined}
        >
          Import
        </Boton>
      </div>

      {previa?.resumen && (
        <div className="mt-6 max-w-xl rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-black text-swc-light">
              {escrito ? 'Imported' : 'Preview'}
            </h2>
            <Chip tono={escrito ? 'ok' : 'warn'}>
              {escrito ? 'written to the database' : 'nothing was written'}
            </Chip>
          </div>

          <Datos>
            <Dato label="Rows in the file">{previa.resumen.filas}</Dato>
            <Dato label="People">{previa.resumen.registros}</Dato>
            <Dato label="Get into the door" tono="ok">{previa.resumen.confirmados}</Dato>
            {previa.resumen.pendientes > 0 && (
              <Dato label="Pending (they don't get in)" tono="warn">{previa.resumen.pendientes}</Dato>
            )}
            {previa.resumen.rechazados > 0 && (
              <Dato label="Rejected (they don't get in)">{previa.resumen.rechazados}</Dato>
            )}
            {previa.resumen.sinEmail > 0 && (
              <Dato label="No email (skipped)" tono="coral">{previa.resumen.sinEmail}</Dato>
            )}
            {previa.resumen.repetidos > 0 && (
              <Dato label="Repeated email (last one wins)">{previa.resumen.repetidos}</Dato>
            )}
            <Dato label="Days assigned">{previa.dias || '—'}</Dato>
          </Datos>

          {previa.mapa && (
            <>
              <Rotulo className="mt-4 mb-1.5">Columns detected</Rotulo>
              <ul className="text-xs text-gray-400">
                {Object.entries(previa.mapa)
                  .filter(([k]) => !k.startsWith('_'))
                  .map(([campo, col]) => (
                    <li key={campo}>
                      <span className="text-gray-500">{campo}</span> ← {col}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Operacion>
  )
}

export default Importar
