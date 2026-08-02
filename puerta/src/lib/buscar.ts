/**
 * Buscar y ordenar la lista. Funciones puras: no tocan red ni almacén, y por eso
 * la búsqueda anda igual con el wifi caído.
 */
import type { Checkin, Persona } from './tipos'

/** Sin acentos y en minúscula: en la puerta nadie tipea "Gonzálvez" con tilde. */
export function normalizar(s: string | null | undefined): string {
  return (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * El apellido, para ordenar: la última palabra del nombre completo. Mismo
 * criterio que `scripts/lista-puerta.mjs`, y por la misma razón — en la puerta
 * la gente dice el apellido, no el nombre.
 */
export function apellido(nombre: string | null): string {
  return normalizar(nombre).trim().split(/\s+/).slice(-1)[0] || ''
}

export function ordenarPorApellido(personas: Persona[]): Persona[] {
  return [...personas].sort((a, b) => {
    const cmp = apellido(a.nombre).localeCompare(apellido(b.nombre), 'es')
    return cmp !== 0 ? cmp : normalizar(a.nombre).localeCompare(normalizar(b.nombre), 'es')
  })
}

/**
 * Filtra por nombre, mail o empresa. Cada palabra tipeada tiene que aparecer en
 * algún lado, no necesariamente juntas: "juan acme" encuentra a Juan Pérez de
 * Acme.
 */
export function filtrar(personas: Persona[], busqueda: string): Persona[] {
  const partes = normalizar(busqueda).split(/\s+/).filter(Boolean)
  if (!partes.length) return personas
  return personas.filter(p => {
    const heno = normalizar(`${p.nombre || ''} ${p.email} ${p.empresa || ''}`)
    return partes.every(parte => heno.includes(parte))
  })
}

/** Los ingresos vigentes de cada fila de la lista, indexados por su `id`. */
export function porPersona(checkins: Checkin[]): Map<string, Checkin[]> {
  const mapa = new Map<string, Checkin[]>()
  for (const c of checkins) {
    if (c.anuladoEn) continue
    const previos = mapa.get(c.ref)
    if (previos) previos.push(c)
    else mapa.set(c.ref, [c])
  }
  for (const lista of mapa.values()) {
    lista.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
  }
  return mapa
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
