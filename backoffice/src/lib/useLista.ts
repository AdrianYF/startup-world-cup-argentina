/**
 * El estado de la puerta: la lista del día, los ingresos y la cola.
 *
 * Vive en un hook y no en la pantalla porque es lo que tiene reglas de verdad
 * —cachés, deltas, reintentos— y lo que hay que poder leer sin atravesar JSX.
 * Los componentes de `componentes/` sólo pintan lo que sale de acá.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { acreditar, agregar, anular, vaciarCola, type EstadoCola } from './acreditar'
import { esSinSesion, mensajeDeError, traerDelta, traerLista } from './api'
import { cache, cola, descartados, diaDeHoy, quien } from './almacen'
import { porPersona } from './buscar'
import type { Checkin, Lista, Persona } from './tipos'

/** Cada cuánto se pregunta por lo que anotaron las otras puertas. */
const POLL_MS = 10_000
/**
 * Cada cuánto se baja la lista entera de nuevo.
 *
 * El delta alcanza para los ingresos y para las altas, pero no ve las
 * correcciones —un nombre arreglado desde el backoffice, una entrada dada de
 * baja—, porque esas no mueven `registrado_en`. Cinco minutos es lo que tarda
 * en converger algo que se editó del otro lado.
 */
const SYNC_COMPLETO_MS = 300_000
/**
 * Cada cuánto se reintenta la cola por las suyas.
 *
 * El evento `online` no alcanza: con el wifi del venue devolviendo 500s el
 * dispositivo nunca queda "offline", así que la cola se quedaba quieta hasta
 * que alguien recargaba la página.
 */
const REINTENTO_MS = 60_000
/** Cuánto queda a mano el "Deshacer" antes de irse solo. */
const DESHACER_MS = 7_000

export type Ultimo = { checkin: Checkin; persona: Persona }

const leerCola = (): EstadoCola => ({
  enCola: cola.cuantos(),
  descartados: descartados.cuantos(),
})

