import { useState, type FormEvent } from 'react'
import { login, mensajeDeError } from '../lib/api'
import { quien } from '../lib/almacen'

/**
 * Usuario y contraseña, que es el esquema que todo el mundo ya sabe usar.
 *
 * Con una diferencia que conviene tener presente y no disimular: **la
 * contraseña es una sola, compartida por todo el equipo**. No hay cuentas
 * porque el equipo de acreditación se arma el día anterior y nadie va a dar de
 * alta usuarios a las ocho de la mañana.
 *
 * El usuario no se valida contra nada: es la IDENTIDAD, no la credencial. Queda
 * guardado y viaja en cada ingreso a `checkins.por`, que es lo que permite saber
 * quién acreditó a quién cuando hay tres personas en la puerta. Por eso es
 * obligatorio: antes era opcional y un check-in sin nombre no se le puede
 * atribuir a nadie.
 */
const LABEL = 'block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted'
const INPUT =
  'mt-2 w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-3 ' +
  'text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent'

function Pin({ onListo }: { onListo: () => void }) {
  const [usuario, setUsuario] = useState(() => quien.leer())
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const listo = usuario.trim().length >= 2 && clave.length > 0

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!listo || enviando) return
    setEnviando(true)
    setError('')
    try {
      await login(clave)
      quien.guardar(usuario.trim())
      onListo()
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    // Dos recuadros: el login y, al lado, de quién es el evento. En desktop van
    // uno junto al otro; en el celular de la puerta el logo pasa arriba y chico,
    // porque ahí lo que importa es llegar al campo del PIN sin scrollear.
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-3xl flex-col-reverse items-center gap-5 sm:flex-row sm:items-stretch sm:justify-center">
        <form
          onSubmit={enviar}
          className="w-full max-w-xs rounded-2xl border border-swc-accent/20 bg-white/[0.03] px-6 py-7"
          >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-swc-accent text-center">
            Startup World Cup Argentina
          </p>
          <h1 className="mt-2 mb-8 text-3xl font-black text-center text-swc-light">Check-in</h1>

          <label htmlFor="usuario" className={LABEL}>Usuario</label>
          <input
            id="usuario"
            name="username"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            autoFocus
            // `username` real y no `off`: así el gestor de contraseñas del
            // celular ofrece guardar el par, que es medio punto de por qué usar
            // el esquema conocido en vez de inventar uno.
            autoComplete="username"
            autoCapitalize="words"
            required
            minLength={2}
            placeholder="Tu nombre"
            className={INPUT}
          />

          <label htmlFor="clave" className={`mt-5 ${LABEL}`}>Contraseña</label>
          <input
            id="clave"
            name="password"
            type="password"
            value={clave}
            onChange={e => setClave(e.target.value)}
            autoComplete="current-password"
            required
            className={`${INPUT} text-lg`}
          />

          {error && (
            <p role="alert" className="mt-4 text-sm font-bold text-swc-coral">{error}</p>
          )}

          <button
            type="submit"
            disabled={!listo || enviando}
            className="mt-7 w-full rounded-full bg-swc-accent px-6 py-4 text-base font-black text-swc-bg disabled:opacity-40"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-600">
            Tu usuario queda registrado en cada acreditación que hagas.
          </p>
        </form>

        {/* `self-stretch` y no el `items-stretch` del padre: el contenedor va
            `items-center` para que en el celular el logo no se estire a lo
            largo, y en ese pulso gana el del padre. */}
        <aside className="flex w-full max-w-xs items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-7 sm:max-w-[15rem] sm:self-stretch">
          <a
            href="https://www.startupgrind.com/buenos-aires/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Startup Grind Buenos Aires"
          >
            <img
              src="/SGBA-logo.png"
              alt="Startup Grind Buenos Aires"
              className="h-14 w-auto sm:h-32"
            />
          </a>
        </aside>
      </div>
    </div>
  )
}

export default Pin
