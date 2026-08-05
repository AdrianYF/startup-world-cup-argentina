import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent } from 'react'
import { Modal } from './ui/Modal'
import { trackEvent } from '../lib/analytics'
import { openTicketing } from '../lib/ticketing'
import {
  crearCheckout,
  formatARS,
  mensajeDeError,
  type Comprador,
  type TierId,
} from '../lib/checkout'

/**
 * Compra de entradas, por los dos canales.
 *
 * El primer paso es elegir dónde pagar:
 *
 *   · Mercado Pago          → se queda en el sitio. Datos del comprador, Wallet
 *                             Brick, y la entrada con QR sale por mail desde acá.
 *   · Otros medios de pago  → al checkout de Startup Grind, que es el que venía
 *                             funcionando. El botón no lo nombra: para el
 *                             comprador lo relevante es que hay más formas de
 *                             pagar, no de quién es el checkout.
 *
 * Cobran lo mismo: el cargo de servicio espeja al de Startup Grind justamente
 * para que elegir sea una cuestión de preferencia y no de precio.
 *
 * El monto lo pone el backend leyendo la tabla `tiers` — nunca este componente.
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
  /** Cupo web libre. `null` si /api/tiers no contestó: ahí manda sólo MAX_UNIDADES. */
  disponible: number | null
  perks: string[]
  badge?: string | null
  descripcion?: string
  /** 'oro' pinta el modal como la card VIP. */
  acento?: string | null
  onClose: () => void
}

type Paso = 'elegir' | 'datos' | 'pago'

const TITLE_ID = 'checkout-titulo'

/** Tope por compra. Espeja MAX_UNIDADES de api/checkout.js y el CHECK de la tabla. */
const MAX_UNIDADES = 5

/** Mismo tratamiento que los inputs del resto del sitio. */
const INPUT =
  'w-full rounded-xl bg-white/5 border border-[#75AADB]/20 px-4 py-3 text-white placeholder:text-gray-500 ' +
  'transition-colors focus:border-[#75AADB]/60 focus:bg-white/[0.07] outline-none'

const LABEL = 'block text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-400 mb-1.5'
const OPCIONAL = 'text-gray-600 normal-case tracking-normal font-normal'

