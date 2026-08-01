import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent } from 'react'
import { Modal } from './ui/Modal'
import { trackEvent } from '../lib/analytics'
import {
  crearCheckout,
  formatARS,
  mensajeDeError,
  type Comprador,
  type TierId,
} from '../lib/checkout'

/**
 * Compra de entradas sin salir del sitio.
 *
 * Dos pasos: primero los datos del comprador, después el botón de Mercado Pago
 * (Wallet Brick). La preferencia se crea recién al pasar de un paso al otro, y
 * el monto lo pone el backend leyendo la tabla `tiers` — nunca este componente.
 *
 * Monta sobre <Modal>, que ya trae el look del sitio, focus-trap, ESC y portal.
 */

type Props = {
  tier: TierId
  nombre: string
  precio: number
  /**
   * Cargo de servicio de una entrada, calculado por el backend. `null` cuando
   * /api/tiers no contestó: ahí no se muestra desglose, porque un "$0,00"
   * inventado sería peor que no mostrar nada.
   */
  cargo: number | null
  perks: string[]
  badge?: string | null
  descripcion?: string
  onClose: () => void
}

type Paso = 'datos' | 'pago'

const TITLE_ID = 'checkout-titulo'

/** Mismo tratamiento que los inputs del resto del sitio. */
const INPUT =
  'w-full rounded-xl bg-white/5 border border-[#75AADB]/20 px-4 py-3 text-white placeholder:text-gray-500 ' +
  'transition-colors focus:border-[#75AADB]/60 focus:bg-white/[0.07] outline-none'

const LABEL = 'block text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-400 mb-1.5'

