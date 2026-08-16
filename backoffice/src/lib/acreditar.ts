/**
 * Las acciones de la puerta: anotar un ingreso, anotarlo por QR, anularlo, dar
 * de alta a alguien.
 *
 * Las que no necesitan respuesta del servidor —anotar, anular, agregar— fallan
 * hacia la cola, no hacia un error: en la puerta la persona ya entró, y la
 * pantalla no puede quedarse esperando a la nube. El escaneo sí necesita red,
 * porque el token lo resuelve el servidor.
 */
import { PuertaError, esReintentable, esSinSesion, mensajeDeError, postear } from './api'
import { cola, descartados, type Pendiente } from './almacen'
import type { Checkin, Persona } from './tipos'

const URL = '/api/puerta-checkin'
const URL_AGREGAR = '/api/puerta-agregar'

export type EstadoCola = { enCola: number; descartados: number }

const estado = (): EstadoCola => ({ enCola: cola.cuantos(), descartados: descartados.cuantos() })

/**
 * Manda lo que quedó pendiente, en orden.
 *
 * Reintentar es seguro porque el `id` de cada ingreso lo genera el cliente: el
 * servidor hace upsert y el mismo ingreso mandado tres veces se inserta una.
 *
 * Lo que el servidor rechaza con un 4xx no se arregla reintentando, así que
 * sale de la cola para no trabar lo que viene atrás — pero **no se tira**: va a
 * `descartados`, donde queda visible. Del otro lado hay una persona que ya
 * entró, y su ingreso desapareciendo en silencio es peor que el error.
 */
export async function vaciarCola(): Promise<EstadoCola> {
  let quedan = cola.ver()

  while (quedan.length) {
    try {
      await postear(quedan[0].url, quedan[0].cuerpo)
    } catch (err) {
      // Sin sesión no se sigue: lo que viene atrás va a fallar igual, y el PIN
      // lo tiene que volver a poner alguien.
      if (esSinSesion(err)) break
      // Sin red, o la API caída: se corta y el próximo intento retoma acá.
      if (esReintentable(err)) break
      descartados.sumar({ ...quedan[0], motivo: mensajeDeError(err) })
    }
    quedan = quedan.slice(1)
    cola.reemplazar(quedan)
  }

  return estado()
}

/** Vuelve a poner un descartado en la cola y la vacía. */
export async function reintentar(p: Pendiente): Promise<EstadoCola> {
  descartados.quitar(p.en)
  cola.sumar({ ...p, motivo: undefined })
  return vaciarCola()
}

/** Da por perdido un descartado. Lo decide una persona, nunca el código. */
export function olvidar(p: Pendiente): EstadoCola {
  descartados.quitar(p.en)
  return estado()
}

/** Si no sale, se encola y se sigue. Sólo la falta de sesión corta. */
async function postearOEncolar(url: string, cuerpo: Record<string, unknown>, que: string) {
  try {
    await postear(url, cuerpo)
  } catch (err) {
    if (esSinSesion(err)) throw err
    const pendiente: Pendiente = { url, cuerpo, que, en: new Date().toISOString() }
    if (esReintentable(err)) cola.sumar(pendiente)
    // Un 4xx acá tampoco se pierde: va derecho a descartados, que es donde el
    // staff lo va a encontrar.
    else descartados.sumar({ ...pendiente, motivo: mensajeDeError(err) })
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
  /** Acreditar en un día que la entrada no habilita. Lo decide el staff. */
  forzar?: boolean
}): Promise<Checkin> {
  const optimista: Checkin = {
    id: crypto.randomUUID(),
    ref: args.persona.id,
    origen: args.persona.origen,
    por: args.por?.trim() || null,
    anuladoEn: null,
    creadoEn: new Date().toISOString(),
  }

  await postearOEncolar(
    URL,
    {
      checkin: optimista.id,
      dia: args.dia,
      origen: optimista.origen,
      ref: optimista.ref,
      por: optimista.por,
      ...(args.forzar ? { forzar: true } : {}),
    },
    `Check-in for ${args.persona.nombre || args.persona.email || 'someone'}`,
  )

  return optimista
}

/** El camino del escáner: el token lo resuelve el servidor, así que necesita red. */
export function acreditarPorToken(args: {
  dia: string
  token: string
  por?: string
  forzar?: boolean
}) {
  return postear<{ checkin: Checkin; persona: Persona }>(URL, {
    checkin: crypto.randomUUID(),
    dia: args.dia,
    token: args.token,
    por: args.por?.trim() || null,
    ...(args.forzar ? { forzar: true } : {}),
  })
}

export function anular(id: string, quien?: string): Promise<void> {
  return postearOEncolar(URL, { anular: id }, `Undo the check-in for ${quien || 'someone'}`)
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
  telefono?: string
  empresa?: string
  motivo?: string
}): Promise<Persona> {
  const id = crypto.randomUUID()
  const cuerpo = {
    id,
    dia: args.dia,
    nombre: args.nombre.trim(),
    email: args.email?.trim() || '',
    telefono: args.telefono?.trim() || '',
    empresa: args.empresa?.trim() || '',
    motivo: args.motivo || '',
  }

  try {
    const r = await postear<{ persona: Persona }>(URL_AGREGAR, cuerpo)
    return r.persona
  } catch (err) {
    if (esSinSesion(err)) throw err
    // Un 4xx sí se propaga: si el nombre no pasó la validación, encolarlo sólo
    // escondería el problema, y del otro lado hay un formulario abierto que
    // puede mostrar el error y dejar corregirlo. A la cola va lo de red.
    if (err instanceof PuertaError && !esReintentable(err)) throw err
    cola.sumar({
      url: URL_AGREGAR,
      cuerpo,
      que: `Add ${cuerpo.nombre}`,
      en: new Date().toISOString(),
    })
    return {
      id,
      origen: 'puerta',
      nombre: cuerpo.nombre,
      email: cuerpo.email,
      telefono: cuerpo.telefono || null,
      empresa: cuerpo.empresa || null,
      entrada: 'Alta en puerta',
      dias: args.diasLabel,
    }
  }
}
