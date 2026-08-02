/**
 * El cliente HTTP: hablar con `/api/puerta*` y nada más.
 *
 * Las acciones que además tocan el almacén local (acreditar, deshacer) viven en
 * `acreditar.ts`, que usa esto por abajo.
 */
import { cache, dias, sesion } from './almacen'
import type { Checkin, Dia, Lista } from './tipos'

export class PuertaError extends Error {
  // Campo declarado a mano: el tsconfig tiene `erasableSyntaxOnly`, que prohíbe
  // los parameter properties del constructor.
  codigo: string

  constructor(codigo: string) {
    super(codigo)
    this.name = 'PuertaError'
    this.codigo = codigo
  }
}

const MENSAJES: Record<string, string> = {
  pin_invalido: 'Ese PIN no es.',
  puerta_no_configurada: 'Falta configurar el PIN en el servidor.',
  sin_sesion: 'La sesión venció. Volvé a poner el PIN.',
  api_no_disponible: 'La API no está respondiendo.',
  entrada_inexistente: 'Ese QR no es de acá.',
  persona_inexistente: 'No encontramos a esa persona en la lista.',
}

export function mensajeDeError(err: unknown): string {
  if (err instanceof PuertaError) {
    return MENSAJES[err.codigo] || 'Algo falló. Probá de nuevo.'
  }
  return 'Sin conexión.'
}

export function esSinSesion(err: unknown): boolean {
  return err instanceof PuertaError && err.codigo === 'sin_sesion'
}

export async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const token = sesion.token()
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    sesion.borrar()
    throw new PuertaError('sin_sesion')
  }

  // En `vite dev` sin el plugin de api/, el fallback de la SPA devuelve el
  // index.html con 200: sin este chequeo intentaríamos parsear HTML.
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new PuertaError('api_no_disponible')
  }

  const cuerpo = await res.json()
  if (!res.ok) throw new PuertaError(cuerpo?.error || `http_${res.status}`)
  return cuerpo as T
}

export function postear<T>(url: string, cuerpo: unknown): Promise<T> {
  return pedir<T>(url, { method: 'POST', body: JSON.stringify(cuerpo) })
}

/* -------------------------------------------------------------------------- */

export async function login(pin: string): Promise<void> {
  const r = await postear<{ token: string; dias: Dia[] }>('/api/puerta-login', { pin })
  sesion.guardar(r.token)
  dias.guardar(r.dias)
}

/** La lista completa de un día. `dia` vacío = el que el servidor considere hoy. */
export async function traerLista(dia: string): Promise<Lista> {
  const lista = await pedir<Lista>(`/api/puerta?dia=${encodeURIComponent(dia)}`)
  dias.guardar(lista.dias)
  cache.guardar(lista)
  return lista
}

/** Sólo los ingresos nuevos desde `cursor`. Es cómo se ven dos puertas entre sí. */
export function traerDelta(dia: string, cursor: string) {
  return pedir<{ cursor: string; checkins: Checkin[] }>(
    `/api/puerta?dia=${encodeURIComponent(dia)}&desde=${encodeURIComponent(cursor)}`,
  )
}
