/**
 * Si una entrada es VIP.
 *
 * Vive en su propio módulo porque lo preguntan dos lugares que no se hablan
 * —el export de Inscriptos, que corre en el navegador, y
 * `scripts/exportar-listas.mjs`, que corre en la terminal— y la respuesta tiene
 * que ser la misma. Con una copia en cada uno, alcanza con que alguien ajuste
 * una para que el CSV que baja el organizador y el que sale del CLI cuenten
 * distintos VIP, sin que nada falle.
 *
 * Se deduce del TEXTO del nombre de la entrada porque es lo único que hay. En
 * la venta propia es exacto: la vista `acreditacion` traduce `tier_id = 'vip'`
 * a 'Entrada VIP'. En Luma y Startup Grind el nombre del ticket es texto libre
 * que escribió quien armó el evento allá ('VIP Pass', 'Entrada VIP', 'vip'),
 * así que se busca la palabra sin importar mayúsculas.
 *
 * `\b` y no `includes('vip')`: sin los límites de palabra, cualquier entrada
 * que dijera "Vipassana" o "Equipviaje" entraba como VIP. Es un criterio que
 * termina en un número que se le pasa a un sponsor, así que conviene que falle
 * por defecto y no de más — quien lo verifica es el bloque de "entradas
 * marcadas / no marcadas" que imprime el export.
 */
export function esVIP(entrada) {
  return /\bvip\b/i.test(String(entrada || ''))
}