function TicketCheckoutModal({ tier, nombre, precio, cargo, perks, badge, descripcion, onClose }: Props) {
  const [paso, setPaso] = useState<Paso>('datos')
  const [comprador, setComprador] = useState<Comprador>({ nombre: '', email: '', dni: '' })
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return
    setError(null)
    setEnviando(true)
    trackEvent('checkout_start', { tier })

    try {
      const { preferenceId: pref } = await crearCheckout(tier, 1, comprador)
      setPreferenceId(pref)
      setPaso('pago')
    } catch (err) {
      setError(mensajeDeError(err))
      trackEvent('checkout_error', { tier })
    } finally {
      setEnviando(false)
    }
  }

  const set = (campo: keyof Comprador) => (e: ChangeEvent<HTMLInputElement>) =>
    setComprador(c => ({ ...c, [campo]: e.target.value }))

  return (
    <Modal onClose={onClose} titleId={TITLE_ID} size="md">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id={TITLE_ID} className="text-white font-black text-2xl leading-tight">
            {nombre}
          </h2>
          {badge && (
            <span className="shrink-0 bg-[#75AADB] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
              {badge}
            </span>
          )}
        </div>

        <div className="text-4xl font-black text-white">{formatARS(precio)}</div>
        <p className="text-gray-500 text-xs mt-1">+ cargo de servicio</p>

        {descripcion && <p className="text-gray-400 text-sm mt-4">{descripcion}</p>}

        {/* Desglose: el "+ cargo de servicio" de arriba tiene que poder
            explicarse con un número antes de que la persona pague. */}
        {cargo !== null && (
          <dl className="mt-5 rounded-xl border border-[#75AADB]/15 bg-white/[0.04] px-4 py-3">
            <Monto label="Subtotal" valor={precio} />
            <Monto label="Cargo de servicio" valor={cargo} />
            <Monto label="Total" valor={precio + cargo} destacado />
          </dl>
        )}

        {perks.length > 0 && (
          <ul className="flex flex-col gap-2.5 mt-5">
            {perks.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-[#75AADB] mt-0.5">✓</span>
                {p}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="h-px bg-gradient-to-r from-transparent via-[#75AADB]/30 to-transparent mb-6" />

      {paso === 'datos' ? (
        <form onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label className={LABEL} htmlFor="ck-nombre">Nombre y apellido</label>
              <input
                id="ck-nombre"
                className={INPUT}
                value={comprador.nombre}
                onChange={set('nombre')}
                autoComplete="name"
                required
                minLength={2}
                placeholder="Como figura en tu documento"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="ck-email">Email</label>
              <input
                id="ck-email"
                type="email"
                className={INPUT}
                value={comprador.email}
                onChange={set('email')}
                autoComplete="email"
                required
                placeholder="Ahí te mandamos la entrada"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="ck-dni">
                DNI <span className="text-gray-600 normal-case tracking-normal font-normal">(opcional)</span>
              </label>
              <input
                id="ck-dni"
                className={INPUT}
                value={comprador.dni}
                onChange={set('dni')}
                inputMode="numeric"
                placeholder="Agiliza la acreditación en puerta"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-[#ff7675] bg-[#ff7675]/10 border border-[#ff7675]/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            style={enviando ? undefined : { backgroundImage: 'var(--gradient-cta)' }}
            className={`mt-6 block w-full text-center font-black py-3.5 rounded-full uppercase tracking-wide text-white transition-all ${
              enviando
                ? 'cursor-wait border border-white/15 text-gray-400'
                : 'cursor-pointer hover:scale-[1.02] active:scale-95 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]'
            }`}
          >
            {enviando ? 'Preparando el pago…' : 'Continuar al pago'}
          </button>

          <p className="mt-4 text-center text-[11px] text-gray-500 leading-relaxed">
            Vas a pagar con Mercado Pago. Al continuar aceptás que usemos tus datos
            para emitir y validar tu entrada.
          </p>
        </form>
      ) : (
        <PasoPago preferenceId={preferenceId} onVolver={() => setPaso('datos')} />
      )}
    </Modal>
  )
}

/** Una fila del desglose. El total se separa con una línea: es el número que se busca. */
function Monto({ label, valor, destacado }: { label: string; valor: number; destacado?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        destacado ? 'mt-2 pt-2 border-t border-[#75AADB]/20' : 'py-0.5'
      }`}
    >
      <dt className={destacado ? 'text-sm font-bold text-white' : 'text-xs text-gray-400'}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          destacado ? 'text-base font-black text-white' : 'text-xs font-bold text-gray-300'
        }`}
      >
        {formatARS(valor, { centavos: true })}
      </dd>
    </div>
  )
}

/**
 * Wallet Brick. El SDK se inicializa una sola vez por sesión y se carga con
 * `import()` dinámico: son ~90 KB que sólo tiene que bajar quien va a comprar,
 * no todo el que abre el landing.
 */
let sdkListo = false

/** La clave pública es una constante del build: se lee en render, no en un efecto. */
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY

function PasoPago({ preferenceId, onVolver }: { preferenceId: string | null; onVolver: () => void }) {
  const [Wallet, setWallet] = useState<ComponentType<{
    initialization: { preferenceId: string }
    customization?: { texts?: { valueProp?: 'security_safety' }; visual?: { buttonBackground?: 'blue'; borderRadius?: string } }
  }> | null>(null)
  const [fallo, setFallo] = useState(false)
  const montado = useRef(true)

  useEffect(() => {
    if (!MP_PUBLIC_KEY) return
    montado.current = true

    import('@mercadopago/sdk-react')
      .then(({ initMercadoPago, Wallet: W }) => {
        if (!montado.current) return
        if (!sdkListo) {
          initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' })
          sdkListo = true
        }
        setWallet(() => W as never)
      })
      .catch(() => {
        if (montado.current) setFallo(true)
      })

    return () => {
      montado.current = false
    }
  }, [])

  const error = !MP_PUBLIC_KEY
    ? 'Falta configurar la clave pública de Mercado Pago.'
    : fallo
      ? 'No pudimos cargar el pago. Probá de nuevo.'
      : null

  if (error) {
    return (
      <div>
        <p role="alert" className="text-sm text-[#ff7675] bg-[#ff7675]/10 border border-[#ff7675]/30 rounded-xl px-4 py-3">
          {error}
        </p>
        <BotonVolver onVolver={onVolver} />
      </div>
    )
  }

  return (
    <div>
      <p className="text-gray-400 text-sm mb-4">
        Elegí cómo pagar. Al terminar volvés acá y te mandamos la entrada por mail.
      </p>

      <div className="min-h-[56px]">
        {Wallet && preferenceId ? (
          <Wallet
            initialization={{ preferenceId }}
            customization={{
              texts: { valueProp: 'security_safety' },
              visual: { buttonBackground: 'blue', borderRadius: '999px' },
            }}
          />
        ) : (
          <div className="h-12 rounded-full bg-white/5 border border-[#75AADB]/15 animate-pulse" />
        )}
      </div>

      <BotonVolver onVolver={onVolver} />
    </div>
  )
}

function BotonVolver({ onVolver }: { onVolver: () => void }) {
  return (
    <button
      type="button"
      onClick={onVolver}
      className="mt-5 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
    >
      ← Volver a mis datos
    </button>
  )
}

export default TicketCheckoutModal
