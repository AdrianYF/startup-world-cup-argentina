import type { ReactNode } from 'react'
import { Rotulo } from './Campos'

/**
 * La card partida: el patrón central del backoffice.
 *
 * A la izquierda el **panel de trabajo** —lo que se completa y se toca— y a la
 * derecha el **panel de contexto**: en qué paso del flujo estamos, qué va a
 * pasar cuando se apriete el botón, y qué NO hace esta pantalla.
 *
 * La división no es decorativa: casi todo lo que se rompe en un backoffice de
 * evento se rompe porque quien opera no sabía la consecuencia. Un import que
 * pisa la lista, un cupo bajado por debajo de lo vendido, un reembolso que no
 * devuelve la plata. Todo eso vivía en párrafos grises al final de la pantalla,
 * abajo del botón que ya se había apretado. Acá tiene un lugar fijo, al lado.
 *
 * En el celular el contexto va DESPUÉS del trabajo: parado en la fila lo que
 * hace falta es el control, no la explicación.
 */
export function Operacion({ contexto, children, className = '' }: {
  contexto?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-swc-surface ${
        contexto ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]' : ''
      } ${className}`}
    >
      <div className="min-w-0 px-4 py-5 sm:px-7 sm:py-7">{children}</div>

      {contexto && (
        // El acento de marca en gradiente sobre la surface: es el equivalente
        // oscuro del panel azul lleno. Un celeste sólido acá obligaría a texto
        // oscuro y sería lo único claro de toda la app.
        <aside className="border-t border-swc-accent/20 bg-[linear-gradient(160deg,rgba(117,170,219,0.22),rgba(117,170,219,0.05))] px-4 py-5 sm:px-7 sm:py-7 lg:border-t-0 lg:border-l">
          {contexto}
        </aside>
      )}
    </section>
  )
}

/** Un bloque rotulado dentro del panel de contexto. */
export function Bloque({ titulo, children, className = '' }: {
  titulo: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Rotulo className="mb-3 text-swc-accent">{titulo}</Rotulo>
      {children}
    </div>
  )
}

/**
 * La nota al pie del panel de contexto: lo que esta pantalla NO hace.
 *
 * Es el lugar de "la plata se devuelve en Mercado Pago, no acá" y de "quien deja
 * de aparecer en el CSV no se da de baja solo". Antes eran párrafos sueltos que
 * cada sección ponía donde le quedaba.
 */
export function Limite({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-gray-500">
      {children}
    </p>
  )
}
