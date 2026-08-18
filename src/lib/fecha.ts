/**
 * Las fechas del sitio, en castellano y sin sorpresas de zona horaria.
 *
 * `new Date('2026-08-07')` se parsea como UTC y en Buenos Aires cae el 6: una
 * nota fechada el 7 salía diciendo «6 de agosto». El mediodía la deja lejos de
 * los dos bordes, así que la fecha que se lee es la que dice el JSON.
 *
 * Vive en `lib/` y no al lado del componente que la usa por una razón tonta y
 * real: exportar una función desde un archivo de componentes rompe el fast
 * refresh de Vite, y el lint lo marca.
 */
export function fechaLarga(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