export function useLista(onSinSesion: () => void) {
  // '' = "el día que el servidor considere hoy". Sólo pasa en el primerísimo
  // arranque, antes de tener los días guardados; después sale del almacén.
  const [diaId, setDiaId] = useState<string>(() => diaDeHoy() || '')
  // Arranca con lo cacheado: sin señal, la puerta ya tiene con qué trabajar en
  // el primer render y la red después lo reemplaza.
  const [lista, setLista] = useState<Lista | null>(() => (diaId ? cache.leer(diaId) : null))
  const [error, setError] = useState('')
  const [estadoCola, setEstadoCola] = useState<EstadoCola>(leerCola)
  const [sinConexion, setSinConexion] = useState(() => !navigator.onLine)
  const [ultimo, setUltimo] = useState<Ultimo | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  // El cursor va en un ref: lo lee el intervalo del poll, y como estado obligaría
  // a recrear el intervalo en cada sincronización.
  const cursor = useRef('')

  const manejarError = useCallback((err: unknown) => {
    if (esSinSesion(err)) onSinSesion()
    else setError(mensajeDeError(err))
  }, [onSinSesion])

  /**
   * Baja la lista entera de un día.
   *
   * `avisar` en false es para los refrescos de fondo: que el sync de cada cinco
   * minutos tire un cartel rojo porque justo no había señal sería peor que no
   * refrescar.
   */
  const bajarLista = useCallback(async (id: string, avisar = true) => {
    setSincronizando(true)
    try {
      const fresca = await traerLista(id)
      setLista(fresca)
      cursor.current = fresca.cursor
      setError('')
      // Sólo en el primer arranque, cuando todavía no sabíamos qué día era hoy.
      if (!id) setDiaId(fresca.dia.id)
    } catch (err) {
      // Con caché el error no vale la pena mostrarlo: se sigue trabajando.
      if (avisar && !cache.leer(id)) manejarError(err)
    } finally {
      setSincronizando(false)
    }
  }, [manejarError])

  /* La lista del día, de la red. Lo cacheado ya se pintó. */
  useEffect(() => {
    let vivo = true
    traerLista(diaId)
      .then(fresca => {
        if (!vivo) return
        setLista(fresca)
        cursor.current = fresca.cursor
        setError('')
        if (!diaId) setDiaId(fresca.dia.id)
      })
      .catch(err => {
        if (!vivo) return
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
        if (d.checkins.length || d.personas?.length) {
          setLista(l => (l ? fusionar(l, d.checkins, d.personas) : l))
        }
      } catch {
        /* el próximo tick reintenta */
      }
    }

    const id = setInterval(tick, POLL_MS)
    return () => clearInterval(id)
  }, [diaVigente])

  /* Y cada tanto la lista entera, para ver lo que el delta no puede ver. */
  useEffect(() => {
    if (!diaVigente) return
    const id = setInterval(() => {
      if (document.hidden || !navigator.onLine) return
      bajarLista(diaVigente, false)
    }, SYNC_COMPLETO_MS)
    return () => clearInterval(id)
  }, [diaVigente, bajarLista])

  /* La cola: al volver la conexión, y cada minuto por las dudas. */
  useEffect(() => {
    const sincronizar = () => {
      setSinConexion(!navigator.onLine)
      if (navigator.onLine) vaciarCola().then(setEstadoCola)
    }
    sincronizar()
    window.addEventListener('online', sincronizar)
    window.addEventListener('offline', sincronizar)
    const id = setInterval(sincronizar, REINTENTO_MS)
    return () => {
      window.removeEventListener('online', sincronizar)
      window.removeEventListener('offline', sincronizar)
      clearInterval(id)
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

  /**
   * Recargar a mano.
   *
   * Es la salida cuando algo se ve raro y no se quiere esperar al sync. Hasta
   * ahora no existía: `cambiarDia` corta si el día es el mismo, así que la
   * única forma de volver a bajar la lista era recargar la página entera.
   */
  const recargar = useCallback(() => {
    if (diaVigente) bajarLista(diaVigente)
    vaciarCola().then(setEstadoCola)
  }, [diaVigente, bajarLista])

  const anotar = useCallback(async (persona: Persona, forzar = false) => {
    if (!diaVigente) return
    try {
      const checkin = await acreditar({ dia: diaVigente, persona, por: quien.leer(), forzar })
      setLista(l => (l ? fusionar(l, [checkin]) : l))
      setUltimo({ checkin, persona })
      setEstadoCola(leerCola())
      confirmar()
    } catch (err) {
      manejarError(err)
    }
  }, [diaVigente, manejarError])

  /**
   * Alta en la puerta: se agrega a la lista Y se acredita, en un solo paso.
   *
   * Van juntos a propósito. A nadie se lo da de alta para dejarlo afuera: si
   * está parado adelante y no figuraba, lo que sigue es que entre.
   *
   * El error se propaga en vez de tragarse: del otro lado hay un formulario
   * abierto que tiene que poder mostrarlo sin perder lo que ya se tipeó.
   */
  const agregarYAcreditar = useCallback(async (datos: {
    nombre: string
    email?: string
    telefono?: string
    empresa?: string
    motivo?: string
  }) => {
    if (!lista) return
    const persona = await agregar({
      dia: lista.dia.id,
      diasLabel: `${lista.dia.label} ${Number(lista.dia.fecha.slice(-2))}`,
      ...datos,
    })
    setLista(l => (l ? fusionar(l, [], [persona]) : l))
    await anotar(persona)
  }, [lista, anotar])

  /**
   * Lo que ya resolvió el escáner contra el servidor.
   *
   * La persona se fusiona también: si compró por la web hace un rato, puede no
   * estar en la lista que este dispositivo tiene bajada, y sin esto se
   * acreditaba a alguien que no aparecía en ninguna fila.
   */
  const anotarEscaneado = useCallback((checkin: Checkin, persona: Persona) => {
    setLista(l => (l ? fusionar(l, [checkin], [persona]) : l))
    setUltimo({ checkin, persona })
    setEstadoCola(leerCola())
    confirmar()
  }, [])

  /**
   * Anula un ingreso, sea el último o uno de hace dos horas.
   *
   * El "Deshacer" de la barra dura siete segundos y cubre el error del momento.
   * Esto cubre el otro caso, que también pasa: alguien se da cuenta más tarde, o
   * lo anotó la otra puerta. Sin esto había que entrar a Supabase a hacer un
   * update con la fila esperando.
   */
  const anularIngreso = useCallback(async (checkin: Checkin, persona?: Persona) => {
    // Se pinta anulado antes de que salga: si la red falla, la cola lo manda igual.
    setLista(l => (l ? fusionar(l, [{ ...checkin, anuladoEn: new Date().toISOString() }]) : l))
    setUltimo(u => (u?.checkin.id === checkin.id ? null : u))
    try {
      await anular(checkin.id, persona?.nombre || undefined)
      setEstadoCola(leerCola())
    } catch (err) {
      manejarError(err)
    }
  }, [manejarError])

  const deshacer = useCallback(() => {
    if (ultimo) anularIngreso(ultimo.checkin, ultimo.persona)
  }, [ultimo, anularIngreso])

  return {
    lista, ingresos, error, sinConexion, estadoCola, ultimo, sincronizando,
    cambiarDia, recargar, anotar, anotarEscaneado, deshacer, anularIngreso,
    agregarYAcreditar, setEstadoCola,
  }
}

/**
 * El "entró" que se siente sin mirar.
 *
 * En la puerta se acredita con el celular a la altura de la cintura y la vista
 * en la persona que sigue. Una vibración corta confirma sin obligar a mirar la
 * pantalla. Donde no hay motor —los iPhone no exponen `vibrate`— no pasa nada:
 * es un extra, no el único feedback.
 */
function confirmar() {
  try {
    navigator.vibrate?.(35)
  } catch {
    /* es un lujo, no una función */
  }
}

/**
 * Mete ingresos y personas nuevas en la lista y la deja cacheada.
 *
 * Todo por `id` y no agregando al final: el delta del poll trae de vuelta lo que
 * esta misma pantalla acaba de anotar, las anulaciones llegan como una versión
 * nueva de una fila que ya está, y un alta reintentada desde la cola tiene que
 * reemplazar a la optimista en vez de duplicarla.
 */
function fusionar(lista: Lista, nuevos: Checkin[], personas: Persona[] = []): Lista {
  const fusionada = { ...lista }

  if (nuevos.length) {
    const porId = new Map(lista.checkins.map(c => [c.id, c]))
    for (const c of nuevos) porId.set(c.id, c)
    fusionada.checkins = [...porId.values()]
  }

  if (personas.length) {
    const porId = new Map(lista.personas.map(p => [p.id, p]))
    for (const p of personas) porId.set(p.id, p)
    fusionada.personas = [...porId.values()]
  }

  cache.guardar(fusionada)
  return fusionada
}
