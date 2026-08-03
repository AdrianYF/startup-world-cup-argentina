/**
 * Lo que se lleva puesto al cambiar de pantalla.
 *
 * Hoy es una sola cosa: el apellido que se venía tipeando. Cruzar de la puerta a
 * Inscriptos —o llegar desde la paleta de comandos— no tiene que obligar a
 * escribirlo de nuevo, que es exactamente la fricción por la que antes la gente
 * abría dos pestañas.
 *
 * Una variable de módulo y no la URL: dura lo que dura la pregunta «¿estará en
 * otro día?», y no vale ensuciar un router de treinta líneas con parseo de query
 * string. Se consume una sola vez —`tomar()` lo devuelve y lo borra— para que la
 * próxima visita arranque en blanco en vez de con el apellido de hace una hora.
 */
let pendiente = ''

export function dejar(busqueda: string) {
  pendiente = busqueda.trim()
}

export function tomar(): string {
  const v = pendiente
  pendiente = ''
  return v
}
