/**
 * El cliente HTTP: hablar con `/api/puerta*` y nada más.
 *
 * Las acciones que además tocan el almacén local (acreditar, deshacer) viven en
 * `acreditar.ts`, que usa esto por abajo.
 */
import { cache, dias, sesion } from './almacen'
import type { Delta, Dia, Lista } from './tipos'

export class PuertaError extends Error {
  // Campos declarados a mano: el tsconfig tiene `erasableSyntaxOnly`, que
  // prohíbe los parameter properties del constructor.
  codigo: string
  /** El cuerpo de la respuesta. Un 409 trae la persona, para poder mostrarla. */
  datos: Record<string, unknown>
  /**
   * El status HTTP. 0 cuando no hubo respuesta.
   *
   * Es lo que separa "esto no se arregla reintentando" (4xx) de "probá más
   * tarde" (5xx, o la API caída): el código de error solo no alcanza, porque un
   * 500 también viene con su `{ error: … }`.
   */
  status: number

  constructor(codigo: string, datos: Record<string, unknown> = {}, status = 0) {
    super(codigo)
    this.name = 'PuertaError'
    this.codigo = codigo
    this.datos = datos
    this.status = status
  }
}

/** True si vale la pena volver a intentarlo: la API no respondió, o falló ella. */
export function esReintentable(err: unknown): boolean {
  if (!(err instanceof PuertaError)) return true // sin red
  return err.status === 0 || err.status >= 500
}

const MENSAJES: Record<string, string> = {
  pin_invalido: "That's not the PIN.",
  puerta_no_configurada: "The PIN isn't set up on the server.",
  sin_sesion: 'Session expired. Enter the PIN again.',
  api_no_disponible: "The API isn't responding.",
  entrada_inexistente: "That QR isn't from this event.",
  persona_inexistente: "We couldn't find that person on the list.",
  dia_no_habilitado: "That ticket isn't for this day.",
  nombre_requerido: 'The name is missing.',
  email_invalido: "That email isn't valid.",
}

export function mensajeDeError(err: unknown): string {
  if (err instanceof PuertaError) {
    return MENSAJES[err.codigo] || 'Something failed. Try again.'
  }
  return 'No connection.'
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
    throw new PuertaError('sin_sesion', {}, 401)
  }

  // En `vite dev` sin el plugin de api/, el fallback de la SPA devuelve el
  // index.html con 200: sin este chequeo intentaríamos parsear HTML.
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new PuertaError('api_no_disponible')
  }

  const cuerpo = await res.json()
  if (!res.ok) throw new PuertaError(cuerpo?.error || `http_${res.status}`, cuerpo || {}, res.status)
  return cuerpo as T
}

export function postear<T>(url: string, cuerpo: unknown): Promise<T> {
  return pedir<T>(url, { method: 'POST', body: JSON.stringify(cuerpo) })
}

/* -------------------------------------------------------------------------- */

export async function login(pin: string): Promise<void> {
  const r = await postear<{ token: string; dias: Dia[] }>('/api/backoffice', { pin })
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

/**
 * Lo que cambió desde `cursor`. Es cómo se ven dos puertas entre sí.
 *
 * Trae ingresos **y personas**: sin las personas, un alta hecha en una puerta no
 * aparecía nunca en la otra, porque la lista completa sólo se pide al cambiar
 * de día.
 */
export function traerDelta(dia: string, cursor: string) {
  return pedir<Delta>(
    `/api/puerta?dia=${encodeURIComponent(dia)}&desde=${encodeURIComponent(cursor)}`,
  )
}
