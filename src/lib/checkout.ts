/**
 * Cliente de la API de venta de entradas.
 *
 * La verdad del precio y del stock vive en el backend (tabla `tiers`).
 * `src/content/tickets.json` sigue pintando las cards — incluidas las tandas
 * agotadas, que son historia visual — pero lo que se cobra sale de acá.
 */

/** Los dos tiers vendibles. Tienen que coincidir con los `id` de la tabla. */
export type TierId = 'general' | 'vip'

/** Qué id de tickets.json corresponde a cada tier del backend. */
export const TIER_POR_TICKET: Record<string, TierId> = {
  'tanda-4': 'general',
  vip: 'vip',
}

export type TierLive = {
  id: TierId
  nombre: string
  /** Precio de una entrada, en pesos enteros. */
  precio: number
  /** Cargo de servicio de UNA entrada. Tiene centavos. */
  cargo: number
  /** precio + cargo, de una entrada. */
  total: number
  disponible: number
}

/**
 * El estado de la venta propia, tal como lo cuenta `/api/tiers`.
 *
 * `ventaPropia` viaja aparte de la lista y no se deduce de que venga vacía: una
 * lista vacía puede ser «la venta está cerrada» o «no quedan tandas activas», y
 * el botón manda a un lado o al otro según cuál sea.
 */
export type Venta = {
  ventaPropia: boolean
  tiers: TierLive[]
}

export type Comprador = {
  nombre: string
  email: string
  /** Opcional. Para avisar de un cambio de último momento. */
  telefono: string
  /** Opcional. Sale en la lista de acreditación, para networking. */
  empresa: string
}

export type EstadoOrden = 'pending' | 'paid' | 'rejected' | 'expired' | 'refunded'

/** Una entrada emitida. Hay una por asistente, cada una con su propio QR. */
export type EntradaEmitida = {
  numero: number
  nombre: string | null
  token: string
}

export type Orden = {
  id: string
  tier: TierId
  cantidad: number
  subtotal: number
  cargo: number
  total: number
  status: EstadoOrden
  /** Por qué rechazó Mercado Pago, sólo cuando `status === 'rejected'`. */
  detalle: string | null
  nombre: string
  /** Enmascarado por el backend: `an•••@ejemplo.com`. */
  email: string
  /** Vacío mientras la orden no esté pagada: los tokens se emiten al acreditar. */
  entradas: EntradaEmitida[]
}

/** Error con el código que devuelve la API, para poder mostrar el mensaje justo. */
export class CheckoutError extends Error {
  // Campos declarados a mano: el tsconfig tiene `erasableSyntaxOnly`, que
  // prohíbe los parameter properties del constructor.
  codigo: string
  disponible?: number
  /**
   * El status HTTP. 0 cuando no hubo respuesta.
   *
   * Es lo que separa «esto no se arregla reintentando» (4xx) de «probá más
   * tarde» (5xx, o la API caída). El código de error solo no alcanza: un 500
   * también viene con su `{ error: … }`.
   */
  status: number

  constructor(codigo: string, disponible?: number, status = 0) {
    super(codigo)
    this.name = 'CheckoutError'
    this.codigo = codigo
    this.disponible = disponible
    this.status = status
  }
}

/**
 * True si vale la pena volver a intentarlo: la API no respondió, o falló ella.
 *
 * Existe por la pantalla de «confirmando tu pago». Ahí hay alguien que YA pagó,
 * y hasta acá cualquier excepción pasajera —un 502, el 4G que se corta un
 * segundo— mataba el poll para siempre y le mostraba «no encontramos la compra».
 * Un 404 sí es definitivo; un 503 no.
 *
 * Es la misma regla que usa la puerta desde siempre (`backoffice/src/lib/api.ts`).
 */
export function esReintentable(err: unknown): boolean {
  if (!(err instanceof CheckoutError)) return true // sin red
  return err.status === 0 || err.status >= 500
}

const MENSAJES: Record<string, string> = {
  sin_stock: 'Se agotaron mientras completabas los datos.',
  tier_no_disponible: 'Esa entrada ya no está a la venta.',
  email_invalido: 'Revisá el mail: no parece válido.',
  nombre_requerido: 'Escribí tu nombre y apellido.',
  asistente_requerido: 'Falta el nombre de alguna de las entradas.',
  cantidad_invalida: 'Cantidad inválida.',
  // Dos cosas distintas que antes se veían igual: la venta propia todavía no
  // abrió (decisión, VENTA_PROPIA) o el pago está mal configurado (accidente).
  venta_cerrada: 'La venta por acá todavía no abrió. Podés comprar en Startup Grind.',
  checkout_no_configurado: 'El pago online todavía no está habilitado.',
  api_no_disponible: 'El pago online no está disponible en este momento.',
}

