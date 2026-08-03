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
const K_DESCARTADOS = 'puerta:descartados'
const K_DIAS = 'puerta:dias'
const PREFIJO_LISTA = 'puerta:lista:'
const kLista = (dia: string) => `${PREFIJO_LISTA}${dia}`

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

  /**
   * Borra las listas guardadas. Se llama al salir.
   *
   * La lista es la lista entera del evento —nombre, mail y teléfono de cada
   * persona— y no tiene por qué sobrevivir a la sesión: es un celular prestado
   * entre el staff, y cualquiera que lo agarre después no debería poder leerla
   * desde el devtools sin siquiera saber el PIN.
   *
   * La cola NO se toca acá a propósito: lo que todavía no salió tiene que
   * seguir ahí cuando entre el siguiente. Ver `sesion.borrar`.
   */
  vaciar: () => {
    for (const clave of Object.keys(localStorage)) {
      if (clave.startsWith(PREFIJO_LISTA)) localStorage.removeItem(clave)
    }
    localStorage.removeItem(K_DIAS)
  },
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

export type Pendiente = {
  url: string
  cuerpo: Record<string, unknown>
  /** De qué se trata, para poder mostrarlo sin decodificar el cuerpo. */
  que: string
  /** Cuándo se encoló. */
  en: string
  /** Por qué lo rechazó el servidor. Sólo en los descartados. */
  motivo?: string
}

export const cola = {
  ver: () => leer<Pendiente[]>(K_COLA) || [],
  cuantos: () => (leer<Pendiente[]>(K_COLA) || []).length,
  sumar: (p: Pendiente) => escribir(K_COLA, [...cola.ver(), p]),
  reemplazar: (ps: Pendiente[]) => escribir(K_COLA, ps),
}

/**
 * Lo que el servidor rechazó y no se arregla reintentando.
 *
 * Antes esto se tiraba en silencio para que no trabara la cola. El problema es
 * que del otro lado hay una persona que YA entró: si su ingreso desaparece sin
 * que nadie se entere, el conteo miente y no hay forma de reconstruirlo. Ahora
 * queda acá, visible en la hoja de pendientes, hasta que alguien lo mire.
 */
export const descartados = {
  ver: () => leer<Pendiente[]>(K_DESCARTADOS) || [],
  cuantos: () => (leer<Pendiente[]>(K_DESCARTADOS) || []).length,
  sumar: (p: Pendiente) => escribir(K_DESCARTADOS, [...descartados.ver(), p]),
  quitar: (en: string) => escribir(K_DESCARTADOS, descartados.ver().filter(p => p.en !== en)),
  vaciar: () => localStorage.removeItem(K_DESCARTADOS),
}
