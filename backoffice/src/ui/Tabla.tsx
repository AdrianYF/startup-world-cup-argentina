import { useMemo, useState, type ReactNode } from 'react'

/**
 * La tabla de las secciones de escritorio.
 *
 * Una tabla de verdad —densa, con columnas ordenables— arriba de `md:`, y
 * tarjetas abajo. No es una concesión: en un celular una tabla de siete
 * columnas se lee con scroll horizontal, que es exactamente lo que nadie hace
 * parado en un pasillo.
 *
 * Ordenar vive acá y no en cada sección porque es lo único que TODAS necesitan
 * y lo que nadie quiere volver a escribir seis veces.
 */
export type Columna<T> = {
  clave: string
  titulo: string
  /** Qué pintar en la celda. */
  celda: (fila: T) => ReactNode
  /** Por qué ordenar. Sin esto la columna no se puede ordenar. */
  orden?: (fila: T) => string | number
  /** Alinear a la derecha: números y montos. */
  numerica?: boolean
  /** Ocultar en las tarjetas de mobile: lo que sólo aporta en la tabla ancha. */
  soloTabla?: boolean
}

type Props<T> = {
  columnas: Columna<T>[]
  filas: T[]
  claveDe: (fila: T) => string
  onFila?: (fila: T) => void
  /** Qué decir cuando no hay nada. Un vacío sin explicación parece un error. */
  vacio?: ReactNode
}

function Tabla<T>({ columnas, filas, claveDe, onFila, vacio }: Props<T>) {
  const [porCol, setPorCol] = useState<string>('')
  const [desc, setDesc] = useState(false)

  const ordenadas = useMemo(() => {
    const col = columnas.find(c => c.clave === porCol)
    if (!col?.orden) return filas
    const saca = col.orden
    return [...filas].sort((a, b) => {
      const va = saca(a)
      const vb = saca(b)
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es')
      return desc ? -cmp : cmp
    })
  }, [filas, columnas, porCol, desc])

  function ordenarPor(clave: string) {
    if (clave === porCol) setDesc(d => !d)
    else { setPorCol(clave); setDesc(false) }
  }

  if (!filas.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-12 text-center">
        <p className="text-sm text-gray-500">{vacio || 'No hay nada para mostrar.'}</p>
      </div>
    )
  }

  return (
    <>
      {/* Escritorio. El contenedor scrollea solo: una tabla ancha no puede
          arrastrar el body entero para el costado. */}
      <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {columnas.map(c => (
                <th
                  key={c.clave}
                  scope="col"
                  className={`px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-500 ${
                    c.numerica ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.orden ? (
                    <button
                      onClick={() => ordenarPor(c.clave)}
                      className="uppercase tracking-[0.12em] hover:text-swc-light"
                    >
                      {c.titulo}
                      {porCol === c.clave && <span className="ml-1">{desc ? '↓' : '↑'}</span>}
                    </button>
                  ) : c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map(f => (
              <tr
                key={claveDe(f)}
                onClick={onFila ? () => onFila(f) : undefined}
                className={`border-b border-white/5 last:border-b-0 ${
                  onFila ? 'cursor-pointer hover:bg-white/[0.04]' : ''
                }`}
              >
                {columnas.map(c => (
                  <td
                    key={c.clave}
                    className={`px-3 py-2.5 align-top text-swc-light ${
                      c.numerica ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {c.celda(f)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular. La primera columna hace de título y el resto va como pares
          etiqueta/valor: es lo que se puede leer de un vistazo con una mano. */}
      <ul className="flex flex-col gap-2 md:hidden">
        {ordenadas.map(f => {
          const [primera, ...resto] = columnas
          return (
            <li key={claveDe(f)}>
              <button
                onClick={onFila ? () => onFila(f) : undefined}
                disabled={!onFila}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left active:bg-white/[0.05] disabled:active:bg-transparent"
              >
                <p className="font-bold text-swc-light">{primera.celda(f)}</p>
                <dl className="mt-1.5 flex flex-col gap-0.5">
                  {resto.filter(c => !c.soloTabla).map(c => (
                    <div key={c.clave} className="flex justify-between gap-3 text-xs">
                      <dt className="text-gray-500">{c.titulo}</dt>
                      <dd className="text-right text-gray-300">{c.celda(f)}</dd>
                    </div>
                  ))}
                </dl>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default Tabla
