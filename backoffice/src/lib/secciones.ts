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
    label: 'Inscriptos',
    bajada: 'La lista entera de los tres días: corregir un dato, reenviar la entrada, dar de baja — y acreditar, sin volver a la puerta.',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    bajada: 'Las compras por Mercado Pago: destrabar un pago, reenviar la entrada, liberar un cupo reservado.',
  },
  {
    id: 'stock',
    label: 'Stock',
    bajada: 'El cupo y el precio de cada tier que se vende por Mercado Pago. Luma y Startup Grind manejan el suyo.',
  },
  {
    id: 'importar',
    label: 'Importar',
    bajada: 'El CSV de Luma o Startup Grind, siempre con vista previa antes de escribir.',
  },
  {
    id: 'metricas',
    label: 'Métricas',
    bajada: 'Cómo viene el evento: cuánto entró, por qué canal y a qué hora.',
  },
]

export function seccionDe(ruta: string): Seccion {
  return SECCIONES.find(s => s.id === ruta) || SECCIONES[0]
}
