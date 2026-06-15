import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  CanvasTexture,
  DoubleSide,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'

/**
 * Animación 3D del corte del ticket dorado (stub): el trozo cortado se ROMPE en
 * fragmentos de papel que salen disparados, giran, caen y se desvanecen — el
 * borde queda desgarrado y esa parte "desaparece".
 *
 * Se monta lazy SOLO al cortar en mobile, así el landing no carga WebGL hasta
 * que hace falta. El drag de la tijera vive en el DOM (WorldCupTicket).
 */

// Tamaño del trozo en unidades de mundo (aspecto angosto/alto, como el stub).
const PLANE_W = 0.54
const PLANE_H = 1.94
const COLS = 3
const ROWS = 7

/** Pseudo-aleatorio determinista (sin estado) para variar cada fragmento. */
function hash(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Textura de canvas que imita el stub: dorado, sello SWC, "AR · 26" y borde rasgado. */
function buildStubTexture() {
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

type Fragment = {
  geo: PlaneGeometry
  base: Vector3
  pos: Vector3
  vel: Vector3
  ang: Vector3
}

/** Divide el stub en una grilla de fragmentos, cada uno con su porción de textura. */
function buildFragments(): Fragment[] {
  const cellW = PLANE_W / COLS
  const cellH = PLANE_H / ROWS
  const frags: Fragment[] = []

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const geo = new PlaneGeometry(cellW, cellH)

      // Remapear UVs a la sub-porción de la textura que le toca a esta celda.
      const u0 = c / COLS
      const u1 = (c + 1) / COLS
      const vTop = 1 - r / ROWS
      const vBot = 1 - (r + 1) / ROWS
      const uv = geo.attributes.uv
      uv.setXY(0, u0, vTop)
      uv.setXY(1, u1, vTop)
      uv.setXY(2, u0, vBot)
      uv.setXY(3, u1, vBot)
      uv.needsUpdate = true

      const bx = -PLANE_W / 2 + cellW * (c + 0.5)
      const by = PLANE_H / 2 - cellH * (r + 0.5)

      const i = r * COLS + c
      const h1 = hash(i, 1)
      const h2 = hash(i, 2)
      const h3 = hash(i, 3)
      const h4 = hash(i, 4)

      // Velocidad: explota hacia afuera desde el centro del trozo + dispersión.
      const len = Math.hypot(bx, by) || 1
      const nx = bx / len
      const ny = by / len
      const speed = 1.0 + h1 * 1.3
      const vel = new Vector3(
        nx * speed * 0.8 + (h2 - 0.5) * 1.1,
        0.7 + ny * 0.5 + (h3 - 0.5) * 0.9,
        0.5 + h4 * 1.0,
      )
      const ang = new Vector3((h1 - 0.5) * 7, (h2 - 0.5) * 7, (h3 - 0.5) * 7)

      frags.push({ geo, base: new Vector3(bx, by, 0), pos: new Vector3(bx, by, 0), vel, ang })
    }
  }
  return frags
}

function Shatter({ onDone }: { onDone: () => void }) {
  const tex = useMemo(buildStubTexture, [])
  const frags = useMemo(buildFragments, [])
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.5,
        metalness: 0.5,
        roughness: 0.42,
        side: DoubleSide,
      }),
    [tex],
  )

  const group = useRef<Group>(null)
  const state = useRef({ t: 0, done: false })

  // Liberar recursos GPU al desmontar (se crearon con useMemo, r3f no los limpia).
  useEffect(() => {
    return () => {
      frags.forEach((f) => f.geo.dispose())
      mat.dispose()
      tex.dispose()
    }
  }, [frags, mat, tex])

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const s = state.current
    s.t += dt

    for (let i = 0; i < frags.length; i++) {
      const f = frags[i]
      f.vel.y -= 6.2 * dt // gravedad
      f.pos.addScaledVector(f.vel, dt)
      const child = g.children[i]
      if (!child) continue
      child.position.copy(f.pos)
      child.rotation.x += f.ang.x * dt
      child.rotation.y += f.ang.y * dt
      child.rotation.z += f.ang.z * dt
    }

    // El papel se desvanece a medida que se rompe.
    if (s.t > 0.4) mat.opacity = Math.max(0, 1 - (s.t - 0.4) / 0.75)

    if (s.t > 1.3 && !s.done) {
      s.done = true
      onDone()
    }
  })

  return (
    <group ref={group} position={[1.25, 1.36, 0]}>
      {frags.map((f, i) => (
        <mesh key={i} geometry={f.geo} material={mat} position={[f.base.x, f.base.y, 0]} />
      ))}
    </group>
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
      <Shatter onDone={onDone} />
    </Canvas>
  )
}
