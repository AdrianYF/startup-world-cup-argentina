import { useEffect, useRef, useState } from 'react'
import { CheckoutError, esReintentable, fetchOrden, type Orden } from './checkout'

/**
 * Esperar a que la compra se confirme.
 *
 * La vuelta de Mercado Pago llega a dos lugares —`/gracias` y el modal del
 * landing— y hasta acá cada uno tenía su copia del poll, con sus propias
 * constantes y su propio manejo de errores. Eran la misma pantalla escrita dos
 * veces, y la diferencia entre las dos copias era justamente dónde estaba el bug.
 *
 * Lo que este hook hace y las dos copias no hacían: **distinguir el error que se
 * arregla solo del que no**. Del otro lado hay alguien que ya pagó y está
 * mirando; un 502 o un segundo sin 4G no puede terminar en «no encontramos la
 * compra». Sólo un 404 —la orden no existe— o quedarse sin intentos son
 * definitivos.
 *
 * El estado del pago nunca sale de la URL: `/api/orden` se lo pregunta a Mercado
 * Pago con nuestro access token. Los `?status=` y `?payment_id=` que manda MP se
 * ignoran a propósito, porque esa URL la puede escribir cualquiera.
 */

/** Cada cuánto se vuelve a preguntar mientras el pago no está confirmado. */
const POLL_MS = 2500

/** Cuántos intentos antes de bajar los brazos (~40 s). */
const POLL_MAX = 16

export type EstadoOrdenPolling = {
  orden: Orden | null
  /** Se acabaron los intentos y la orden sigue pendiente. */
  agotado: boolean
  /** No hay nada más que esperar: esa orden no existe. */
  error: boolean
}

export function useOrdenPolling(
  ordenId: string | null,
  onConfirmada?: (orden: Orden) => void,
): EstadoOrdenPolling {
  const [orden, setOrden] = useState<Orden | null>(null)
  const [agotado, setAgotado] = useState(false)
  const [error, setError] = useState(false)

  // En un ref para que cambiar el callback no reinicie el poll: los que lo pasan
  // lo escriben inline, así que su identidad cambia en cada render. El ref se
  // actualiza en un efecto y no en el cuerpo: escribirlo durante el render lo
  // rompe bajo StrictMode, donde el render puede correr y descartarse.
  const avisar = useRef(onConfirmada)
  useEffect(() => { avisar.current = onConfirmada })

  useEffect(() => {
    if (!ordenId) return

    const ac = new AbortController()
    let timer: number | undefined
    let intentos = 0

    const reintentar = () => {
      intentos += 1
      if (intentos >= POLL_MAX) {
        setAgotado(true)
        return
      }
      timer = window.setTimeout(mirar, POLL_MS)
    }

    async function mirar() {
      try {
        const o = await fetchOrden(ordenId!, ac.signal)
        if (ac.signal.aborted) return
        setOrden(o)
        setError(false)
        if (o.status !== 'pending') {
          avisar.current?.(o)
          return
        }
        reintentar()
      } catch (err) {
        if (ac.signal.aborted) return
        // Una orden que no existe no va a aparecer por insistir. Todo lo demás
        // —la API caída, el 4G del celular— se reintenta: es exactamente el caso
        // en que la persona ya pagó y todavía no lo sabe.
        if (err instanceof CheckoutError && err.status === 404) {
          setError(true)
          return
        }
        if (!esReintentable(err)) {
          setError(true)
          return
        }
        reintentar()
      }
    }

    mirar()
    return () => {
      ac.abort()
      if (timer) clearTimeout(timer)
    }
  }, [ordenId])

  return { orden, agotado, error }
}
