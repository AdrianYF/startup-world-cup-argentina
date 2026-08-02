import { useState, type FormEvent } from 'react'
import { Boton } from '../ui/Acciones'
import { Aviso } from '../ui/Aviso'
import { Campo, Campos, Opcional } from '../ui/Campos'
import { mensajeDeError } from '../lib/api'
import { darDeBaja, editarPersona, esAsistente, reenviarMail, type Asistente } from '../lib/admin'
import type { Persona } from '../lib/tipos'

/**
 * Lo que se hace sentado: corregir los datos, reenviar la entrada, dar de baja.
 *
 * Va en un chunk aparte y se carga sólo desde el padrón. Es la mitad de la ficha
 * que trae `lib/admin.ts` —el cliente entero de `/api/backoffice`— y no tiene
 * por qué bajarse en el celular que abre la lista parado en la fila de entrada.
 *
 * Todo esto era, hasta hace poco, un UPDATE a mano en el SQL Editor de Supabase
 * con la persona esperando del otro lado del chat.
 */
function AccionesPersona({ persona, onGuardado }: {
  persona: Persona | Asistente
  onGuardado: () => void
}) {
  const [nombre, setNombre] = useState(persona.nombre || '')
  const [email, setEmail] = useState(persona.email || '')
  const [telefono, setTelefono] = useState(persona.telefono || '')
  const [empresa, setEmpresa] = useState(persona.empresa || '')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState('')

  const esWeb = persona.origen === 'web'
  const token = esAsistente(persona) ? persona.token : null
  const linkEntrada = token ? `${location.origin}/entrada/${token}` : ''

  async function correr(que: string, fn: () => Promise<unknown>, exito?: string) {
    setOcupado(que)
    setError('')
    setAviso('')
    try {
      await fn()
      if (exito) setAviso(exito)
      else onGuardado()
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setOcupado('')
    }
  }

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    correr('guardar', () => editarPersona({
      id: persona.id,
      origen: persona.origen,
      nombre,
      email,
      telefono,
      empresa,
    }))
  }

  return (
    <form onSubmit={guardar} className="mt-6 border-t border-white/10 pt-5">
      <div className="flex flex-col gap-3">
        <Campo
          id="fp-nombre"
          label="Nombre y apellido"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoCapitalize="words"
          required
          minLength={2}
        />
        <Campo
          id="fp-email"
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoCapitalize="none"
          inputMode="email"
          ayuda={esWeb
            ? 'Es el del comprador: lo comparten todas las entradas de la misma compra.'
            : undefined}
        />
        <Campos>
          <Campo
            id="fp-telefono"
            label={<>Teléfono<Opcional /></>}
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            inputMode="tel"
          />
          <Campo
            id="fp-empresa"
            label={<>Empresa<Opcional /></>}
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
          />
        </Campos>
      </div>

      {error && <Aviso tono="error" className="mt-4">{error}</Aviso>}
      {aviso && <Aviso tono="ok" className="mt-4">{aviso}</Aviso>}

      <Boton
        type="submit"
        ancho
        className="mt-4"
        disabled={nombre.trim().length < 2}
        ocupado={ocupado === 'guardar' ? 'Guardando…' : undefined}
      >
        Guardar cambios
      </Boton>

      <div className="mt-3 flex flex-wrap gap-2">
        {/* El token es la credencial: sólo existe del lado de la venta propia,
            porque Luma y Startup Grind emiten los suyos. */}
        {linkEntrada && (
          <>
            <Boton
              type="button"
              tono="fantasma"
              tam="sm"
              onClick={() => correr('copiar', () => navigator.clipboard.writeText(linkEntrada), 'Link copiado.')}
            >
              Copiar link
            </Boton>
            <a
              href={linkEntrada}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/[0.02] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-swc-muted active:scale-95"
            >
              Ver entrada
            </a>
            <Boton
              type="button"
              tono="secundario"
              tam="sm"
              onClick={() => correr('mail', () => reenviarMail({ entrada: persona.id }), 'Mail reenviado.')}
              ocupado={ocupado === 'mail' ? 'Enviando…' : undefined}
            >
              Reenviar mail
            </Boton>
          </>
        )}

        {/* Del lado web la unidad es la COMPRA, no la persona: dar de baja una
            entrada de tres dejaría una orden paga a medias. Eso se hace desde
            Ventas, donde la consecuencia se ve. */}
        {!esWeb && (
          <Boton
            type="button"
            tono="peligro"
            tam="sm"
            onClick={() => correr('baja', () => darDeBaja(persona.id, persona.origen))}
            ocupado={ocupado === 'baja' ? 'Sacando…' : undefined}
          >
            Sacar de la lista
          </Boton>
        )}
      </div>
    </form>
  )
}

export default AccionesPersona
