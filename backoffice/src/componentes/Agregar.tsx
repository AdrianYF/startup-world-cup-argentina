import { useMemo, useState, type FormEvent } from 'react'
import { mensajeDeError } from '../lib/api'
import type { Persona } from '../lib/tipos'

/**
 * Alta en el check-in: alguien que no está en ninguna lista y hay que dejar entrar.
 *
 * Pide lo mínimo. Con una persona parada adelante y cola atrás, cada campo de
 * más es tiempo — por eso sólo el nombre es obligatorio, y el mail, que en los
 * canales externos siempre viene, acá es opcional.
 *
 * Agregar y acreditar son un solo botón: a nadie se lo da de alta para dejarlo
 * afuera.
 */
type Datos = {
  nombre: string
  email?: string
  telefono?: string
  empresa?: string
  motivo?: string
}

type Props = {
  /** Lo que venía tipeado en el buscador. Casi siempre es el nombre. */
  inicial?: string
  dia: string
  /** Para avisar antes de crear a alguien que ya está. */
  buscarParecidos: (nombre: string) => Persona[]
  onCerrar: () => void
  onAgregar: (datos: Datos) => Promise<void>
}

/**
 * Por qué se lo deja entrar.
 *
 * Acá NO se cobra: la compra se hace afuera y el check-in sólo la valida.
 * "Compró, no figura" existe para marcar a quien dice haber comprado y no
 * aparece, y poder buscar su orden después. Los demás sirven para saber, al
 * cerrar el evento, de dónde salió cada alta.
 */
const MOTIVOS = [
  { id: '', label: 'Sin especificar' },
  { id: 'invitacion', label: 'Invitación' },
  { id: 'prensa', label: 'Prensa' },
  { id: 'speaker', label: 'Speaker' },
  { id: 'staff', label: 'Staff' },
  { id: 'comprada', label: 'Compró, no figura' },
]

const INPUT =
  'w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-3 text-base ' +
  'text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent'

const LABEL = 'mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted'
const OPCIONAL = 'font-normal normal-case tracking-normal text-gray-600'

function Agregar({ inicial = '', dia, buscarParecidos, onCerrar, onAgregar }: Props) {
  const [nombre, setNombre] = useState(inicial)
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Dar de alta a alguien que ya está crea una fila más y ensucia los conteos
  // —sin mail, el índice único de la base no lo puede atajar—. Se avisa acá, que
  // es el único momento en que alguien lo puede corregir.
  const parecidos = useMemo(
    () => (nombre.trim().length >= 3 ? buscarParecidos(nombre).slice(0, 3) : []),
    [nombre, buscarParecidos],
  )

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (nombre.trim().length < 2 || enviando) return

    setEnviando(true)
    setError('')
    try {
      await onAgregar({ nombre, email, telefono, empresa, motivo })
      onCerrar()
    } catch (err) {
      // El formulario NO se cierra: si el mail no pasó la validación, cerrarlo
      // obligaría a tipear todo de nuevo con la persona esperando adelante.
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      <form
        onSubmit={enviar}
        className="relative mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8"
      >
        <h2 className="text-xl font-black text-swc-light">Agregar a la lista</h2>
        <p className="mt-1 mb-5 text-sm text-swc-muted">
          Queda acreditada para el {dia}, como alta de check-in.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className={LABEL} htmlFor="ag-nombre">Nombre y apellido</label>
            <input
              id="ag-nombre"
              className={INPUT}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              autoFocus
              autoComplete="off"
              autoCapitalize="words"
              required
              minLength={2}
            />
            {parecidos.length > 0 && (
              <div className="mt-2 rounded-xl border border-swc-warn/40 bg-swc-warn/10 px-3 py-2">
                <p className="text-xs font-bold text-swc-warn">
                  {parecidos.length === 1 ? 'Ya hay alguien parecido:' : 'Ya hay gente parecida:'}
                </p>
                <ul className="mt-1 text-xs text-gray-300">
                  {parecidos.map(p => (
                    <li key={`${p.origen}-${p.id}`} className="truncate">
                      {p.nombre}
                      {p.empresa ? ` · ${p.empresa}` : ''}
                      <span className="text-gray-500"> · {p.entrada}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-gray-500">
                  Si es la misma persona, cerrá y buscala por apellido.
                </p>
              </div>
            )}
          </div>

          <div>
            <span className={LABEL}>Por qué entra</span>
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMotivo(m.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                    m.id === motivo ? 'bg-swc-accent text-swc-bg' : 'bg-white/[0.06] text-swc-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor="ag-email">
              Email <span className={OPCIONAL}>(opcional)</span>
            </label>
            <input
              id="ag-email"
              type="email"
              className={INPUT}
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="email"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="ag-telefono">
              Teléfono <span className={OPCIONAL}>(opcional)</span>
            </label>
            <input
              id="ag-telefono"
              className={INPUT}
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              autoComplete="off"
              inputMode="tel"
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="ag-empresa">
              Empresa <span className={OPCIONAL}>(opcional)</span>
            </label>
            <input
              id="ag-empresa"
              className={INPUT}
              value={empresa}
              onChange={e => setEmpresa(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-swc-coral/40 bg-swc-coral/10 px-4 py-3 text-sm font-bold text-swc-coral">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={nombre.trim().length < 2 || enviando}
          className="mt-6 w-full rounded-full bg-swc-ok px-6 py-4 text-base font-black text-swc-bg disabled:opacity-40"
        >
          {enviando ? 'Agregando…' : 'Agregar y acreditar'}
        </button>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-4 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500"
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}

export default Agregar
