import { useState, type FormEvent } from 'react'
import { Boton } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Campo, Opcional } from '../ui/Campos'
import { Bloque, Operacion } from '../ui/Operacion'
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
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <Operacion
          contexto={
            // El equivalente del bloque de marca de la referencia: en el celular
            // queda abajo del formulario, que es lo que hay que alcanzar sin
            // scrollear cuando se abre parado en la fila.
            <div className="flex h-full flex-col justify-between gap-8">
              <Bloque titulo="What this is">
                <p className="text-sm leading-relaxed text-swc-muted">
                  The check-in tool for the event. This PIN opens the full list of
                  registrations — everyone's name, email and phone — so it doesn't
                  leave the staff.
                </p>
              </Bloque>

              <a
                href="https://www.startupgrind.com/buenos-aires/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Startup Grind Buenos Aires"
                className="self-start"
              >
                <img
                  src="/SGBA-logo.png"
                  alt="Startup Grind Buenos Aires"
                  className="h-12 w-auto opacity-80"
                />
              </a>
            </div>
          }
        >
          <form onSubmit={enviar}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-swc-accent">
              Startup World Cup Argentina
            </p>
            <h1 className="mt-2 mb-7 text-3xl font-black text-swc-light">Backoffice</h1>

            <div className="flex flex-col gap-4">
              <Campo
                id="pin"
                label="PIN"
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                autoFocus
                autoComplete="off"
              />

              <Campo
                id="alias"
                label={<>Your name<Opcional /></>}
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="So we know who checked people in"
                ayuda="It gets recorded on every check-in you take. It helps when two doors take the same person."
              />
            </div>

            {error && <Aviso tono="error" className="mt-4">{error}</Aviso>}

            <Boton
              type="submit"
              tam="lg"
              ancho
              className="mt-6"
              disabled={!pin}
              ocupado={enviando ? 'Going in…' : undefined}
            >
              Go in
            </Boton>
          </form>
        </Operacion>
      </div>
    </div>
  )
}

export default Pin
