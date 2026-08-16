/**
 * Las secciones de ADMINISTRACIÓN.
 *
 * La puerta no está acá a propósito: no es una sección entre otras, es la raíz.
 * Quien acredita abre la app y ya está donde tiene que estar, sin barra de
 * navegación y sin elegir nada. Todo lo de este archivo es lo otro: lo que se
 * mira sentado, con wifi, para entender algo o para arreglarlo.
 *
 * En su propio archivo y no dentro de `Shell.tsx` porque las usan el shell, el
 * router y el encabezado de cada pantalla — y un módulo que exporta componentes
 * *y* constantes rompe el fast refresh de Vite.
 *
 * La bajada vive acá y no en cada sección por la misma razón que el label: es
 * copy, lo lee gente del staff que no escribió el código, y tenerlo junto es lo
 * que hace que todas suenen a la misma app.
 */
export type Seccion = { id: string; label: string; bajada: string }

/** La lista completa: los tres días juntos, sin filtro, editable. */
export const INSCRIPTOS = 'inscriptos'

/**
 * El orden es el de uso. Inscriptos primero porque responde «¿esta persona
 * está?», que es la pregunta que más sube desde la puerta.
 */
export const SECCIONES: Seccion[] = [
  {
    id: INSCRIPTOS,
    label: 'Registered',
    bajada: 'The whole list for all three days: fix a detail, resend a ticket, remove someone — and check people in, without going back to the door.',
  },
  {
    id: 'ventas',
    label: 'Sales',
    bajada: 'Mercado Pago purchases: unblock a payment, resend a ticket, release a held spot.',
  },
  {
    id: 'stock',
    label: 'Stock',
    bajada: 'The cap and the price of each tier sold through Mercado Pago. Luma and Startup Grind handle their own.',
  },
  {
    id: 'importar',
    label: 'Import',
    bajada: 'The Luma or Startup Grind CSV, always with a preview before writing anything.',
  },
  {
    id: 'metricas',
    label: 'Metrics',
    bajada: 'How the event is going: how many came in, through which channel and at what time.',
  },
]

export function seccionDe(ruta: string): Seccion {
  return SECCIONES.find(s => s.id === ruta) || SECCIONES[0]
}
