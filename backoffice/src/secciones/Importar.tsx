import { useState, type ChangeEvent } from 'react'
import { Boton, Pildoras, type Opcion } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Campo, Dato, Datos, Opcional, Rotulo } from '../ui/Campos'
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
 * pisado el padrón.
 */
const CANALES = [
  { id: 'luma', label: 'Luma', ayuda: 'slug del evento, ej. quzhnee8', dias: 'Mié 5' },
  { id: 'startupgrind', label: 'Startup Grind', ayuda: 'id del evento, ej. 31263', dias: 'Jue 6 + Vie 7' },
]

const PASOS: Paso[] = [
  { id: 'archivo', label: 'Canal y archivo', detalle: 'De dónde salió el export y a qué evento pertenece.' },
  { id: 'previa', label: 'Vista previa', detalle: 'Qué columnas detectó y a cuánta gente toca. No escribe nada.' },
  { id: 'escribir', label: 'Importar', detalle: 'Upsert por canal + evento + mail. Actualiza, nunca duplica.' },
]

function Importar({ onSinSesion }: { onSinSesion: () => void }) {
  const [origen, setOrigen] = useState('startupgrind')
  const [evento, setEvento] = useState('')
  const [dias, setDias] = useState('')
  const [csv, setCsv] = useState('')
  const [archivo, setArchivo] = useState('')
  const [previa, setPrevia] = useState<ResumenImport | null>(null)
  const [escrito, setEscrito] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState('')

  const canal = CANALES.find(c => c.id === origen)!
  const listo = Boolean(csv && evento.trim())

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
    f.text().then(setCsv).catch(() => setError('No pudimos leer ese archivo.'))
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
      const r = await importarCSV({ csv, origen, evento: evento.trim(), dias: dias.trim() || undefined, seco })
      if (r.error) {
        setError(r.error + (r.columnas ? ` · columnas del archivo: ${r.columnas.join(', ')}` : ''))
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
          <Bloque titulo="Flujo del import">
            <Pasos pasos={PASOS} actual={paso} />
          </Bloque>

          <Bloque titulo="Qué escribe" className="mt-6">
            <Datos>
              <Dato label="Clave del upsert">canal + evento + mail</Dato>
              <Dato label="Mail repetido">actualiza la fila</Dato>
              <Dato label="Días por defecto">{canal.dias}</Dato>
            </Datos>
          </Bloque>

          <Limite>
            Reimportar el mismo evento actualiza por mail, no duplica. Pero quien deja de
            aparecer en el CSV —un reembolso en Startup Grind— <strong>no</strong> se da de
            baja solo: eso se hace desde «Personas», sacándolo de la lista.
          </Limite>
        </>
      }
    >
      <div className="flex max-w-xl flex-col gap-4">
        <div>
          <Rotulo className="mb-1.5">Canal</Rotulo>
          <Pildoras
            opciones={opcionesCanal}
            valor={origen}
            onCambio={id => { setOrigen(id); invalidar() }}
            etiqueta="Canal del export"
          />
        </div>

        <Campo
          id="im-evento"
          label="Id del evento"
          value={evento}
          onChange={e => { setEvento(e.target.value); invalidar() }}
          placeholder={canal.ayuda}
          autoComplete="off"
          ayuda="Es la clave del upsert junto con el canal y el mail: reimportar el mismo evento actualiza en vez de duplicar."
        />

        <Campo
          id="im-dias"
          label={<>Días<Opcional /></>}
          value={dias}
          onChange={e => { setDias(e.target.value); invalidar() }}
          placeholder={`por defecto: ${canal.dias}`}
          autoComplete="off"
          ayuda="Tiene que contener «Mié», «Jue» o «Vie» tal cual: la puerta los busca dentro de este texto. Lo que no coincida no aparece en ninguna lista."
        />

        <div>
          <Rotulo className="mb-1.5">Archivo CSV</Rotulo>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-4">
            <input type="file" accept=".csv,text/csv" onChange={elegir} className="hidden" />
            <span className="rounded-full border border-swc-accent/40 px-4 py-1.5 text-xs font-black text-swc-accent">
              Elegir
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-400">
              {archivo || 'El export del panel de organizador'}
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
          ocupado={ocupado === 'previa' ? 'Leyendo…' : undefined}
        >
          Ver qué va a pasar
        </Boton>
        {/* Escribir sólo se habilita después de la vista previa: es la lista de
            acreditación del evento y no hay «deshacer». */}
        <Boton
          tono="ok"
          tam="lg"
          disabled={!previa || escrito || Boolean(ocupado)}
          onClick={() => correr(false)}
          ocupado={ocupado === 'import' ? 'Importando…' : undefined}
        >
          Importar
        </Boton>
      </div>

      {previa?.resumen && (
        <div className="mt-6 max-w-xl rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-black text-swc-light">
              {escrito ? 'Importado' : 'Vista previa'}
            </h2>
            <Chip tono={escrito ? 'ok' : 'warn'}>
              {escrito ? 'escrito en la base' : 'no se escribió nada'}
            </Chip>
          </div>

          <Datos>
            <Dato label="Filas en el archivo">{previa.resumen.filas}</Dato>
            <Dato label="Personas">{previa.resumen.registros}</Dato>
            <Dato label="Entran a la puerta" tono="ok">{previa.resumen.confirmados}</Dato>
            {previa.resumen.pendientes > 0 && (
              <Dato label="Pendientes (no entran)" tono="warn">{previa.resumen.pendientes}</Dato>
            )}
            {previa.resumen.rechazados > 0 && (
              <Dato label="Rechazados (no entran)">{previa.resumen.rechazados}</Dato>
            )}
            {previa.resumen.sinEmail > 0 && (
              <Dato label="Sin mail (se saltean)" tono="coral">{previa.resumen.sinEmail}</Dato>
            )}
            {previa.resumen.repetidos > 0 && (
              <Dato label="Mail repetido (queda el último)">{previa.resumen.repetidos}</Dato>
            )}
            <Dato label="Días asignados">{previa.dias || '—'}</Dato>
          </Datos>

          {previa.mapa && (
            <>
              <Rotulo className="mt-4 mb-1.5">Columnas detectadas</Rotulo>
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
