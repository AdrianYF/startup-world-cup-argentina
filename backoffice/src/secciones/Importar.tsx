import { useState, type ChangeEvent } from 'react'
import { Chip } from '../ui/Estado'
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
 * Siempre pasa primero por la vista previa. Un import a ciegas sobre la lista
 * de acreditación, con el evento encima, no es algo que convenga poder hacer de
 * un solo click.
 */
const CANALES = [
  { id: 'luma', label: 'Luma', ayuda: 'slug del evento, ej. quzhnee8', dias: 'Mié 5' },
  { id: 'startupgrind', label: 'Startup Grind', ayuda: 'id del evento, ej. 31263', dias: 'Jue 6 + Vie 7' },
]

const INPUT =
  'w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-2.5 text-base ' +
  'text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent'
const LABEL = 'mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted'

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

  function elegir(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setArchivo(f.name)
    setPrevia(null)
    setEscrito(false)
    setError('')
    f.text().then(setCsv).catch(() => setError('No pudimos leer ese archivo.'))
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

  const listo = Boolean(csv && evento.trim())

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <span className={LABEL}>Canal</span>
          <div className="flex flex-wrap gap-1.5">
            {CANALES.map(c => (
              <button
                key={c.id}
                onClick={() => { setOrigen(c.id); setPrevia(null); setEscrito(false) }}
                className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${
                  c.id === origen ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="im-evento">Id del evento</label>
          <input
            id="im-evento"
            className={INPUT}
            value={evento}
            onChange={e => { setEvento(e.target.value); setPrevia(null); setEscrito(false) }}
            placeholder={canal.ayuda}
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500">
            Es la clave del upsert junto con el canal y el mail: reimportar el mismo
            evento actualiza en vez de duplicar.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="im-dias">
            Días <span className="font-normal normal-case tracking-normal text-gray-600">(opcional)</span>
          </label>
          <input
            id="im-dias"
            className={INPUT}
            value={dias}
            onChange={e => { setDias(e.target.value); setPrevia(null) }}
            placeholder={`por defecto: ${canal.dias}`}
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tiene que contener «Mié», «Jue» o «Vie» tal cual: la puerta los busca dentro
            de este texto. Lo que no coincida no aparece en ninguna lista.
          </p>
        </div>

        <div>
          <span className={LABEL}>Archivo CSV</span>
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

      {error && (
        <p className="mt-5 rounded-xl border border-swc-coral/40 bg-swc-coral/10 px-4 py-3 text-sm font-bold text-swc-coral">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={!listo || Boolean(ocupado)}
          onClick={() => correr(true)}
          className="rounded-full border border-swc-accent/40 px-6 py-3 text-sm font-black text-swc-accent disabled:opacity-30"
        >
          {ocupado === 'previa' ? 'Leyendo…' : 'Ver qué va a pasar'}
        </button>
        {/* Escribir sólo se habilita después de la vista previa: es la lista de
            acreditación del evento y no hay "deshacer". */}
        <button
          disabled={!previa || escrito || Boolean(ocupado)}
          onClick={() => correr(false)}
          className="rounded-full bg-swc-ok px-6 py-3 text-sm font-black text-swc-bg disabled:opacity-30"
        >
          {ocupado === 'import' ? 'Importando…' : 'Importar'}
        </button>
      </div>

      {previa?.resumen && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-black text-swc-light">
              {escrito ? 'Importado' : 'Vista previa'}
            </h2>
            <Chip tono={escrito ? 'ok' : 'warn'}>
              {escrito ? 'escrito en la base' : 'no se escribió nada'}
            </Chip>
          </div>

          <dl className="text-sm">
            <Dato label="Filas en el archivo" valor={previa.resumen.filas} />
            <Dato label="Personas" valor={previa.resumen.registros} />
            <Dato label="Entran a la puerta" valor={previa.resumen.confirmados} tono="ok" />
            {previa.resumen.pendientes > 0 && (
              <Dato label="Pendientes (no entran)" valor={previa.resumen.pendientes} tono="warn" />
            )}
            {previa.resumen.rechazados > 0 && (
              <Dato label="Rechazados (no entran)" valor={previa.resumen.rechazados} />
            )}
            {previa.resumen.sinEmail > 0 && (
              <Dato label="Sin mail (se saltean)" valor={previa.resumen.sinEmail} tono="coral" />
            )}
            {previa.resumen.repetidos > 0 && (
              <Dato label="Mail repetido (queda el último)" valor={previa.resumen.repetidos} />
            )}
            <Dato label="Días asignados" valor={previa.dias || '—'} />
          </dl>

          {previa.mapa && (
            <>
              <p className="mt-4 mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                Columnas detectadas
              </p>
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

      <p className="mt-6 text-xs text-gray-500">
        Reimportar el mismo evento actualiza las filas por mail, no duplica. Pero quien
        deja de aparecer en el CSV —un reembolso en Startup Grind— NO se da de baja solo:
        eso se hace desde «Asistentes», sacándolo de la lista.
      </p>
    </div>
  )
}

function Dato({ label, valor, tono }: { label: string; valor: number | string; tono?: 'ok' | 'warn' | 'coral' }) {
  const color = tono === 'ok' ? 'text-swc-ok'
    : tono === 'warn' ? 'text-swc-warn'
    : tono === 'coral' ? 'text-swc-coral'
    : 'text-swc-light'
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/5 py-1.5 first:border-t-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`font-bold tabular-nums ${color}`}>{valor}</dd>
    </div>
  )
}

export default Importar
