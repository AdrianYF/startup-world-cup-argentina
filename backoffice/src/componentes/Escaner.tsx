import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { acreditarPorToken } from '../lib/acreditar'
import { PuertaError, mensajeDeError } from '../lib/api'
import type { Checkin, Persona } from '../lib/tipos'
import { IconoAlerta, IconoCamara, IconoCruz, IconoQR, IconoTick } from '../ui/Iconos'

/**
 * La cámara, para el atajo del QR.
 *
 * Es un atajo y no el camino principal: la mayoría compró por Startup Grind o se
 * anotó en Luma y **no tiene QR nuestro**. Con esto se acredita rápido a quien
 * compró por la web; al resto se lo busca por apellido.
 *
 * `jsqr` y no `BarcodeDetector`: el nativo no está en todos los teléfonos y
 * mantener dos caminos significa probar dos caminos. Con uno solo, lo que anda
 * en un iPhone anda en un Android.
 *
 * El QR lleva la URL de la entrada (`/entrada/<token>`): de lo escaneado se saca
 * el token y se lo manda al servidor, así la puerta nunca tiene en la mano la
 * credencial de nadie más que la de quien está parado adelante.
 */

const TOKEN_EN_URL = /\/entrada\/([A-Za-z0-9_-]{20,64})/
const MS_ENTRE_LECTURAS = 120
/** Tras un QR que no sirve, un respiro: si no, el mismo código dispara en loop. */
const ESPERA_TRAS_ERROR_MS = 1500
/**
 * Cuánto se ignora un token ya escaneado.
 *
 * Es lo que hace posible el modo continuo. La cámara lee ~8 veces por segundo y
 * el QR se queda unos segundos delante mientras la persona guarda el teléfono:
 * sin esto, una sola entrada generaría veinte ingresos. El servidor no puede
 * atajarlo solo, porque cada intento llega con un uuid distinto.
 */
const MS_MISMO_QR = 6000
/** Cuántos escaneos se muestran abajo. Más no entran sin tapar la cámara. */
const RECIENTES = 4

