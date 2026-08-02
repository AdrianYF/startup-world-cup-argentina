import { useState, type FormEvent } from 'react'
import { login, mensajeDeError } from '../lib/api'
import { quien } from '../lib/almacen'

/**
 * La puerta de la puerta: un PIN compartido.
 *
 * No hay cuentas porque el equipo de acreditación se arma el día anterior y
 * nadie va a dar de alta usuarios a las ocho de la mañana. El PIN se pasa una
 * vez y el token queda guardado hasta que termina el evento.
 *
 * El nombre es opcional y queda en `checkins.por`: sirve para saber quién
 * acreditó a quién cuando dos puertas anotan a la misma persona.
 */
function Pin({ onListo }: { onListo: () => void }) {
  const [pin, setPin] = useState('')
  const [alias, setAlias] = useState(() => quien.leer())
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await login(pin)
      quien.guardar(alias.trim())
      onListo()
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={enviar} className="w-full max-w-xs">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-swc-accent text-center">
          Startup World Cup Argentina
        </p>
        <h1 className="mt-2 mb-8 text-3xl font-black text-center text-swc-light">Puerta</h1>

        <label htmlFor="pin" className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted">
          PIN
        </label>
        <input
          id="pin"
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          autoFocus
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-3 text-lg text-swc-light outline-none focus:border-swc-accent"
        />

        <label htmlFor="alias" className="mt-5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted">
          Tu nombre <span className="text-gray-600">(opcional)</span>
        </label>
        <input
          id="alias"
          value={alias}
          onChange={e => setAlias(e.target.value)}
          placeholder="Para saber quién acreditó"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent"
        />

        {error && <p className="mt-4 text-sm font-bold text-swc-coral">{error}</p>}

        <button
          type="submit"
          disabled={!pin || enviando}
          className="mt-7 w-full rounded-full bg-swc-accent px-6 py-4 text-base font-black text-swc-bg disabled:opacity-40"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default Pin
