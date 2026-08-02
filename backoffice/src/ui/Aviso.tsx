import type { ReactNode } from 'react'
import { IconoAlerta, IconoInfo, IconoTick } from './Iconos'

/**
 * El recuadro que explica algo antes de que pase, o que cuenta lo que pasó.
 *
 * Existía copiado seis veces —el error coral de Importar, el aviso ámbar del
 * pago doble, el verde de "mail reenviado"— siempre con el mismo markup y
 * distinto padding. Acá el tono es un dato, no una clase que se vuelve a
 * escribir.
 *
 * Siempre lleva icono: el color solo no alcanza para quien no lo distingue, y
 * estos carteles aparecen justo cuando algo salió mal.
 */
type Tono = 'info' | 'ok' | 'warn' | 'error'

const TONOS: Record<Tono, { caja: string; icono: ReactNode }> = {
  info: {
    caja: 'border-swc-accent/30 bg-swc-accent/10 text-swc-accent',
    icono: <IconoInfo tam={16} />,
  },
  ok: {
    caja: 'border-swc-ok/40 bg-swc-ok/10 text-swc-ok',
    icono: <IconoTick tam={16} />,
  },
  warn: {
    caja: 'border-swc-warn/40 bg-swc-warn/10 text-swc-warn',
    icono: <IconoAlerta tam={16} />,
  },
  error: {
    caja: 'border-swc-coral/40 bg-swc-coral/10 text-swc-coral',
    icono: <IconoAlerta tam={16} />,
  },
}

export function Aviso({ tono = 'info', titulo, children, acciones, className = '' }: {
  tono?: Tono
  /** La línea en negrita de arriba. Sin esto, `children` es todo el mensaje. */
  titulo?: ReactNode
  children?: ReactNode
  /** Botones al pie del aviso: reintentar, ver, descartar. */
  acciones?: ReactNode
  className?: string
}) {
  const { caja, icono } = TONOS[tono]
  return (
    <div
      role={tono === 'error' ? 'alert' : undefined}
      className={`flex gap-2.5 rounded-xl border px-4 py-3 ${caja} ${className}`}
    >
      <span className="mt-0.5 shrink-0">{icono}</span>
      <div className="min-w-0 flex-1 text-sm">
        {titulo && <p className="font-bold">{titulo}</p>}
        {children && <div className={titulo ? 'mt-0.5 text-gray-300' : 'font-bold'}>{children}</div>}
        {acciones && <div className="mt-2.5 flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  )
}
