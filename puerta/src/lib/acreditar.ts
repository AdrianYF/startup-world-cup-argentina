/**
 * Las tres acciones de la puerta: anotar un ingreso, anotarlo por QR, deshacerlo.
 *
 * Las dos que no necesitan respuesta del servidor —anotar y deshacer— fallan
 * hacia la cola, no hacia un error: en la puerta la persona ya entró, y la
 * pantalla no puede quedarse esperando a la nube. El escaneo sí necesita red,
 * porque el token lo resuelve el servidor.
 */
import { PuertaError, esSinSesion, postear } from './api'
import { cola } from './almacen'
import type { Checkin, Persona } from './tipos'

const URL = '/api/puerta-checkin'
const URL_AGREGAR = '/api/puerta-agregar'

/**
 * Manda lo que quedó pendiente, en orden. Devuelve cuántos siguen sin salir.
 *
 * Reintentar es seguro porque el `id` de cada ingreso lo genera el cliente: el
 * servidor hace upsert y el mismo ingreso mandado tres veces se inserta una.
 */
export async function vaciarCola(): Promise<number> {
  let quedan = cola.ver()
  while (quedan.length) {
    try {
      await postear(quedan[0].url, quedan[0].cuerpo)
    } catch (err) {
      // Sin conexión, o sin sesión: se corta y se reintenta más tarde.
      if (!(err instanceof PuertaError) || esSinSesion(err)) break
      // Cualquier otro error de la API es un 4xx que no se arregla reintentando:
      // se descarta ese ingreso para que no trabe los que vienen atrás.
    }
    quedan = quedan.slice(1)
    cola.reemplazar(quedan)
  }
  return quedan.length
}

/** Si no sale, se encola y se sigue. Sólo la falta de sesión corta. */
async function postearOEncolar(cuerpo: Record<string, unknown>) {
  try {
    await postear(URL, cuerpo)
  } catch (err) {
    if (esSinSesion(err)) throw err
    cola.sumar({ url: URL, cuerpo })
  }
}

/**
 * Anota un ingreso y devuelve el check-in **igual si la red falló**: la pantalla
 * lo muestra como hecho y la cola se encarga del resto.
 */
export async function acreditar(args: {
  dia: string
  persona: Persona
  por?: string
}): Promise<Checkin> {
  const optimista: Checkin = {
    id: crypto.randomUUID(),
    ref: args.persona.id,
    origen: args.persona.origen,
    por: args.por?.trim() || null,
    anuladoEn: null,
    creadoEn: new Date().toISOString(),
  }

  await postearOEncolar({
    checkin: optimista.id,
    dia: args.dia,
    origen: optimista.origen,
    ref: optimista.ref,
    por: optimista.por,
  })

  return optimista
}

/** El camino del escáner: el token lo resuelve el servidor, así que necesita red. */
export function acreditarPorToken(args: { dia: string; token: string; por?: string }) {
  return postear<{ checkin: Checkin; persona: Persona }>(URL, {
    checkin: crypto.randomUUID(),
    dia: args.dia,
    token: args.token,
    por: args.por?.trim() || null,
  })
}

export function anular(id: string): Promise<void> {
  return postearOEncolar({ anular: id })
}

/**
 * Da de alta a alguien que no está en la lista y lo devuelve como fila.
 *
 * Sin señal se encola y se devuelve una fila optimista: la persona ya está
 * parada en la puerta y no puede esperar a que vuelva el wifi. El `id` lo genera
 * acá, así que el reintento no crea a nadie dos veces.
 */
export async function agregar(args: {
  dia: string
  diasLabel: string
  nombre: string
  email?: string
  empresa?: string
}): Promise<Persona> {
  const id = crypto.randomUUID()
  const cuerpo = {
    id,
    dia: args.dia,
    nombre: args.nombre.trim(),
    email: args.email?.trim() || '',
    empresa: args.empresa?.trim() || '',
  }

  try {
    const r = await postear<{ persona: Persona }>(URL_AGREGAR, cuerpo)
    return r.persona
  } catch (err) {
    if (esSinSesion(err)) throw err
    // Un 4xx sí se propaga: si el nombre no pasó la validación, encolarlo sólo
    // escondería el problema. A la cola va únicamente lo que falló por red.
    if (err instanceof PuertaError) throw err
    cola.sumar({ url: URL_AGREGAR, cuerpo })
    return {
      id,
      origen: 'puerta',
      nombre: cuerpo.nombre,
      email: cuerpo.email,
      telefono: null,
      empresa: cuerpo.empresa || null,
      entrada: 'Alta en puerta',
      dias: args.diasLabel,
    }
  }
}
