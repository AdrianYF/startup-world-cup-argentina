/**
 * Las secciones del backoffice.
 *
 * En su propio archivo y no dentro de `Shell.tsx` porque las usan el shell, el
 * router y el encabezado de cada pantalla — y un módulo que exporta componentes
 * *y* constantes rompe el fast refresh de Vite.
 *
 * La bajada vive acá y no en cada sección por la misma razón que el label: es
 * copy, lo lee gente del staff que no escribió el código, y tenerlo junto es lo
 * que hace que las cinco suenen a la misma app.
 */
import { PERSONAS } from './ruta'

export type Seccion = { id: string; label: string; bajada: string }

/**
 * El orden es el de uso, no el del organigrama: Personas primero porque es lo
 * que se abre el 95% de las veces.
 */
export const SECCIONES: Seccion[] = [
  {
    id: PERSONAS,
    label: 'Personas',
    bajada: 'La lista de acreditación y el padrón completo. Acá se acredita, se corrige y se da de baja.',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    bajada: 'Las compras de la venta propia: destrabar un pago, reenviar la entrada, liberar un cupo reservado.',
  },
  {
    id: 'stock',
    label: 'Stock',
    bajada: 'El cupo y el precio de cada tier de la web. Startup Grind vende su propio stock, aparte.',
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

export function nombreDe(ruta: string): string {
  return SECCIONES.find(s => s.id === ruta)?.label || 'Backoffice'
}
