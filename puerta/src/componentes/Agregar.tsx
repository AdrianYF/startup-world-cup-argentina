import { useState, type FormEvent } from 'react'

/**
 * Alta en la puerta: alguien que no está en ninguna lista y hay que dejar entrar.
 *
 * Pide lo mínimo. Con una persona parada adelante y cola atrás, cada campo de
 * más es tiempo — por eso sólo el nombre es obligatorio, y el mail, que en los
 * canales externos siempre viene, acá es opcional.
 *
 * Agregar y acreditar son un solo botón: a nadie se lo da de alta para dejarlo
 * afuera.
 */
type Props = {
  /** Lo que venía tipeado en el buscador. Casi siempre es el nombre. */
  inicial?: string
  dia: string
  onCerrar: () => void
  onAgregar: (datos: { nombre: string; email?: string; empresa?: string }) => void
}

const INPUT =
  'w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-3 text-base ' +
  'text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent'

const LABEL = 'mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted'
const OPCIONAL = 'font-normal normal-case tracking-normal text-gray-600'

function Agregar({ inicial = '', dia, onCerrar, onAgregar }: Props) {
  const [nombre, setNombre] = useState(inicial)
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (nombre.trim().length < 2) return
    onAgregar({ nombre, email, empresa })
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      <form
        onSubmit={enviar}
        className="relative mx-auto w-full max-w-lg rounded-t-2xl border-t border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8"
      >
        <h2 className="text-xl font-black text-swc-light">Agregar a la lista</h2>
        <p className="mt-1 mb-5 text-sm text-swc-muted">
          Queda acreditada para el {dia}, como alta de puerta.
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

        <button
          type="submit"
          disabled={nombre.trim().length < 2}
          className="mt-6 w-full rounded-full bg-swc-ok px-6 py-4 text-base font-black text-swc-bg disabled:opacity-40"
        >
          Agregar y acreditar
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
