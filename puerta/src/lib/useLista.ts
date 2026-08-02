/**
 * El estado de la puerta: la lista del día, los ingresos y la cola.
 *
 * Vive en un hook y no en la pantalla porque es lo que tiene reglas de verdad
 * —cachés, deltas, reintentos— y lo que hay que poder leer sin atravesar JSX.
 * Los componentes de `componentes/` sólo pintan lo que sale de acá.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { acreditar, anular, vaciarCola } from './acreditar'
import { esSinSesion, mensajeDeError, traerDelta, traerLista } from './api'
import { cache, cola, diaDeHoy, quien } from './almacen'
import { porPersona } from './buscar'
import type { Checkin, Lista, Persona } from './tipos'

/** Cada cuánto se pregunta por lo que anotaron las otras puertas. */
const POLL_MS = 10_000
/** Cuánto queda a mano el "Deshacer" antes de irse solo. */
const DESHACER_MS = 7_000

export type Ultimo = { checkin: Checkin; persona: Persona }

export function useLista(onSinSesion: () => void) {
  // '' = "el día que el servidor considere hoy". Sólo pasa en el primerísimo
  // arranque, antes de tener los días guardados; después sale del almacén.
  const [diaId, setDiaId] = useState<string>(() => diaDeHoy() || '')
  // Arranca con lo cacheado: sin señal, la puerta ya tiene con qué trabajar en
  // el primer render y la red después lo reemplaza.
  const [lista, setLista] = useState<Lista | null>(() => (diaId ? cache.leer(diaId) : null))
  const [error, setError] = useState('')
  const [enCola, setEnCola] = useState(() => cola.cuantos())
  const [sinConexion, setSinConexion] = useState(() => !navigator.onLine)
  const [ultimo, setUltimo] = useState<Ultimo | null>(null)

  // El cursor va en un ref: lo lee el intervalo del poll, y como estado obligaría
  // a recrear el intervalo en cada sincronización.
  const cursor = useRef('')

  const manejarError = useCallback((err: unknown) => {
    if (esSinSesion(err)) onSinSesion()
    else setError(mensajeDeError(err))
  }, [onSinSesion])

  /* La lista del día, de la red. Lo cacheado ya se pintó. */
  useEffect(() => {
    let vivo = true

    traerLista(diaId)
      .then(fresca => {
        if (!vivo) return
        setLista(fresca)
        cursor.current = fresca.cursor
        setError('')
        // Sólo en el primer arranque, cuando todavía no sabíamos qué día era hoy.
        if (!diaId) setDiaId(fresca.dia.id)
      })
      .catch(err => {
        if (!vivo) return
        // Con caché el error no vale la pena mostrarlo: se sigue trabajando.
        if (!cache.leer(diaId)) manejarError(err)
      })

    return () => { vivo = false }
  }, [diaId, manejarError])

  /* Delta cada 10s: así dos puertas se ven entre sí. */
  const diaVigente = lista?.dia.id
  useEffect(() => {
    if (!diaVigente) return

    const tick = async () => {
      if (document.hidden || !navigator.onLine) return
      try {
        // Sin cursor nunca hubo una lectura buena (se abrió sin señal): en vez de
        // pedir un delta contra la nada, se baja la lista entera.
        if (!cursor.current) {
          const fresca = await traerLista(diaVigente)
          cursor.current = fresca.cursor
          setLista(fresca)
          return
        }
        const d = await traerDelta(diaVigente, cursor.current)
        cursor.current = d.cursor
        if (d.checkins.length) setLista(l => (l ? fusionar(l, d.checkins) : l))
      } catch {
        /* el próximo tick reintenta */
      }
    }

    const id = setInterval(tick, POLL_MS)
    return () => clearInterval(id)
  }, [diaVigente])

  /* La cola, cada vez que vuelve la conexión. */
  useEffect(() => {
    const sincronizar = () => {
      setSinConexion(!navigator.onLine)
      if (navigator.onLine) vaciarCola().then(setEnCola)
    }
    sincronizar()
    window.addEventListener('online', sincronizar)
    window.addEventListener('offline', sincronizar)
    return () => {
      window.removeEventListener('online', sincronizar)
      window.removeEventListener('offline', sincronizar)
    }
  }, [])

  /* El "Deshacer" se va solo. */
  useEffect(() => {
    if (!ultimo) return
    const id = setTimeout(() => setUltimo(null), DESHACER_MS)
    return () => clearTimeout(id)
  }, [ultimo])

  const ingresos = useMemo(() => porPersona(lista?.checkins || []), [lista])

  /** Cambiar de día no espera a la red: se pinta lo cacheado y se sincroniza atrás. */
  const cambiarDia = useCallback((id: string) => {
    if (id === diaVigente) return
    setDiaId(id)
    setLista(cache.leer(id))
    cursor.current = ''
  }, [diaVigente])

  const anotar = useCallback(async (persona: Persona) => {
    if (!diaVigente) return
    try {
      const checkin = await acreditar({ dia: diaVigente, persona, por: quien.leer() })
      setLista(l => (l ? fusionar(l, [checkin]) : l))
      setUltimo({ checkin, persona })
      setEnCola(cola.cuantos())
    } catch (err) {
      manejarError(err)
    }
  }, [diaVigente, manejarError])

  /** Lo que ya resolvió el escáner contra el servidor: sólo hay que reflejarlo. */
  const anotarEscaneado = useCallback((checkin: Checkin, persona: Persona) => {
    setLista(l => (l ? fusionar(l, [checkin]) : l))
    setUltimo({ checkin, persona })
  }, [])

  const deshacer = useCallback(async () => {
    if (!ultimo) return
    // Se pinta anulado antes de que salga: si la red falla, la cola lo manda igual.
    setLista(l => (l ? fusionar(l, [{ ...ultimo.checkin, anuladoEn: new Date().toISOString() }]) : l))
    setUltimo(null)
    try {
      await anular(ultimo.checkin.id)
      setEnCola(cola.cuantos())
    } catch (err) {
      manejarError(err)
    }
  }, [ultimo, manejarError])

  return {
    lista, ingresos, error, sinConexion, enCola, ultimo,
    cambiarDia, anotar, anotarEscaneado, deshacer,
  }
}

/**
 * Mete ingresos nuevos en la lista y la deja cacheada.
 *
 * Por `id` y no agregando al final: el delta del poll trae de vuelta lo que esta
 * misma pantalla acaba de anotar, y las anulaciones llegan como una versión
 * nueva de una fila que ya está.
 */
function fusionar(lista: Lista, nuevos: Checkin[]): Lista {
  const porId = new Map(lista.checkins.map(c => [c.id, c]))
  for (const c of nuevos) porId.set(c.id, c)
  const fusionada = { ...lista, checkins: [...porId.values()] }
  cache.guardar(fusionada)
  return fusionada
}
