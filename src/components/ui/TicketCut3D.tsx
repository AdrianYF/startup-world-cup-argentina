import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  CanvasTexture,
  DoubleSide,
  SRGBColorSpace,
  type Mesh,
  type MeshStandardMaterial,
} from 'three'

/**
 * Animación 3D del "recorte" del ticket dorado (stub) que se desprende y cae.
 *
 * Se monta lazy SOLO cuando el usuario corta el ticket en mobile, así el landing
 * no carga WebGL hasta que hace falta. El drag de la tijera vive en el DOM
 * (WorldCupTicket); acá solo animamos el papel cayendo con perspectiva real,
 * luz sobre el dorado y tumbling por gravedad.
 */

/** Textura de canvas que imita el stub: dorado, sello SWC, "AR · 26" y borde rasgado. */
function buildStubTexture() {
  // Aspecto angosto y alto, como el stub real (~64 × 230px).
  const w = 180
  const h = 648
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, w, h)

  // Contorno con borde IZQUIERDO rasgado (zigzag) → silueta de papel cortado.
  const teeth = 34
  const edge = 22
  ctx.beginPath()
  ctx.moveTo(edge, 0)
  for (let i = 1; i <= teeth; i++) {
    const y = (h / teeth) * i
    const x = i % 2 === 0 ? edge + 7 : edge - 15
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w, h)
  ctx.lineTo(w, 0)
  ctx.closePath()
  ctx.clip()

  // Degradé dorado (igual que el stub: oro → blanco abajo).
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#d4af37')
  g.addColorStop(0.62, '#d4af37')
  g.addColorStop(1, '#ffffff')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const cx = w / 2 + 8

  // Sello SWC.
  ctx.strokeStyle = 'rgba(15,23,43,0.75)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(cx, 150, 40, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#21313f'
  ctx.font = 'bold 28px Outfit, ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('SWC', cx, 152)

  // AR · 26.
  ctx.font = 'bold 26px Outfit, ui-sans-serif, system-ui, sans-serif'
  ctx.fillText('AR · 26', cx, h - 95)

  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return tex
}

function FallingStub({ onDone }: { onDone: () => void }) {
  const ref = useRef<Mesh>(null)
  const tex = useMemo(buildStubTexture, [])
  // Estado físico mutable (no provoca re-render).
  const phys = useRef({ vy: 0.7, t: 0, done: false })

  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const s = phys.current
    s.t += dt

    // Gravedad + drift + tumbling.
    s.vy -= 7.5 * dt
    m.position.y += s.vy * dt
    m.position.x += 0.18 * dt
    m.rotation.x += 2.3 * dt
    m.rotation.y += 1.7 * dt
    m.rotation.z += 1.05 * dt

    // Fade hacia el final.
    const mat = m.material as MeshStandardMaterial
    if (s.t > 0.75) mat.opacity = Math.max(0, 1 - (s.t - 0.75) / 0.6)

    if (s.t > 1.35 && !s.done) {
      s.done = true
      onDone()
    }
  })

  return (
    <mesh ref={ref} position={[1.25, 1.36, 0]} rotation={[0.06, 0, -0.05]}>
      <planeGeometry args={[0.54, 1.94, 1, 1]} />
      <meshStandardMaterial
        map={tex}
        transparent
        alphaTest={0.5}
        metalness={0.5}
        roughness={0.42}
        side={DoubleSide}
      />
    </mesh>
  )
}

export default function TicketCut3D({ onDone }: { onDone: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={0.95} />
      <directionalLight position={[2, 4, 5]} intensity={1.5} />
      <directionalLight position={[-3, 2, 2]} intensity={0.5} />
      <FallingStub onDone={onDone} />
    </Canvas>
  )
}
