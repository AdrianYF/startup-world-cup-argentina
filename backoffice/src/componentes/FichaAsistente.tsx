import { useEffect, useState, type FormEvent } from 'react'
import { Chip } from '../ui/Estado'
import { mensajeDeError } from '../lib/api'
import {
  darDeBaja, editarPersona, fechaCorta, reenviarMail, type Asistente,
} from '../lib/admin'

/**
 * La ficha de soporte de una persona.
 *
 * Es lo que faltaba entero: corregir un nombre mal tipeado, completar el
 * acompañante que quedó en blanco, reenviar el mail que "no llegó", copiar el
 * link de la entrada. Todo eso se hacía con un UPDATE en el SQL Editor.
 */
const INPUT =
  'w-full rounded-xl border border-swc-accent/25 bg-white/[0.04] px-4 py-2.5 text-base ' +
  'text-swc-light placeholder:text-gray-600 outline-none focus:border-swc-accent'
const LABEL = 'mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-muted'

function FichaAsistente({ persona, onCerrar, onGuardado }: {
  persona: Asistente
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [nombre, setNombre] = useState(persona.nombre || '')
  const [email, setEmail] = useState(persona.email || '')
  const [telefono, setTelefono] = useState(persona.telefono || '')
  const [empresa, setEmpresa] = useState(persona.empresa || '')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState('')

  useEffect(() => {
    const cerrar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', cerrar)
    return () => window.removeEventListener('keydown', cerrar)
  }, [onCerrar])

  const esWeb = persona.origen === 'web'
  const linkEntrada = persona.token ? `${location.origin}/entrada/${persona.token}` : ''

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/70" onClick={onCerrar} aria-label="Cerrar" />

      <form
        onSubmit={guardar}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-swc-accent/30 bg-swc-surface px-5 pt-6 pb-8 sm:rounded-2xl sm:border"
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-swc-light">
            {persona.nombre || 'Sin nombre'}
          </h2>
          <Chip tono="neutro">{esWeb ? 'venta propia' : persona.origen}</Chip>
          {persona.pagoDoble && <Chip tono="warn">pagó dos veces</Chip>}
          {persona.sinDia && <Chip tono="coral">sin día</Chip>}
        </div>

        {persona.sinDia && (
          <p className="mb-4 rounded-xl border border-swc-coral/40 bg-swc-coral/10 px-4 py-3 text-sm font-bold text-swc-coral">
            Sus días son «{persona.dias}» y eso no coincide con ningún día del evento:
            no aparece en ninguna puerta. Hay que corregirlo en el canal de origen
            o reimportar el CSV con «Importar».
          </p>
        )}

        {persona.pagoDoble && (
          <p className="mb-4 rounded-xl border border-swc-warn/40 bg-swc-warn/10 px-4 py-3 text-sm font-bold text-swc-warn">
            La misma entrada aparece en Startup Grind y en la venta propia. El reembolso
            se hace en el canal donde se cobró de más; acá se marca desde «Ventas».
          </p>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className={LABEL} htmlFor="fa-nombre">Nombre y apellido</label>
            <input id="fa-nombre" className={INPUT} value={nombre}
              onChange={e => setNombre(e.target.value)} autoCapitalize="words" required minLength={2} />
          </div>
          <div>
            <label className={LABEL} htmlFor="fa-email">
              Email{esWeb && <span className="ml-1 font-normal normal-case tracking-normal text-gray-600">(del comprador: lo comparten todas las entradas de la compra)</span>}
            </label>
            <input id="fa-email" type="email" className={INPUT} value={email}
              onChange={e => setEmail(e.target.value)} autoCapitalize="none" inputMode="email" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="fa-telefono">Teléfono</label>
              <input id="fa-telefono" className={INPUT} value={telefono}
                onChange={e => setTelefono(e.target.value)} inputMode="tel" />
            </div>
            <div>
              <label className={LABEL} htmlFor="fa-empresa">Empresa</label>
              <input id="fa-empresa" className={INPUT} value={empresa}
                onChange={e => setEmpresa(e.target.value)} />
            </div>
          </div>
        </div>

        <dl className="mt-5 mb-5 text-sm">
          <Dato label="Entrada" valor={persona.entrada} />
          <Dato label="Días" valor={persona.dias} />
          <Dato label="Registrada" valor={fechaCorta(persona.registradoEn)} />
          <Dato label="Último ingreso" valor={persona.usadaEn ? fechaCorta(persona.usadaEn) : 'no entró'} />
        </dl>

        {error && (
          <p className="mb-4 rounded-xl border border-swc-coral/40 bg-swc-coral/10 px-4 py-3 text-sm font-bold text-swc-coral">
            {error}
          </p>
        )}
        {aviso && (
          <p className="mb-4 rounded-xl border border-swc-ok/40 bg-swc-ok/10 px-4 py-3 text-sm font-bold text-swc-ok">
            {aviso}
          </p>
        )}

        <button
          type="submit"
          disabled={Boolean(ocupado) || nombre.trim().length < 2}
          className="w-full rounded-full bg-swc-accent px-6 py-3.5 text-sm font-black text-swc-bg disabled:opacity-40"
        >
          {ocupado === 'guardar' ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <div className="mt-3 flex flex-wrap gap-2">
          {/* El token es la credencial: sólo existe del lado de la venta propia,
              porque Luma y Startup Grind emiten los suyos. */}
          {linkEntrada && (
            <>
              <button
                type="button"
                onClick={() => correr('copiar',
                  () => navigator.clipboard.writeText(linkEntrada),
                  'Link copiado.')}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-swc-muted active:scale-95"
              >
                Copiar link
              </button>
              <a
                href={linkEntrada}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-swc-muted active:scale-95"
              >
                Ver entrada
              </a>
              <button
                type="button"
                disabled={Boolean(ocupado)}
                onClick={() => correr('mail',
                  () => reenviarMail({ entrada: persona.id }),
                  'Mail reenviado.')}
                className="rounded-full border border-swc-accent/40 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-swc-accent active:scale-95 disabled:opacity-40"
              >
                {ocupado === 'mail' ? 'Enviando…' : 'Reenviar mail'}
              </button>
            </>
          )}

          {/* Del lado web la unidad es la COMPRA, no la persona: dar de baja una
              entrada de tres dejaría una orden paga a medias. Eso se hace desde
              Ventas, donde la consecuencia se ve. */}
          {!esWeb && (
            <button
              type="button"
              disabled={Boolean(ocupado)}
              onClick={() => correr('baja', () => darDeBaja(persona.id, persona.origen))}
              className="rounded-full border border-swc-coral/40 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-swc-coral active:scale-95 disabled:opacity-40"
            >
              Sacar de la lista
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-5 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500"
        >
          Cerrar
        </button>
      </form>
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-white/5 py-1.5 first:border-t-0">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-500">{label}</dt>
      <dd className="text-right text-swc-light">{valor}</dd>
    </div>
  )
}

export default FichaAsistente
