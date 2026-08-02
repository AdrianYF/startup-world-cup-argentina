/**
 * Todo lo que la puerta guarda en el teléfono.
 *
 * Está separado del cliente HTTP a propósito: es la mitad que sigue andando
 * cuando el wifi del venue se cae, y conviene poder mirarla sin leer nada de red.
 */
import type { Dia, Lista } from './tipos'

const K_TOKEN = 'puerta:token'
const K_POR = 'puerta:por'
const K_COLA = 'puerta:cola'
const K_DIAS = 'puerta:dias'
const kLista = (dia: string) => `puerta:lista:${dia}`

function leer<T>(clave: string): T | null {
  try {
    const crudo = localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : null
  } catch {
    return null
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    /* modo privado o disco lleno: la app sigue, sólo pierde el caché */
  }
}

/** El token de sesión que devuelve el PIN. */
export const sesion = {
  token: () => localStorage.getItem(K_TOKEN),
  guardar: (t: string) => localStorage.setItem(K_TOKEN, t),
  borrar: () => localStorage.removeItem(K_TOKEN),
}

/** Alias de quien está acreditando. Termina en `checkins.por`. */
export const quien = {
  leer: () => localStorage.getItem(K_POR) || '',
  guardar: (v: string) => localStorage.setItem(K_POR, v),
}

/** La lista de cada día, entera. Es lo que permite buscar sin señal. */
export const cache = {
  leer: (dia: string) => leer<Lista>(kLista(dia)),
  guardar: (lista: Lista) => escribir(kLista(lista.dia.id), lista),
}

/**
 * Los días del evento, guardados apenas se entra: sin esto, abrir la puerta sin
 * señal no sabría ni qué día mostrar.
 */
export const dias = {
  leer: () => leer<Dia[]>(K_DIAS) || [],
  guardar: (d: Dia[]) => escribir(K_DIAS, d),
}

/**
 * El día del evento que corresponde a hoy en Buenos Aires, o null si el evento
 * no arrancó (o si todavía no bajamos los días).
 *
 * Repite la regla de `diaDeHoy()` en `api/_lib/puerta.js`. La duplicación es
 * deliberada: es lo que deja abrir en el día correcto sin preguntarle al server.
 */
export function diaDeHoy(): string | null {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  return dias.leer().find(d => d.fecha === hoy)?.id || null
}

/* -------------------------------------------------------------------------- */
/* La cola: lo que no salió                                                    */
/* -------------------------------------------------------------------------- */

export type Pendiente = { url: string; cuerpo: Record<string, unknown> }

export const cola = {
  ver: () => leer<Pendiente[]>(K_COLA) || [],
  cuantos: () => (leer<Pendiente[]>(K_COLA) || []).length,
  sumar: (p: Pendiente) => escribir(K_COLA, [...cola.ver(), p]),
  reemplazar: (ps: Pendiente[]) => escribir(K_COLA, ps),
}
