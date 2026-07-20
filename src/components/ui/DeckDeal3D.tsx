import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { type Group, SRGBColorSpace } from 'three'
import { type DeckLayout, cardCenter, deckHeight } from '../../lib/deckLayout'

/**
 * Reparto de mazo en 3D para la grilla de startups.
 *
 * Las cards salen apiladas del centro y vuelan a su posición en la grilla
 * girando sobre su eje Y (dorso → frente). La cámara es ortográfica y está
 * mapeada 1:1 a píxeles CSS, así que las posiciones finales coinciden exacto
 * con la grilla del DOM que queda debajo.
 *
 * Las imágenes son 1080×1350 (4:5) uniformes, por eso el layout se calcula
 * sin medir el DOM.
 */

/** Duración del vuelo de cada card (segundos) y desfase por defecto entre una y la siguiente. */
const FLIGHT = 0.9
const DEFAULT_STAGGER = 0.07

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function Card({
  url,
  index,
  layout,
  deck,
  stagger,
  startAt,
}: {
  url: string
  index: number
  layout: DeckLayout
  /** Centro del mazo en píxeles CSS relativos al contenedor. */
  deck: { x: number; y: number }
  stagger: number
  startAt: { current: number }
}) {
  const ref = useRef<Group>(null)
  const texture = useTexture(url)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const target = useMemo(() => cardCenter(layout, index), [layout, index])

  /** Giro inicial del mazo: leve abanico determinístico (sin Math.random, para que sea estable). */
  const tilt = useMemo(() => ((index % 7) - 3) * 0.05, [index])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return

    const elapsed = clock.getElapsedTime() - startAt.current - index * stagger
    const t = Math.max(0, Math.min(1, elapsed / FLIGHT))
    const e = easeOutCubic(t)

    g.position.x = deck.x + (target.x - deck.x) * e
    g.position.y = -(deck.y + (target.y - deck.y) * e)
    // La cámara es ortográfica, así que z no da perspectiva: sólo ordena el
    // dibujado. El offset por índice evita el z-fighting dentro del mazo.
    g.position.z = (200 + index * 0.5) * (1 - e)

    // Dorso → frente: media vuelta sobre Y.
    g.rotation.y = Math.PI * (1 - e)
    g.rotation.z = tilt * (1 - e)

    const s = 0.82 + 0.18 * e
    g.scale.setScalar(s)
  })

  return (
    <group ref={ref}>
      {/* Frente */}
      <mesh>
        <planeGeometry args={[target.w, target.h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Dorso: se ve mientras la card está girada. */}
      <mesh position={[0, 0, -1]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[target.w, target.h]} />
        <meshBasicMaterial color="#0f172b" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Deal({
  images,
  layout,
  stagger,
  onDone,
}: {
  images: string[]
  layout: DeckLayout
  stagger: number
  onDone: () => void
}) {
  const { camera, clock } = useThree()
  // El reloj arranca con el Canvas, pero este componente monta recién cuando las
  // texturas resolvieron el Suspense. Sin fijar el origen acá, las cards leerían
  // startAt=0 en su primer frame y aparecerían ya repartidas.
  const startAt = useRef(0)
  const done = useRef(false)

  useLayoutEffect(() => {
    startAt.current = clock.getElapsedTime()
  }, [clock])

  const height = deckHeight(layout, images.length)

  // Cámara ortográfica mapeada 1:1 a píxeles CSS, con el origen arriba-izquierda.
  useEffect(() => {
    const cam = camera as unknown as {
      left: number; right: number; top: number; bottom: number; updateProjectionMatrix: () => void
    }
    cam.left = 0
    cam.right = layout.width
    cam.top = 0
    cam.bottom = -height
    cam.updateProjectionMatrix()
  }, [camera, layout.width, height])

  useFrame(({ clock }) => {
    if (!startAt.current) startAt.current = clock.getElapsedTime()
    if (done.current) return
    const total = FLIGHT + stagger * (images.length - 1)
    if (clock.getElapsedTime() - startAt.current >= total) {
      done.current = true
      onDone()
    }
  })

  // El mazo arranca en el centro del canvas. Si arrancara arriba del borde
  // superior quedaría recortado: el canvas sólo cubre el área de la grilla.
  const deck = { x: layout.width / 2, y: height / 2 }

  return (
    <>
      {images.map((url, i) => (
        <Card
          key={url}
          url={url}
          index={i}
          layout={layout}
          deck={deck}
          stagger={stagger}
          startAt={startAt}
        />
      ))}
    </>
  )
}

export function DeckDeal3D({
  images,
  layout,
  stagger = DEFAULT_STAGGER,
  onDone,
}: {
  images: string[]
  layout: DeckLayout
  /** Desfase entre una card y la siguiente (segundos). Más alto = reparto más progresivo. */
  stagger?: number
  onDone: () => void
}) {
  const height = deckHeight(layout, images.length)

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1000], near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      // El contenedor es position:absolute y react-use-measure reporta 0 ahí:
      // sin offsetSize el canvas se queda en los 300×150 por defecto.
      resize={{ offsetSize: true }}
      style={{ width: '100%', height, background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Deal images={images} layout={layout} stagger={stagger} onDone={onDone} />
      </Suspense>
    </Canvas>
  )
}

export default DeckDeal3D