/** Un pedazo de lo leído, para poder ver de qué QR se trata sin llenar la pantalla. */
function recortar(texto: string, max = 28): string {
  const limpio = texto.replace(/^https?:\/\//, '').trim()
  return limpio.length > max ? limpio.slice(0, max) + '…' : limpio
}

type Props = {
  dia: string
  onCerrar: () => void
  onAcreditado: (checkin: Checkin, persona: Persona) => void
}

/** Una entrada válida, pero de otro día. La decisión es del staff. */
type Conflicto = { persona: Persona; token: string }

/** Lo que se apila abajo: qué pasó con cada escaneo, sin tener que recordarlo. */
type Reciente = { id: number; nombre: string; ok: boolean; hora: string }

function Escaner({ dia, onCerrar, onAcreditado }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  // En un ref y no en el estado: lo lee el loop de la cámara, que no se vuelve a
  // crear en cada render.
  const ocupado = useRef(false)
  // Token → cuándo se escaneó. Es el antirrebote del modo continuo.
  const vistos = useRef(new Map<string, number>())
  const [estado, setEstado] = useState<'pidiendo' | 'buscando' | 'enviando'>('pidiendo')
  const [aviso, setAviso] = useState('')
  const [conflicto, setConflicto] = useState<Conflicto | null>(null)
  const [recientes, setRecientes] = useState<Reciente[]>([])
  /** El destello de pantalla completa. Se apaga solo cuando termina la animación. */
  const [flash, setFlash] = useState<'ok' | 'mal' | null>(null)

  const hora = () =>
    new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  /**
   * Deja constancia arriba de la lista y pega el destello.
   *
   * Va por ref igual que `avisar`: la usa el loop de la cámara, y si entrara en
   * las dependencias del efecto la cámara se apagaría y volvería a abrir en cada
   * repintado.
   */
  const anotar = useRef<(nombre: string, ok: boolean) => void>(() => {})
  useEffect(() => {
    anotar.current = (nombre: string, ok: boolean) => {
      setFlash(ok ? 'ok' : 'mal')
      setRecientes(r =>
        [{ id: Date.now() + Math.random(), nombre, ok, hora: hora() }, ...r].slice(0, RECIENTES))
    }
  })

  // El callback llega como arrow inline desde la pantalla, o sea que cambia en
  // cada render. En las dependencias del efecto apagaría y volvería a abrir la
  // cámara cada vez que se repinta algo.
  const avisar = useRef(onAcreditado)
  useEffect(() => { avisar.current = onAcreditado }, [onAcreditado])

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer = 0
    let vivo = true

    async function arrancar() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!vivo) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        const el = video.current
        if (!el) return
        el.srcObject = stream
        // `playsInline` en el JSX no alcanza en iOS: sin el play() explícito el
        // video queda en negro.
        await el.play()
        setEstado('buscando')
        timer = window.setInterval(mirar, MS_ENTRE_LECTURAS)
      } catch {
        if (vivo) setAviso('No pudimos abrir la cámara. Buscá por apellido.')
      }
    }

    function mirar() {
      const el = video.current
      const cv = canvas.current
      if (!el || !cv || ocupado.current || el.readyState < 2) return

      const ctx = cv.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      cv.width = el.videoWidth
      cv.height = el.videoHeight
      if (!cv.width || !cv.height) return

      ctx.drawImage(el, 0, 0, cv.width, cv.height)
      const frame = ctx.getImageData(0, 0, cv.width, cv.height)
      const leido = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })
      if (leido?.data) resolver(leido.data)
    }

    async function resolver(texto: string) {
      const token = texto.match(TOKEN_EN_URL)?.[1]

      // El mismo QR, todavía delante de la cámara, no se vuelve a acreditar.
      // Sin esto el modo continuo genera un ingreso por cada lectura.
      if (token) {
        const antes = vistos.current.get(token)
        if (antes && Date.now() - antes < MS_MISMO_QR) return
      }

      if (!token) {
        // No es un error de la persona: Startup Grind emite su propio QR, y no es
        // el nuestro. Se avisa y se sigue escaneando.
        //
        // Se muestra un pedazo de lo leído: sin eso, este caso y el de "el token
        // no está en la base" daban el MISMO texto y no había forma de saber
        // cuál de los dos estabas mirando.
        setAviso(`Ese QR no es una entrada nuestra (${recortar(texto)}). Buscá por apellido.`)
        anotar.current('QR ajeno', false)
        ocupado.current = true
        window.setTimeout(() => { ocupado.current = false }, ESPERA_TRAS_ERROR_MS)
        return
      }

      ocupado.current = true
      vistos.current.set(token, Date.now())
      setEstado('enviando')
      setAviso('')
      try {
        const r = await acreditarPorToken({ dia, token })
        avisar.current(r.checkin, r.persona)
        anotar.current(r.persona.nombre || r.persona.email || 'Acreditada', true)
        // NO se cierra: la cámara sigue abierta para el que viene atrás. Cerrar
        // entre persona y persona era lo que frenaba la fila.
        setEstado('buscando')
        ocupado.current = false
      } catch (err) {
        const codigo = err instanceof PuertaError ? err.codigo : ''

        // La entrada existe y está paga, pero es de otro día. No se acredita
        // sola y tampoco se rechaza: se muestra quién es y decide el staff, que
        // es el único que sabe si esto es una cortesía o un error.
        if (codigo === 'dia_no_habilitado') {
          const persona = (err as PuertaError).datos.persona as Persona | undefined
          if (persona) {
            setConflicto({ persona, token })
            setEstado('buscando')
            return
          }
        }

        // El QR SÍ era nuestro y el token tiene la forma correcta, pero la base
        // no lo conoce. Pasa siempre que la app apunta a un Supabase distinto
        // del que emitió la entrada — típicamente probando en local contra
        // `npm run dev:local` con un QR emitido en producción.
        setAviso(
          codigo === 'entrada_inexistente'
            ? 'Entrada válida, pero no está en esta base. ¿La app apunta al Supabase correcto?'
            : mensajeDeError(err),
        )
        anotar.current(codigo === 'entrada_inexistente' ? 'No está en la base' : 'No se pudo', false)
        setEstado('buscando')
        // Se olvida el token: si falló por red, el próximo intento tiene que poder.
        vistos.current.delete(token)
        window.setTimeout(() => { ocupado.current = false }, ESPERA_TRAS_ERROR_MS)
      }
    }

    arrancar()
    return () => {
      vivo = false
      clearInterval(timer)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [dia])

  /** Acreditar una entrada de otro día, porque alguien decidió que sí. */
  async function forzar() {
    if (!conflicto) return
    setEstado('enviando')
    try {
      const r = await acreditarPorToken({ dia, token: conflicto.token, forzar: true })
      avisar.current(r.checkin, r.persona)
    } catch (err) {
      setAviso(mensajeDeError(err))
      setEstado('buscando')
      setConflicto(null)
      ocupado.current = false
    }
  }

  /** Volver a escanear sin acreditar. */
  function descartarConflicto() {
    setConflicto(null)
    setEstado('buscando')
    // El respiro evita que el mismo QR, todavía delante de la cámara, vuelva a
    // disparar el cartel apenas se cierra.
    window.setTimeout(() => { ocupado.current = false }, ESPERA_TRAS_ERROR_MS)
  }

  return (
    <div className="fixed inset-0 z-40 bg-black" role="dialog" aria-modal="true">
      <video ref={video} playsInline muted className="h-full w-full object-cover" />
      <canvas ref={canvas} className="hidden" />

      {/* El destello ocupa la pantalla entera: en la puerta se mira de reojo y
          con sol, y un renglón de texto no se ve. Verde entró, coral no. */}
      {flash && (
        <div
          key={flash + recientes[0]?.id}
          onAnimationEnd={() => setFlash(null)}
          className={`swc-flash pointer-events-none absolute inset-0 z-20 ${
            flash === 'ok' ? 'bg-swc-ok' : 'bg-swc-coral'
          }`}
        />
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {/* El cuadro sigue al ancho de la pantalla en vez de ser 224px fijos.
            Apuntar es más fácil cuanto más grande es el blanco, y el QR de una
            entrada impresa o en la pantalla de otro celular entra bastante más
            chico de lo que uno espera. El tope evita que en tablet se coma todo. */}
        <div
          className="swc-ventana relative rounded-2xl border-2 border-white/70"
          style={{ width: 'min(78vw, 78vh, 420px)', aspectRatio: '1' }}
        >
          <IconoQR
            tam={44}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20"
          />
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm font-bold text-white drop-shadow">
          {estado === 'pidiendo' && <><IconoCamara tam={18} /> Abriendo la cámara…</>}
          {estado === 'buscando' && <><IconoQR tam={18} /> Apuntá al QR de la entrada</>}
          {estado === 'enviando' && <><IconoTick tam={18} animar /> Acreditando…</>}
        </p>
        {aviso && (
          <p className="mx-8 mt-3 flex items-start gap-2 rounded-xl bg-black/70 px-4 py-2 text-center text-sm font-bold text-swc-warn">
            <IconoAlerta tam={16} className="mt-0.5" />
            <span>{aviso}</span>
          </p>
        )}
      </div>

      {/* Los últimos escaneados. Sin esto, en modo continuo no queda constancia
          de qué pasó con el que acaba de irse: pasa el destello y listo. */}
      {!conflicto && recientes.length > 0 && (
        <ul className="pointer-events-none absolute inset-x-0 bottom-24 z-10 mx-auto flex max-w-md flex-col gap-1.5 px-5">
          {recientes.map(r => (
            <li
              key={r.id}
              className={`swc-entra flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold backdrop-blur ${
                r.ok ? 'bg-swc-ok/20 text-swc-ok' : 'bg-swc-coral/20 text-swc-coral'
              }`}
            >
              {r.ok ? <IconoTick tam={16} animar /> : <IconoCruz tam={16} />}
              <span className="truncate">{r.nombre}</span>
              <span className="ml-auto shrink-0 text-xs font-normal tabular-nums opacity-70">
                {r.hora}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Entrada válida, pero de otro día. Se muestra quién es antes de decidir:
          rechazarla sola dejaría afuera a una cortesía legítima, y acreditarla
          sola es lo que hacía hasta ahora sin que nadie se enterara. */}
      {conflicto && (
        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-swc-warn/40 bg-swc-surface px-5 pt-5 pb-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-swc-warn">
            Esa entrada no es de este día
          </p>
          <h2 className="mt-1.5 text-lg font-black text-swc-light">
            {conflicto.persona.nombre || conflicto.persona.email}
          </h2>
          <p className="mt-0.5 text-sm text-swc-muted">
            {conflicto.persona.entrada} · habilita {conflicto.persona.dias}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              onClick={descartarConflicto}
              className="flex-1 rounded-full border border-white/20 px-5 py-3.5 text-sm font-black text-gray-300 active:scale-[0.98]"
            >
              No acreditar
            </button>
            <button
              onClick={forzar}
              disabled={estado === 'enviando'}
              className="flex-1 rounded-full bg-swc-warn px-5 py-3.5 text-sm font-black text-swc-bg disabled:opacity-40 active:scale-[0.98]"
            >
              {estado === 'enviando' ? 'Acreditando…' : 'Acreditar igual'}
            </button>
          </div>
        </div>
      )}

      {!conflicto && (
        <button
          onClick={onCerrar}
          className="absolute inset-x-0 bottom-8 mx-auto w-40 rounded-full bg-white/15 px-6 py-3 text-sm font-black text-white backdrop-blur"
        >
          Cerrar
        </button>
      )}
    </div>
  )
}

export default Escaner
