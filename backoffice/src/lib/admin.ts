/**
 * El cliente de `/api/backoffice`.
 *
 * Todo cuelga de una sola ruta con `?r=<recurso>`: `api/` está en el tope de 12
 * funciones que permite Vercel en Hobby, así que un endpoint por sección
 * rompería el deploy. El porqué completo está en `api/backoffice.js`.
 */
import { useCallback, useEffect, useState } from 'react'
import { esSinSesion, mensajeDeError, pedir, postear } from './api'
import type { Persona } from './tipos'

const R = (recurso: string) => `/api/backoffice?r=${recurso}`

export type Asistente = {
  id: string
  origen: string
  nombre: string | null
  email: string
  telefono: string | null
  empresa: string | null
  entrada: string
  dias: string
  /** La credencial. Sólo viaja acá, nunca a la pantalla de puerta. */
  token: string | null
  usadaEn: string | null
  registradoEn: string
  pagoDoble: boolean
  /** No cae en ningún día del evento: no aparece en ninguna puerta. */
  sinDia: boolean
}

/**
 * La misma persona vista por los dos endpoints.
 *
 * `/api/puerta` devuelve `Persona` —lo mínimo para acreditar— y
 * `/api/backoffice?r=asistentes` devuelve `Asistente`, que es la misma fila con
 * el token, la fecha de registro y el cruce de días. La ficha atiende a las dos,
 * así que necesita poder preguntar cuál le tocó.
 */
export const esAsistente = (p: Persona | Asistente): p is Asistente => 'token' in p

export type Orden = {
  id: string
  tier: string
  cantidad: number
  nombre: string
  email: string
  telefono: string | null
  empresa: string | null
  status: 'pending' | 'paid' | 'rejected' | 'expired' | 'refunded'
  detalle: string | null
  subtotal: number
  cargo: number
  total: number
  pagoId: string | null
  mailEnviado: string | null
  creadaEn: string
  venceEn: string
  /** Pendiente y sin vencer: le está sacando una entrada al stock. */
  reservaCupo: boolean
}

export type TotalesVentas = {
  pagadas: number
  entradas: number
  recaudado: number
  recaudadoTexto: string
  pendientes: number
}

export type TotalesCupo = {
  total: number
  /** Pagadas más pendientes sin vencer: lo que ya no se puede vender. */
  tomado: number
  libre: number
  activos: number
}

export type Tier = {
  id: string
  nombre: string
  precio: number
  cargo: number
  total: number
  stockTotal: number
  activo: boolean
  disponible: number
}

export type Cuenta = { clave: string; total: number }

export type Metricas = {
  porDia: {
    id: string
    nombre: string
    esperados: number
    entraron: number
    porHora: Cuenta[]
    porCanal: Cuenta[]
    porPuerta: Cuenta[]
  }[]
  porCanal: Cuenta[]
  total: number
  sinDia: number
  /** Las mismas cuentas que sirven Ventas y Stock — no unas parecidas. */
  ventas: TotalesVentas
  cupo: TotalesCupo
  /** El cruce de los tres días: acá se cuentan PERSONAS, no ingresos. */
  resumen: {
    personas: number
    entraron: number
    noShow: number
    recurrencia: { dias: number; personas: number }[]
    porCanal: { clave: string; esperados: number; entraron: number; tasa: number }[]
    altas: Cuenta[]
  }
}

export type ResumenImport = {
  error?: string
  columnas?: string[]
  dias?: string
  escrito?: boolean
  mapa?: Record<string, string>
  resumen?: {
    filas: number
    registros: number
    confirmados: number
    rechazados: number
    pendientes: number
    sinEmail: number
    repetidos: number
  }
}

export const traerAsistentes = () => pedir<{ personas: Asistente[] }>(R('asistentes'))
export const traerOrdenes = () => pedir<{ ordenes: Orden[]; totales: TotalesVentas }>(R('ordenes'))
export const traerTiers = () => pedir<{ tiers: Tier[]; totales: TotalesCupo }>(R('tiers'))
export const traerMetricas = () => pedir<Metricas>(R('metricas'))

export const editarPersona = (datos: {
  id: string
  origen: string
  nombre: string
  email?: string
  telefono?: string
  empresa?: string
}) => postear<{ ok: true }>(R('persona'), datos)

export const darDeBaja = (id: string, origen: string, deshacer = false) =>
  postear<{ ok: true }>(R('baja'), { id, origen, deshacer })

/**
 * El mail es uno por COMPRA, con una tarjeta por asistente. Desde Asistentes se
 * manda la entrada y el servidor resuelve su orden; desde Ventas se manda la
 * orden directo.
 */
export const reenviarMail = (ref: { orden?: string; entrada?: string }) =>
  postear<{ ok: true }>(R('reenviar'), ref)

export const accionOrden = (id: string, accion: 'reconciliar' | 'liberar' | 'reembolsar') =>
  postear<{ ok: true; status?: string }>(R('orden'), { id, accion })

export const editarTier = (datos: {
  id: string
  stockTotal?: number
  precio?: number
  activo?: boolean
}) => postear<{ ok: true }>(R('tier'), datos)

export const importarCSV = (datos: {
  csv: string
  origen: string
  evento: string
  dias?: string
  seco?: boolean
}) => postear<ResumenImport>(R('importar'), datos)

/**
 * Cargar un recurso, con su error y su recarga.
 *
 * Las cinco secciones hacen exactamente lo mismo —pedir, mostrar mientras
 * carga, mostrar el error, poder reintentar— y escribirlo cinco veces era
 * garantizar que las cinco lo hicieran distinto.
 */
export function useRecurso<T>(cargar: () => Promise<T>, onSinSesion: () => void) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState('')
  // Arranca en true: la primera carga ya está en camino cuando se monta, y
  // ponerlo desde el efecto sería un setState sincrónico que dispara un render
  // de más.
  const [cargando, setCargando] = useState(true)

  // Cadena de promesas y no `async/await`: así ningún `setState` ocurre en el
  // cuerpo del efecto, sino en los callbacks. Es el mismo patrón que usa
  // `useLista.ts` para la lista de la puerta.
  const traer = useCallback(() => cargar()
    .then(r => {
      setDatos(r)
      setError('')
    })
    .catch(err => {
      if (esSinSesion(err)) onSinSesion()
      else setError(mensajeDeError(err))
    })
    .finally(() => setCargando(false)),
  [cargar, onSinSesion])

  useEffect(() => { traer() }, [traer])

  /** Recargar a mano, desde un botón. Acá sí corresponde volver a "cargando". */
  const recargar = useCallback(() => {
    setCargando(true)
    return traer()
  }, [traer])

  return { datos, error, cargando, recargar }
}

/** `2026-08-06T14:32:00Z` → `6 ago 14:32`, en hora de Buenos Aires. */
export function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export function pesos(n: number, centavos = false): string {
  return '$' + n.toLocaleString('es-AR', {
    minimumFractionDigits: centavos ? 2 : 0,
    maximumFractionDigits: 2,
  })
}