function TicketCheckoutModal({
  tier, nombre, precio, cargo, disponible, perks, badge, descripcion, acento, onClose,
}: Props) {
  const [paso, setPaso] = useState<Paso>('elegir')
  const [comprador, setComprador] = useState<Comprador>({ nombre: '', email: '', telefono: '', empresa: '' })
  // Un nombre por entrada. El índice 0 es el del comprador y se sincroniza solo
  // con el campo "Nombre y apellido": pedirlo dos veces sería absurdo.
  const [asistentes, setAsistentes] = useState<string[]>([''])
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  /**
   * La orden que ya creamos en este modal, si el comprador volvió a editar.
   *
   * Se manda en el próximo intento para que el servidor la libere: si no, cada
   * "volver y corregir" dejaba otra orden pendiente comiéndose el cupo por media
   * hora, y con cinco entradas por compra alcanzaba para agotar la tanda sin que
   * nadie hubiera pagado nada.
   */
  const [ordenPrevia, setOrdenPrevia] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const oro = acento === 'oro'
  const cantidad = asistentes.length
  // El tope real es el menor entre lo que acepta el backend y lo que queda del
  // cupo web. Sin dato vivo manda sólo el backend.
  const tope = Math.max(1, Math.min(MAX_UNIDADES, disponible ?? MAX_UNIDADES))

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando) return
    setError(null)
    setEnviando(true)
    trackEvent('checkout_start', { tier, cantidad })

    try {
      const { orderId, preferenceId: pref, publicKey: clave } =
        await crearCheckout(tier, cantidad, comprador, asistentes, ordenPrevia)
      setOrdenPrevia(orderId)
      setPublicKey(clave || null)
      setPreferenceId(pref)
      setPaso('pago')
    } catch (err) {
      setError(mensajeDeError(err))
      trackEvent('checkout_error', { tier })
    } finally {
      setEnviando(false)
    }
  }

  const set = (campo: keyof Comprador) => (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    setComprador(c => ({ ...c, [campo]: valor }))
    // El comprador ES la primera entrada.
    if (campo === 'nombre') setAsistentes(a => [valor, ...a.slice(1)])
    invalidarPreferencia()
  }

  /**
   * Cualquier cambio en lo que se va a cobrar invalida la preferencia ya creada:
   * si se vuelve al paso de pago con la vieja, Mercado Pago cobra el monto
   * anterior. Se limpia y el submit crea una nueva.
   */
  function invalidarPreferencia() {
    setPreferenceId(p => (p ? null : p))
  }

  function cambiarCantidad(nueva: number) {
    const n = Math.max(1, Math.min(tope, nueva))
    setAsistentes(a =>
      n <= a.length
        ? a.slice(0, n)
        : [...a, ...Array.from({ length: n - a.length }, () => '')],
    )
    invalidarPreferencia()
  }

  function cambiarAsistente(i: number, valor: string) {
    setAsistentes(a => a.map((v, j) => (j === i ? valor : v)))
    if (i === 0) setComprador(c => ({ ...c, nombre: valor }))
  }

  return (
    <Modal onClose={onClose} titleId={TITLE_ID} size="md" scroll>
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id={TITLE_ID} className="text-white font-black text-2xl leading-tight">
            {nombre}
          </h2>
          {badge && (
            <span
              className={`shrink-0 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap ${
                // Texto oscuro sobre dorado: blanco sobre #d4af37 da 2,10 y no
                // llega al 4,5 de AA. Con #0f172b sube a 8,48.
                oro ? 'bg-[#d4af37] text-[#0f172b]' : 'bg-[#75AADB] text-white'
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="text-4xl font-black text-white">{formatARS(precio)}</div>
        <p className="text-gray-500 text-xs mt-1">
          + cargo de servicio{cantidad > 1 ? ' · por entrada' : ''}
        </p>

        {descripcion && <p className="text-gray-400 text-sm mt-4">{descripcion}</p>}

        {/* Desglose: el "+ cargo de servicio" de arriba tiene que poder
            explicarse con un número antes de que la persona pague. Multiplicar
            acá por `cantidad` es lo mismo que hace desglose() en el backend. */}
        {cargo !== null && (
          <dl className={`mt-5 rounded-xl border px-4 py-3 ${oro ? 'border-[#d4af37]/25 bg-[#d4af37]/[0.06]' : 'border-[#75AADB]/15 bg-white/[0.04]'}`}>
            <Monto
              label={cantidad > 1 ? `Subtotal (${cantidad} entradas)` : 'Subtotal'}
              valor={precio * cantidad}
            />
            <Monto label="Cargo de servicio" valor={redondear(cargo * cantidad)} />
            <Monto label="Total" valor={redondear((precio + cargo) * cantidad)} destacado oro={oro} />
          </dl>
        )}

        {perks.length > 0 && (
          <ul className="flex flex-col gap-2.5 mt-5">
            {perks.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                <span className={`mt-0.5 ${oro ? 'text-[#d4af37]' : 'text-[#75AADB]'}`}>✓</span>
                {p}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className={`h-px bg-gradient-to-r from-transparent mb-6 ${oro ? 'via-[#d4af37]/40' : 'via-[#75AADB]/30'} to-transparent`} />

      {paso === 'elegir' ? (
        <ElegirCanal
          tier={tier}
          onMercadoPago={() => {
            trackEvent('checkout_canal', { canal: 'mercadopago', tier })
            setPaso('datos')
          }}
          onStartupGrind={() => {
            trackEvent('checkout_canal', { canal: 'startupgrind', tier })
            openTicketing(`modal-${tier}`)
            onClose()
          }}
        />
      ) : paso === 'datos' ? (
        <form onSubmit={onSubmit} noValidate>
          <Cantidad
            valor={cantidad}
            tope={tope}
            oro={oro}
            onCambio={cambiarCantidad}
          />

          <div className="flex flex-col gap-4">
            {cantidad > 1 && (
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                Entrada 1 · vos
              </p>
            )}
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
              <label className={LABEL} htmlFor="ck-telefono">
                Teléfono <span className={OPCIONAL}>(opcional)</span>
              </label>
              <input
                id="ck-telefono"
                type="tel"
                className={INPUT}
                value={comprador.telefono}
                onChange={set('telefono')}
                autoComplete="tel"
                inputMode="tel"
                placeholder="Por si hay algún cambio de último momento"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="ck-empresa">
                Empresa <span className={OPCIONAL}>(opcional)</span>
              </label>
              <input
                id="ck-empresa"
                className={INPUT}
                value={comprador.empresa}
                onChange={set('empresa')}
                autoComplete="organization"
                placeholder="Dónde trabajás o tu startup"
              />
            </div>
          </div>

          {/* Los acompañantes. Cada uno recibe SU QR, así que el nombre no es un
              dato de más: es lo que la puerta busca cuando llegan por separado. */}
          {asistentes.slice(1).map((valor, i) => (
            <div key={i + 1} className="mt-5">
              <label className={LABEL} htmlFor={`ck-asistente-${i + 1}`}>
                Entrada {i + 2} · quién la usa
              </label>
              <input
                id={`ck-asistente-${i + 1}`}
                className={INPUT}
                value={valor}
                onChange={e => cambiarAsistente(i + 1, e.target.value)}
                required
                minLength={2}
                placeholder="Nombre y apellido"
              />
            </div>
          ))}

          {error && (
            <p role="alert" className="mt-4 text-sm text-[#ff7675] bg-[#ff7675]/10 border border-[#ff7675]/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            style={enviando || oro ? undefined : { backgroundImage: 'var(--gradient-cta)' }}
            className={`mt-6 block w-full text-center font-black py-3.5 rounded-full uppercase tracking-wide transition-all ${
              enviando
                ? 'cursor-wait border border-white/15 text-gray-400'
                : oro
                  // Plano y con texto oscuro: sobre dorado el blanco no pasa AA.
                  ? 'cursor-pointer bg-[#d4af37] text-[#0f172b] hover:bg-[#c19f2f] hover:scale-[1.02] active:scale-95'
                  : 'cursor-pointer text-white hover:scale-[1.02] active:scale-95 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]'
            }`}
          >
            {enviando ? 'Preparando el pago…' : 'Continuar al pago'}
          </button>

          <p className="mt-4 text-center text-[11px] text-gray-500 leading-relaxed">
            Vas a pagar con Mercado Pago. Al continuar aceptás que usemos tus datos
            para emitir y validar tu entrada.
          </p>

          <Volver onClick={() => setPaso('elegir')}>← Cambiar forma de pago</Volver>
        </form>
      ) : (
        <PasoPago preferenceId={preferenceId} publicKey={publicKey} onVolver={() => setPaso('datos')} />
      )}
    </Modal>
  )
}

/** Al centavo, igual que `desglose()` en api/_lib/precios.js. */
function redondear(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Cuántas entradas.
 *
 * Con − y + en vez de un `<select>`: el rango real es 1 a 5 y el caso abrumador
 * es 1 o 2, así que un par de botones grandes es menos fricción que desplegar
 * una lista. El tope lo pone el cupo web que queda.
 */
function Cantidad({
  valor,
  tope,
  oro,
  onCambio,
}: {
  valor: number
  tope: number
  oro: boolean
  onCambio: (n: number) => void
}) {
  // Con una sola entrada disponible no hay nada que elegir.
  if (tope <= 1) return null

  const activo = oro ? 'border-[#d4af37]/45 text-[#d4af37]' : 'border-[#75AADB]/45 text-[#75AADB]'

  return (
    <div className="mb-6">
      <p className={LABEL}>¿Cuántas entradas?</p>
      <div className="flex items-center gap-4">
        <Paso1
          signo="−"
          etiqueta="Una entrada menos"
          disabled={valor <= 1}
          activo={activo}
          onClick={() => onCambio(valor - 1)}
        />
        <span
          aria-live="polite"
          className="min-w-10 text-center text-2xl font-black tabular-nums text-white"
        >
          {valor}
        </span>
        <Paso1
          signo="+"
          etiqueta="Una entrada más"
          disabled={valor >= tope}
          activo={activo}
          onClick={() => onCambio(valor + 1)}
        />
        {valor >= tope && (
          <span className="text-[11px] text-gray-500">
            {tope === MAX_UNIDADES ? 'Máximo por compra' : `Quedan ${tope}`}
          </span>
        )}
      </div>
    </div>
  )
}

function Paso1({
  signo,
  etiqueta,
  disabled,
  activo,
  onClick,
}: {
  signo: string
  etiqueta: string
  disabled: boolean
  activo: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className={`h-11 w-11 shrink-0 rounded-full border text-xl font-black transition-colors ${
        disabled
          ? 'cursor-not-allowed border-white/10 text-gray-600'
          : `cursor-pointer bg-white/[0.03] hover:bg-white/[0.07] active:scale-95 ${activo}`
      }`}
    >
      {signo}
    </button>
  )
}

/**
 * Paso 1: dónde pagar.
 *
 * Los dos cobran lo mismo, así que la decisión es de preferencia. Lo que cambia
 * es quién emite la entrada y por dónde llega, y eso es lo que dice cada opción.
 */
function ElegirCanal({
  tier,
  onMercadoPago,
  onStartupGrind,
}: {
  tier: TierId
  onMercadoPago: () => void
  onStartupGrind: () => void
}) {
  return (
    <div>
      <p className={LABEL}>¿Dónde querés pagar?</p>

      <div className="flex flex-col gap-3 mt-3">
        <Canal
          titulo="Mercado Pago"
          etiqueta="Más rápido"
          destacado
          detalle="Pagás sin salir del sitio. La entrada con tu QR te llega por mail al toque."
          onClick={onMercadoPago}
        />
        <Canal
          titulo="Otros medios de pago"
          detalle={`Te llevamos al checkout de Startup Grind${
            tier === 'vip' ? ', donde elegís la Entrada VIP' : ''
          }. Ellos te mandan la entrada.`}
          onClick={onStartupGrind}
          externo
        />
      </div>

      <p className="mt-5 text-center text-[11px] text-gray-500 leading-relaxed">
        Cuestan lo mismo por los dos lados.
      </p>
    </div>
  )
}

function Canal({
  titulo,
  detalle,
  etiqueta,
  destacado,
  externo,
  onClick,
}: {
  titulo: string
  detalle: string
  etiqueta?: string
  destacado?: boolean
  externo?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left rounded-xl border px-5 py-4 transition-all cursor-pointer active:scale-[0.99] ${
        destacado
          ? 'border-[#75AADB]/45 bg-[#75AADB]/[0.08] hover:bg-[#75AADB]/[0.14]'
          : 'border-white/12 bg-white/[0.03] hover:border-[#75AADB]/30 hover:bg-white/[0.06]'
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="font-black text-white">{titulo}</span>
        {etiqueta && (
          // Texto oscuro y no blanco: a 9px, blanco sobre #75AADB da 2,46:1 y no
          // llega al 4,5 de AA. Con #0f172b sube a 7,24:1.
          <span className="rounded-full bg-[#75AADB] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#0f172b]">
            {etiqueta}
          </span>
        )}
        <span
          aria-hidden
          className="ml-auto text-gray-500 transition-transform group-hover:translate-x-0.5"
        >
          {externo ? '↗' : '→'}
        </span>
      </span>
      <span className="mt-1 block text-sm text-gray-400 leading-relaxed">{detalle}</span>
    </button>
  )
}

function Volver({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 w-full text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}

/** Una fila del desglose. El total se separa con una línea: es el número que se busca. */
function Monto({
  label,
  valor,
  destacado,
  oro,
}: {
  label: string
  valor: number
  destacado?: boolean
  oro?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        destacado
          ? `mt-2 pt-2 border-t ${oro ? 'border-[#d4af37]/30' : 'border-[#75AADB]/20'}`
          : 'py-0.5'
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

/**
 * La clave pública la manda el servidor en la respuesta del checkout.
 *
 * Antes era `import.meta.env.VITE_MP_PUBLIC_KEY`, o sea una constante del
 * build. Eso tenía dos problemas: cambiarla exigía redeployar, y —el grave— un
 * preview compilado con la clave de producción cobraba de verdad mientras uno
 * creía estar probando. Ahora sigue el mismo flag de entorno que el token del
 * servidor. Ver `api/_lib/entorno.js`.
 */
function PasoPago({ preferenceId, publicKey, onVolver }: {
  preferenceId: string | null
  publicKey: string | null
  onVolver: () => void
}) {
  const [Wallet, setWallet] = useState<ComponentType<{
    initialization: { preferenceId: string }
    customization?: { texts?: { valueProp?: 'security_safety' }; visual?: { buttonBackground?: 'blue'; borderRadius?: string } }
  }> | null>(null)
  const [fallo, setFallo] = useState(false)
  const montado = useRef(true)

  useEffect(() => {
    if (!publicKey) return
    montado.current = true

    import('@mercadopago/sdk-react')
      .then(({ initMercadoPago, Wallet: W }) => {
        if (!montado.current) return
        if (!sdkListo) {
          initMercadoPago(publicKey, { locale: 'es-AR' })
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
  }, [publicKey])

  const error = !publicKey
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
        <Volver onClick={onVolver}>← Volver a mis datos</Volver>
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

      <Volver onClick={onVolver}>← Volver a mis datos</Volver>
    </div>
  )
}

export default TicketCheckoutModal
