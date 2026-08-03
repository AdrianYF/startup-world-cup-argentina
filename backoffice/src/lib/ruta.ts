/**
 * El router del backoffice. Treinta líneas, no una dependencia.
 *
 * `react-router-dom` está en el proyecto y lo usa el sitio, pero el bundle de
 * esta app es un valor explícito: se abre en la fila de entrada, con el 4G del
 * venue y una mano ocupada. Bajar un router entero para seis secciones que ni
 * siquiera tienen parámetros no se paga.
 *
 * La sección viaja en el path (`/backoffice/ventas`) y no en el hash porque es
 * lo que deja compartir un link y lo que hace que el back del teléfono vuelva a
 * la puerta en vez de salir de la app.
 */
import { useCallback, useEffect, useState } from 'react'

export const BASE = '/backoffice'

/**
 * La puerta es la raíz.
 *
 * No es «la sección que más se usa»: es para lo que existe la app. Quien abre
 * `/backoffice/` está por acreditar a alguien que tiene enfrente, y lo primero
 * que ve tiene que ser el buscador — no un menú.
 */
export const PUERTA = ''

/**
 * Rutas viejas que ya no existen.
 *
 * Los links quedaron en chats de WhatsApp del staff y en pestañas abiertas
 * desde ayer: mapearlas es más barato que explicar por qué dejaron de andar.
 *
 * `asistentes` era el padrón y `personas` fue las dos cosas a la vez; las dos
 * caen en el padrón, que es lo que quien las guardó estaba mirando.
 */
const HEREDADAS: Record<string, string> = {
  puerta: PUERTA,
  asistentes: 'padron',
  personas: 'padron',
}

function leerRuta(): string {
  const resto = location.pathname.slice(BASE.length).replace(/^\/+|\/+$/g, '')
  return resto in HEREDADAS ? HEREDADAS[resto] : resto
}

export function useRuta(): [string, (id: string) => void] {
  const [ruta, setRuta] = useState(leerRuta)

  useEffect(() => {
    const alVolver = () => setRuta(leerRuta())
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  const ir = useCallback((id: string) => {
    history.pushState(null, '', id ? `${BASE}/${id}` : `${BASE}/`)
    setRuta(id)
    // Cambiar de sección arranca arriba. Sin esto se hereda el scroll de la
    // lista de la puerta, que es larga.
    window.scrollTo(0, 0)
  }, [])

  return [ruta, ir]
}
