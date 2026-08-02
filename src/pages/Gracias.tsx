import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageLayout } from '../components/ui/PageLayout'
import { SectionGlow } from '../components/ui/SectionGlow'
import { fetchOrden, formatARS, type Orden } from '../lib/checkout'

/**
 * Vuelta desde Mercado Pago.
 *
 * Esta pantalla NO decide si el pago entró: sólo muestra lo que dice la orden en
 * nuestra base. Quien la acredita es el webhook, y puede tardar unos segundos en
 * llegar — por eso acá se poletea mientras siga `pending`.
 *
 * Los query params que manda MP (`status`, `payment_id`) se ignoran a propósito:
 * son parte de una URL que cualquiera puede escribir a mano.
 */

/** Cada cuánto se vuelve a preguntar mientras la orden está pendiente. */
const POLL_MS = 2500

/** Cuánto se espera antes de bajar los brazos (~40s). */
const POLL_MAX = 16

function Gracias() {
  const [params] = useSearchParams()
  const ordenId = params.get('orden')

  const [orden, setOrden] = useState<Orden | null>(null)
  const [agotado, setAgotado] = useState(false)
  const [error, setError] = useState(false)
  const intentos = useRef(0)

  useEffect(() => {
    if (!ordenId) return
    const ac = new AbortController()
    let timer: number | undefined

    async function mirar() {
      try {
        const o = await fetchOrden(ordenId!, ac.signal)
        setOrden(o)
        if (o.status !== 'pending') return

        intentos.current += 1
        if (intentos.current >= POLL_MAX) {
          setAgotado(true)
          return
        }
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
    <PageLayout>
      <section className="relative min-h-[70vh] py-16 sm:py-24">
        <SectionGlow />
        <div className="relative max-w-xl mx-auto px-4">
          <div className="rounded-2xl border border-[#75AADB]/20 bg-white/[0.03] p-8 sm:p-10 text-center">
            {!ordenId || error ? (
              <Estado
                icono="!"
                tono="warn"
                titulo="No encontramos la compra"
                texto="Si el pago salió, te va a llegar el mail con la entrada igual. Escribinos si en 15 minutos no aparece."
              />
            ) : !orden ? (
              <Estado icono="…" tono="neutro" titulo="Buscando tu compra" texto="Un segundo." />
            ) : orden.status === 'paid' ? (
              <Exito orden={orden} />
            ) : orden.status === 'rejected' ? (
              <Estado
                icono="✕"
                tono="warn"
                titulo="El pago no se completó"
                texto="Mercado Pago rechazó la operación. No se te cobró nada: podés intentar de nuevo."
              />
            ) : agotado ? (
              <Estado
                icono="…"
                tono="neutro"
                titulo="Tu pago está procesándose"
                texto="Mercado Pago todavía no lo confirmó. Cuando lo haga te llega la entrada por mail — no hace falta que esperes acá."
              />
            ) : (
              <Estado
                icono="…"
                tono="neutro"
                titulo="Confirmando tu pago"
                texto="Estamos esperando la confirmación de Mercado Pago. No cierres esta pantalla."
                cargando
              />
            )}

            <Link
              to="/"
              className="mt-8 inline-block text-xs font-bold uppercase tracking-[0.14em] text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

function Exito({ orden }: { orden: Orden }) {
  const unidades = orden.cantidad === 1 ? '1 entrada' : `${orden.cantidad} entradas`

  return (
    <>
      <Estado
        icono="✓"
        tono="ok"
        titulo={`¡Listo, ${orden.nombre.split(' ')[0]}!`}
        texto="Tu compra está confirmada. Te mandamos la entrada con el QR por mail."
      />

      <dl className="mt-8 text-left rounded-xl border border-[#75AADB]/15 bg-white/[0.04] px-5 py-4">
        <Fila label="Entrada" valor={orden.tier === 'vip' ? 'Entrada VIP' : 'Última tanda'} />
        <Fila label="Cantidad" valor={unidades} />
        <Fila label="Subtotal" valor={formatARS(orden.subtotal, { centavos: true })} />
        <Fila label="Cargo de servicio" valor={formatARS(orden.cargo, { centavos: true })} />
        <Fila label="Total" valor={formatARS(orden.total, { centavos: true })} destacado />
        <Fila label="Orden" valor={<span className="font-mono text-[11px]">{orden.id}</span>} />
      </dl>

      {orden.ticketToken && (
        <a
          href={`/api/entrada-pdf?t=${orden.ticketToken}`}
          download
          style={{ backgroundImage: 'var(--gradient-cta)' }}
          className="mt-6 block w-full text-center font-black py-3.5 rounded-full uppercase tracking-wide text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02] active:scale-95"
        >
          Descargar entrada
        </a>
      )}
    </>
  )
}

function Fila({
  label,
  valor,
  destacado,
}: {
  label: string
  valor: React.ReactNode
  destacado?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        destacado ? 'mt-1.5 pt-2.5 border-t border-[#75AADB]/20' : 'py-1.5'
      }`}
    >
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-400">{label}</dt>
      <dd className={`text-right tabular-nums ${destacado ? 'text-base font-black text-white' : 'text-sm font-bold text-white'}`}>
        {valor}
      </dd>
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
    <>
      <div
        aria-hidden
        className={`mx-auto w-14 h-14 rounded-full border flex items-center justify-center text-2xl font-black ${TONOS[tono]} ${
          cargando ? 'animate-pulse' : ''
        }`}
      >
        {icono}
      </div>
      <h1 className="mt-5 text-2xl sm:text-3xl font-black text-white">{titulo}</h1>
      <p className="mt-3 text-gray-400 text-sm leading-relaxed">{texto}</p>
    </>
  )
}

export default Gracias
