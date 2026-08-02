import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { acreditarPorToken } from '../lib/acreditar'
import { mensajeDeError } from '../lib/api'
import type { Checkin, Persona } from '../lib/tipos'

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

type Props = {
  dia: string
  onCerrar: () => void
  onAcreditado: (checkin: Checkin, persona: Persona) => void
}

function Escaner({ dia, onCerrar, onAcreditado }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  // En un ref y no en el estado: lo lee el loop de la cámara, que no se vuelve a
  // crear en cada render.
  const ocupado = useRef(false)
  const [estado, setEstado] = useState<'pidiendo' | 'buscando' | 'enviando'>('pidiendo')
  const [aviso, setAviso] = useState('')

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
      if (!token) {
        // No es un error de la persona: Startup Grind emite su propio QR, y no es
        // el nuestro. Se avisa y se sigue escaneando.
        setAviso('Ese QR no es de acá — buscalo por apellido.')
        return
      }

      ocupado.current = true
      setEstado('enviando')
      setAviso('')
      try {
        const r = await acreditarPorToken({ dia, token })
        avisar.current(r.checkin, r.persona)
      } catch (err) {
        setAviso(mensajeDeError(err))
        setEstado('buscando')
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

  return (
    <div className="fixed inset-0 z-40 bg-black" role="dialog" aria-modal="true">
      <video ref={video} playsInline muted className="h-full w-full object-cover" />
      <canvas ref={canvas} className="hidden" />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="h-56 w-56 rounded-2xl border-2 border-white/70" />
        <p className="mt-5 text-sm font-bold text-white drop-shadow">
          {estado === 'pidiendo' && 'Abriendo la cámara…'}
          {estado === 'buscando' && 'Apuntá al QR de la entrada'}
          {estado === 'enviando' && 'Acreditando…'}
        </p>
        {aviso && (
          <p className="mx-8 mt-3 rounded-xl bg-black/70 px-4 py-2 text-center text-sm font-bold text-swc-warn">
            {aviso}
          </p>
        )}
      </div>

      <button
        onClick={onCerrar}
        className="absolute inset-x-0 bottom-8 mx-auto w-40 rounded-full bg-white/15 px-6 py-3 text-sm font-black text-white backdrop-blur"
      >
        Cerrar
      </button>
    </div>
  )
}

export default Escaner
