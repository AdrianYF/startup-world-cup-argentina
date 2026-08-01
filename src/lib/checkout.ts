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

export type Comprador = {
  nombre: string
  email: string
  dni: string
}

export type EstadoOrden = 'pending' | 'paid' | 'rejected' | 'expired' | 'refunded'

export type Orden = {
  id: string
  tier: TierId
  cantidad: number
  subtotal: number
  cargo: number
  total: number
  status: EstadoOrden
  nombre: string
  ticketToken: string | null
}

/** Error con el código que devuelve la API, para poder mostrar el mensaje justo. */
export class CheckoutError extends Error {
  // Campos declarados a mano: el tsconfig tiene `erasableSyntaxOnly`, que
  // prohíbe los parameter properties del constructor.
  codigo: string
  disponible?: number

  constructor(codigo: string, disponible?: number) {
    super(codigo)
    this.name = 'CheckoutError'
    this.codigo = codigo
    this.disponible = disponible
  }
}

const MENSAJES: Record<string, string> = {
  sin_stock: 'Se agotaron mientras completabas los datos.',
  tier_no_disponible: 'Esa entrada ya no está a la venta.',
  email_invalido: 'Revisá el mail: no parece válido.',
  nombre_requerido: 'Escribí tu nombre y apellido.',
  cantidad_invalida: 'Cantidad inválida.',
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
  throw new CheckoutError(cuerpo.error || `http_${res.status}`, cuerpo.disponible)
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
export async function fetchTiers(signal?: AbortSignal): Promise<TierLive[] | null> {
  try {
    const res = await fetch('/api/tiers', { signal })
    if (!res.ok) return null
    const data = await jsonSeguro<{ tiers?: TierLive[] }>(res)
    return Array.isArray(data.tiers) ? data.tiers : null
  } catch {
    return null
  }
}

/** Crea la orden y devuelve la preferencia con la que se monta el Wallet Brick. */
export async function crearCheckout(
  tier: TierId,
  cantidad: number,
  buyer: Comprador,
): Promise<{ orderId: string; preferenceId: string }> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, quantity: cantidad, buyer }),
  })
  if (!res.ok) await parseError(res)
  return jsonSeguro<{ orderId: string; preferenceId: string }>(res)
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
  cantidad: number
  nombre: string
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
