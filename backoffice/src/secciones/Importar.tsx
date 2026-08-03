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
    ayuda: 'slug del evento, ej. quzhnee8',
    // Sin prefijo de días a propósito: Luma corre un evento por día y no hay uno
    // que esté bien la mayoría de las veces. Antes había un default de «Mié 5» y
    // era una trampa: importar el CSV del jueves sin tocar nada etiquetaba a esa
    // gente con el día equivocado, no aparecían en ninguna lista, y como el día
    // existe tampoco saltaba la alarma de «sin día».
    dias: [] as string[],
    aviso: 'Luma tiene un evento por día. Elegí cuál estás importando — no hay valor por defecto justamente porque adivinarlo mal deja a esa gente afuera de la puerta.',
  },
  {
    id: 'startupgrind',
    label: 'Startup Grind',
    ayuda: 'id del evento, ej. 31263',
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
  { id: 'archivo', label: 'Canal y archivo', detalle: 'De dónde salió el export y a qué evento pertenece.' },
  { id: 'previa', label: 'Vista previa', detalle: 'Qué columnas detectó y a cuánta gente toca. No escribe nada.' },
  { id: 'escribir', label: 'Importar', detalle: 'Upsert por canal + evento + mail. Actualiza, nunca duplica.' },
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
      const r = await importarCSV({ csv, origen, evento: evento.trim(), dias: textoDias, seco })
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
              <Dato label="Días" tono={dias.length ? undefined : 'coral'}>
                {textoDias || 'sin elegir'}
              </Dato>
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
            onCambio={id => {
              setOrigen(id)
              // Los días vuelven al prefijo del canal nuevo: los del anterior
              // describían otro evento.
              setDias(CANALES.find(c => c.id === id)!.dias)
              invalidar()
            }}
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

        <div>
          <Rotulo className="mb-1.5">Días que habilita esta tanda</Rotulo>
          <PildorasMulti
            opciones={DIAS_IMPORT}
            valores={dias}
            onCambio={ids => { setDias(ids); invalidar() }}
            etiqueta="Días que habilita esta tanda"
          />
          <p className="mt-1 text-xs text-gray-500">
            {dias.length
              ? <>Se guarda como «<span className="text-gray-300">{textoDias}</span>».{' '}</>
              : 'Elegí al menos uno: sin días, esa gente no aparece en ninguna lista. '}
            El miércoles 5 es el side event en otro venue — entra al padrón pero no abre
            puerta acá.
          </p>
        </div>

        {canal.aviso && <Aviso tono="info">{canal.aviso}</Aviso>}

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
