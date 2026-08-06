import { useEffect, useState } from 'react'

/**
 * En qué momento del evento estamos, en hora de Buenos Aires.
 *
 * La hora tiene que salir de Buenos Aires y NO del reloj de quien mira: la
 * agenda dice "16:00" y eso significa las 16 en el Konex, para todo el mundo.
 * Con la hora local, alguien abriendo desde España a las 21 vería marcado un
 * bloque que en el evento todavía no empezó — y el caso no es raro, que la
 * mitad del panel de inversores esté afuera del país es medio el punto.
 */
const ZONA = 'America/Argentina/Buenos_Aires'

const RELOJ = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export type Momento = {
  /** 'YYYY-MM-DD', que es como vienen las fechas de `agenda.json`. */
  fecha: string
  /** Minutos desde la medianoche. 16:30 → 990. */
  minutos: number
}

/** El ahora de Buenos Aires, en las mismas unidades que usa la agenda. */
export function momentoDe(d: Date): Momento {
  // `formatToParts` y no parsear el string: el orden y los separadores de
  // `format()` dependen del locale, y acá sólo interesan los números.
  const p = Object.fromEntries(RELOJ.formatToParts(d).map(x => [x.type, x.value]))
  return {
    fecha: `${p.year}-${p.month}-${p.day}`,
    minutos: Number(p.hour) * 60 + Number(p.minute),
  }
}

/**
 * `"16:00 - 20:00"` → `{ desde: 960, hasta: 1200 }`.
 *
 * Devuelve `null` si el texto no tiene esa forma. Es texto de contenido, lo
 * edita gente a mano, y un bloque con la hora mal escrita tiene que quedar sin
 * marcar — no romper la agenda entera.
 */
export function rangoDeHora(hora: string): { desde: number; hasta: number } | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})\s*$/.exec(hora || '')
  if (!m) return null
  const desde = Number(m[1]) * 60 + Number(m[2])
  const hasta = Number(m[3]) * 60 + Number(m[4])
  // Un bloque que "termina" antes de empezar es un error de carga, no un
  // bloque que cruza la medianoche: la agenda termina 22:00 el último día.
  return hasta < desde ? null : { desde, hasta }
}

export type EstadoBloque = 'pasado' | 'ahora' | 'sigue' | 'futuro'

/**
 * En qué estado está un bloque.
 *
 * `sigue` no se decide acá sino afuera, porque depende de cuál es el PRÓXIMO
 * entre todos: mirando un bloque solo no se puede saber si es el que viene o
 * uno de la tarde.
 */
export function estadoDeBloque(fecha: string, hora: string, ahora: Momento): EstadoBloque {
  const r = rangoDeHora(hora)
  if (!r) return 'futuro'
  if (fecha < ahora.fecha) return 'pasado'
  if (fecha > ahora.fecha) return 'futuro'
  if (ahora.minutos >= r.hasta) return 'pasado'
  if (ahora.minutos >= r.desde) return 'ahora'
  return 'futuro'
}

/**
 * El ahora, refrescado solo.
 *
 * Cada 30 segundos: los bloques duran media hora, así que un minuto de retraso
 * en mover la marca no se nota, y despertar al componente cada segundo durante
 * tres días para cambiar algo que cambia doce veces por jornada es puro gasto.
 *
 * Arranca en `null` y se completa después del primer render, a propósito: el
 * HTML del servidor no puede conocer la hora del visitante, y pintar una marca
 * distinta en el cliente sería un mismatch de hidratación.
 */
export function useMomento(): Momento | null {
  const [ahora, setAhora] = useState<Momento | null>(null)

  useEffect(() => {
    const tic = () => setAhora(momentoDe(new Date()))
    tic()
    const id = setInterval(tic, 30_000)
    // Volver de otra pestaña después de un rato tiene que encontrar la marca
    // donde va, sin esperar hasta 30 segundos.
    const alVolver = () => document.visibilityState === 'visible' && tic()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  return ahora
}