export function mensajeDeError(err: unknown): string {
  if (err instanceof CheckoutError) {
    if (err.codigo === 'sin_stock' && err.disponible) {
      return `Quedan sólo ${err.disponible}. Probá con menos.`
    }
    return MENSAJES[err.codigo] || 'No pudimos iniciar el pago. Probá de nuevo.'
  }
  return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.'
}

async function parseError(res: Response): Promise<never> {
  let cuerpo: { error?: string; disponible?: number } = {}
  try {
    cuerpo = await res.json()
  } catch {
    /* respuesta sin JSON: cae al código genérico */
  }
  throw new CheckoutError(cuerpo.error || `http_${res.status}`, cuerpo.disponible, res.status)
}

/**
 * Devuelve el JSON, o falla si la respuesta no lo es.
 *
 * Hace falta porque en `vite dev` las rutas /api/* no existen: el fallback de la
 * SPA devuelve index.html con un 200, y sin este chequeo intentaríamos parsear
 * HTML como JSON. En Vercel esto no pasa (las funciones resuelven antes que los
 * rewrites), pero en local evita un error indescifrable.
 */
async function jsonSeguro<T>(res: Response): Promise<T> {
  const tipo = res.headers.get('content-type') || ''
  if (!tipo.includes('application/json')) {
    throw new CheckoutError('api_no_disponible')
  }
  return res.json() as Promise<T>
}

/** Precio y cupo reales. Devuelve null si la API no responde: el sitio sigue andando. */
export async function fetchTiers(signal?: AbortSignal): Promise<Venta | null> {
  try {
    const res = await fetch('/api/tiers', { signal })
    if (!res.ok) return null
    const data = await jsonSeguro<{ ventaPropia?: boolean; tiers?: TierLive[] }>(res)
    if (!Array.isArray(data.tiers)) return null
    return { ventaPropia: Boolean(data.ventaPropia), tiers: data.tiers }
  } catch {
    return null
  }
}

/**
 * Crea la orden y devuelve la preferencia con la que se monta el Wallet Brick.
 *
 * `asistentes` son los nombres, uno por entrada — cada uno recibe su propio QR.
 * El primero es el del comprador.
 */
export async function crearCheckout(
  tier: TierId,
  cantidad: number,
  buyer: Comprador,
  asistentes: string[],
  /**
   * La orden que este mismo modal dejó pendiente, si hubo una.
   *
   * Volver a «mis datos», cambiar algo y reenviar creaba una orden nueva cada
   * vez, y cada una se quedaba con su cupo reservado 30 minutos. Mandando la
   * anterior, el servidor la libera antes de contar el stock.
   */
  ordenPrevia?: string | null,
): Promise<{ orderId: string; preferenceId: string; publicKey?: string }> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, quantity: cantidad, buyer, asistentes, ordenPrevia }),
  })
  if (!res.ok) await parseError(res)
  // `publicKey` la manda el servidor: sigue el flag de entorno, así que un
  // preview nunca queda con la clave de producción incrustada en el bundle.
  return jsonSeguro<{ orderId: string; preferenceId: string; publicKey?: string }>(res)
}

/** Estado de una orden. Lo poletea /gracias esperando el webhook. */
export async function fetchOrden(id: string, signal?: AbortSignal): Promise<Orden> {
  const res = await fetch(`/api/orden?id=${encodeURIComponent(id)}`, { signal })
  if (!res.ok) await parseError(res)
  return jsonSeguro<Orden>(res)
}

export type Entrada = {
  orden: string
  tier: TierId
  tierNombre: string
  /** El asistente de ESTA entrada, no el comprador. */
  nombre: string | null
  /** Para poder decir "Entrada 2 de 3" cuando la compra fue de varias. */
  numero: number
  deTotal: number
  usadaEn: string | null
  compradaEn: string
}

export async function fetchEntrada(token: string, signal?: AbortSignal): Promise<Entrada> {
  const res = await fetch(`/api/entrada?t=${encodeURIComponent(token)}`, { signal })
  if (!res.ok) await parseError(res)
  return jsonSeguro<Entrada>(res)
}

/**
 * Formato de precio del sitio: `$35.000`.
 *
 * `centavos: true` fuerza los dos decimales, que es lo que va en un desglose:
 * con "$35.000 / $1.952,27 / $36.952,27" las columnas no alinean y el subtotal
 * parece redondeado.
 */
export function formatARS(pesos: number, { centavos = false } = {}): string {
  return '$' + pesos.toLocaleString('es-AR', {
    minimumFractionDigits: centavos ? 2 : 0,
    maximumFractionDigits: 2,
  })
}
