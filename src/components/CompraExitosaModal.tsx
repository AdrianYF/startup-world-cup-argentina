import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Modal } from './ui/Modal'
import { trackEvent } from '../lib/analytics'
import { fetchOrden, formatARS, type Orden } from '../lib/checkout'

/**
 * Vuelta de Mercado Pago: felicitaciones y la entrada, sin salir del landing.
 *
 * Se abre solo cuando la URL trae `?compra=<uuid>`, que es a donde apuntan las
 * `back_urls` de la preferencia.
 *
 * El estado NO se lee de los query params que manda MP (`status`, `payment_id`):
 * esa URL se escribe a mano. Se consulta `/api/orden`, que le pregunta a Mercado
 * Pago con nuestro access token y acredita si corresponde.
 */

/** Cada cuánto se vuelve a preguntar mientras el pago no está confirmado. */
const POLL_MS = 2500
/** Cuántos intentos antes de bajar los brazos (~40s). */
const POLL_MAX = 16

const TITLE_ID = 'compra-titulo'

type Props = { ordenId: string; onClose: () => void }

function CompraExitosaModal({ ordenId, onClose }: Props) {
  const [orden, setOrden] = useState<Orden | null>(null)
  const [agotado, setAgotado] = useState(false)
  const [error, setError] = useState(false)
  const intentos = useRef(0)

  useEffect(() => {
    const ac = new AbortController()
    let timer: number | undefined

    async function mirar() {
      try {
        const o = await fetchOrden(ordenId, ac.signal)
        setOrden(o)
        if (o.status !== 'pending') {
          if (o.status === 'paid') trackEvent('purchase_confirmed', { tier: o.tier, value: o.total })
          return
        }
        intentos.current += 1
        if (intentos.current >= POLL_MAX) return setAgotado(true)
        timer = window.setTimeout(mirar, POLL_MS)
      } catch {
        if (!ac.signal.aborted) setError(true)
      }
    }

    mirar()
    return () => {
      ac.abort()
      if (timer) clearTimeout(timer)
    }
  }, [ordenId])

  return (
    <Modal onClose={onClose} titleId={TITLE_ID} size="md">
      {error ? (
        <Estado
          icono="!"
          tono="warn"
          titulo="No encontramos la compra"
          texto="Si el pago salió, te llega la entrada por mail igual. Escribinos si en 15 minutos no aparece."
        />
      ) : !orden ? (
        <Estado icono="…" tono="neutro" titulo="Buscando tu compra" texto="Un segundo." cargando />
      ) : orden.status === 'paid' ? (
        <Exito orden={orden} />
      ) : orden.status === 'rejected' ? (
        <Estado
          icono="✕"
          tono="warn"
          titulo="El pago no se completó"
          texto="Mercado Pago rechazó la operación. No se te cobró nada: podés intentarlo de nuevo."
        />
      ) : (
        <Estado
          icono="…"
          tono="neutro"
          titulo={agotado ? 'Tu pago está procesándose' : 'Confirmando tu pago'}
          texto={
            agotado
              ? 'Mercado Pago todavía no lo confirmó. Cuando lo haga te llega la entrada por mail — no hace falta que esperes acá.'
              : 'Estamos verificando la operación con Mercado Pago.'
          }
          cargando={!agotado}
        />
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-7 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
      >
        Cerrar
      </button>
    </Modal>
  )
}

function Exito({ orden }: { orden: Orden }) {
  const nombre = orden.nombre.split(' ')[0]
  const varias = orden.entradas.length > 1
  const tierNombre = orden.tier === 'vip' ? 'Entrada VIP' : 'Última tanda'

  return (
    <>
      <div className="text-center">
        <div
          aria-hidden
          className="mx-auto w-16 h-16 rounded-full bg-[#75AADB]/15 border border-[#75AADB]/40 flex items-center justify-center text-3xl font-black text-[#75AADB]"
        >
          ✓
        </div>
        <h2 id={TITLE_ID} className="mt-5 text-3xl font-black text-white">
          ¡Felicitaciones, {nombre}!
        </h2>
        <p className="mt-3 text-gray-400 text-sm leading-relaxed">
          {varias ? 'Tus entradas están confirmadas' : 'Tu entrada está confirmada'}. Te{' '}
          {varias ? 'las' : 'la'} mandamos a{' '}
          <span className="text-gray-300">{orden.email}</span> — nos vemos el 5, 6 y 7 de agosto.
        </p>
      </div>

      {/* Una tarjeta por asistente: cada uno entra con SU código. */}
      {orden.entradas.map(entrada => (
        <div
          key={entrada.token}
          className="mt-7 rounded-2xl border border-[#75AADB]/25 bg-white/[0.04] overflow-hidden"
        >
          <div className="px-6 pt-6 pb-5 text-center border-b border-dashed border-[#75AADB]/20">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#75AADB]">
              {varias ? `Entrada ${entrada.numero} de ${orden.entradas.length}` : 'Startup World Cup Argentina'}
            </p>
            <p className="mt-1.5 text-xl font-black text-white">
              {entrada.nombre || tierNombre}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{tierNombre}</p>
          </div>

          <div className="px-6 py-6 text-center">
            <div className="inline-block bg-white p-3 rounded-xl">
              <QRCodeSVG
                value={`${window.location.origin}/entrada/${entrada.token}`}
                size={148}
                level="M"
                bgColor="#ffffff"
                fgColor="#020618"
              />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Mostralo en la puerta
            </p>
          </div>

          {/* PDF y no un link a la página: la entrada queda guardada en el
              teléfono y sirve aunque en la puerta no haya señal. */}
          <div className="px-6 pb-6">
            <a
              href={`/api/entrada-pdf?t=${entrada.token}`}
              download
              style={{ backgroundImage: 'var(--gradient-cta)' }}
              className="block w-full text-center font-black py-3 rounded-full uppercase tracking-wide text-white text-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-95"
            >
              Descargar
            </a>
          </div>
        </div>
      ))}

      <dl className="mt-6">
        <Fila label="Total pagado" valor={formatARS(orden.total, { centavos: true })} />
        <Fila label="Orden" valor={<span className="font-mono text-[10px]">{orden.id}</span>} />
      </dl>

      {varias && (
        <p className="mt-4 text-center text-[11px] text-gray-500 leading-relaxed">
          Reenviale a cada persona su entrada: en la puerta se acredita una por una.
        </p>
      )}
    </>
  )
}

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 border-t border-white/5 first:border-t-0">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">{label}</dt>
      <dd className="text-xs font-bold text-white text-right tabular-nums">{valor}</dd>
    </div>
  )
}

const TONOS = {
  ok: 'bg-[#75AADB]/15 border-[#75AADB]/40 text-[#75AADB]',
  warn: 'bg-[#ff7675]/15 border-[#ff7675]/40 text-[#ff7675]',
  neutro: 'bg-white/5 border-white/15 text-gray-400',
}

function Estado({
  icono,
  tono,
  titulo,
  texto,
  cargando,
}: {
  icono: string
  tono: keyof typeof TONOS
  titulo: string
  texto: string
  cargando?: boolean
}) {
  return (
    <div className="text-center">
      <div
        aria-hidden
        className={`mx-auto w-16 h-16 rounded-full border flex items-center justify-center text-3xl font-black ${TONOS[tono]} ${
          cargando ? 'animate-pulse' : ''
        }`}
      >
        {icono}
      </div>
      <h2 id={TITLE_ID} className="mt-5 text-2xl font-black text-white">
        {titulo}
      </h2>
      <p className="mt-3 text-gray-400 text-sm leading-relaxed">{texto}</p>
    </div>
  )
}

export default CompraExitosaModal
