/**
 * Los datos que vienen en castellano, para una interfaz que está en inglés.
 *
 * La base guarda texto libre escrito por cada canal: `dias` sale del importador
 * («Jue 6 + Vie 7»), `entrada` es el nombre del ticket tal cual lo escribió
 * quien armó el evento en Luma o en Startup Grind («Cortesía», «Early Ticket 4to
 * Round»). Traducirlo en la base sería reescribir el dato de origen y romper el
 * match de `habilitaDia`, que busca «Jue» dentro de ese texto. Así que se
 * traduce al mostrarlo, que es lo único que está en inglés.
 *
 * Lo que no está en la tabla pasa de largo tal cual. Es a propósito: mañana un
 * canal exporta un ticket nuevo y tiene que aparecer con su nombre real en la
 * pantalla y en el CSV, no vacío ni traducido a medias. Un valor sin traducir se
 * lee raro; uno inventado se lee bien y miente.
 */

/**
 * Los días del evento. Son las tres abreviaturas que escribe el importador —las
 * mismas de `DIAS_IMPORT` y de `api/_lib/puerta.js`— y aparecen sueltas o
 * sumadas: «Vie 7», «Jue 6 + Vie 7».
 */
const DIAS: Record<string, string> = {
  'Mié': 'Wed',
  'Mie': 'Wed',
  'Jue': 'Thu',
  'Vie': 'Fri',
}

/** «Jue 6 + Vie 7» → «Thu 6 + Fri 7». El número y el « + » quedan igual. */
export function traducirDias(texto: string | null): string {
  if (!texto) return ''
  return texto.replace(/Mié|Mie|Jue|Vie/g, d => DIAS[d] || d)
}

/**
 * Los nombres de entrada que hay en el padrón.
 *
 * Los cuatro primeros los escribimos nosotros —el tier de Mercado Pago y el alta
 * de puerta—; los otros los escribió cada canal externo en su panel. Se traducen
 * los que están, y punto: no hay reglas ni heurísticas, porque «Early Ticket 4to
 * Round» no se deduce de nada.
 */
const ENTRADAS: Record<string, string> = {
  'Entrada VIP': 'VIP Ticket',
  'Entrada General': 'General Ticket',
  'Alta en check-in': 'Added at check-in',
  'Invitación': 'Invitation',
  'Prensa': 'Press',
  'Compró, no figura': 'Paid, not listed',
  'Cortesía': 'Complimentary',
  'Invitado VIP': 'VIP Guest',
  'Última tanda': 'Last Release',
  'Early Ticket 3 Round': 'Early Ticket 3rd Round',
  'Early Ticket 4to Round': 'Early Ticket 4th Round',
}

/**
 * El nombre de la entrada en inglés, o el original si no lo conocemos.
 *
 * OJO: no lo uses para decidir si una entrada es VIP. Eso lo contesta `esVIP`
 * sobre el texto ORIGINAL — que es el que llegó del canal— y las dos formas
 * («Invitado VIP», «VIP Guest») matchean igual, pero el criterio tiene que
 * leerse siempre del mismo lado o un día van a contar distinto.
 */
export function traducirEntrada(texto: string | null): string {
  if (!texto) return ''
  return ENTRADAS[texto.trim()] || texto
}
