import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { CanvasTexture, Group, MathUtils, SRGBColorSpace, Vector3 } from 'three'

/**
 * Escena 3D del Mystery Box: 3 cajas celestes flotantes con cintas blancas y
 * un signo de interrogación. Al elegir una, crece, gira y explota en confetti;
 * luego la página revela el resultado (perk ganador o caja vacía).
 *
 * El componente NO sabe de UI: recibe `selected` / `winnerIndex` y avisa con
 * `onSelect` (click) y `onRevealReady` (terminó la explosión).
 */

const BOX_POSITIONS: [number, number, number][] = [
  [-2.4, 0, 0],
  [0, 0, 0],
  [2.4, 0, 0],
]

const GROW_TIME = 0.45 // s creciendo antes de explotar
const REVEAL_DELAY = 1.6 // s desde el click hasta revelar

/* Textura de canvas con un "?" — evita depender de fuentes externas. */
function useQuestionTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, 128, 128)
    ctx.fillStyle = '#0f172b'
    ctx.font = 'bold 104px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', 64, 72)
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [])
}

function GiftBox({
  position,
  phase,
  selected,
  dimmed,
  popped,
  onClick,
}: {
  position: [number, number, number]
  phase: number
  selected: boolean
  dimmed: boolean
  popped: boolean
  onClick: () => void
}) {
  const ref = useRef<Group>(null!)
  const qtex = useQuestionTexture()
  const grow = useMemo(() => new Vector3(1.7, 1.7, 1.7), [])
  const tiny = useMemo(() => new Vector3(0.0001, 0.0001, 0.0001), [])
  const normal = useMemo(() => new Vector3(1, 1, 1), [])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime

    if (popped) {
      g.visible = false
      return
    }
    g.visible = true

    if (selected) {
      g.scale.lerp(grow, 0.14)
      g.rotation.y += delta * 5
      g.position.y = MathUtils.lerp(g.position.y, position[1], 0.2)
    } else if (dimmed) {
      g.scale.lerp(tiny, 0.14)
      g.rotation.y += delta * 1.5
    } else {
      g.scale.lerp(normal, 0.1)
      g.position.y = position[1] + Math.sin(t * 1.5 + phase) * 0.14
      g.rotation.y += delta * 0.5
      g.rotation.x = Math.sin(t * 0.8 + phase) * 0.08
    }
  })

  const setCursor = (v: string) => {
    if (!selected && !dimmed) document.body.style.cursor = v
  }

  return (
    <group
      ref={ref}
      position={position}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={() => setCursor('pointer')}
      onPointerOut={() => setCursor('auto')}
    >
      {/* Cuerpo celeste */}
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#75AADB" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Cintas blancas (cruz en cada cara) */}
      <mesh>
        <boxGeometry args={[0.22, 1.04, 1.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.04, 0.22, 1.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* Moño arriba */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.07, 10, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* Signo de interrogación en las 4 caras laterales */}
      {[
        { pos: [0, 0, 0.531], rot: [0, 0, 0] },
        { pos: [0, 0, -0.531], rot: [0, Math.PI, 0] },
        { pos: [0.531, 0, 0], rot: [0, Math.PI / 2, 0] },
        { pos: [-0.531, 0, 0], rot: [0, -Math.PI / 2, 0] },
      ].map((f, i) => (
        <mesh
          key={i}
          position={f.pos as [number, number, number]}
          rotation={f.rot as [number, number, number]}
        >
          <planeGeometry args={[0.62, 0.62]} />
          <meshBasicMaterial map={qtex} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Confetti({
  position,
  win,
}: {
  position: [number, number, number]
  win: boolean
}) {
  const ref = useRef<Group>(null!)
  const start = useRef<number | null>(null)

  const parts = useMemo(() => {
    const palette = win
      ? ['#75AADB', '#ffffff', '#bcd5ea', '#cfe6ff']
      : ['#7b8794', '#aab4be', '#ffffff']
    const count = win ? 110 : 45
    return Array.from({ length: count }).map((_, i) => {
      const dir = new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize()
      return {
        dir,
        speed: 2.2 + Math.random() * 3.4,
        size: 0.06 + Math.random() * 0.08,
        color: palette[i % palette.length],
        spin: 3 + Math.random() * 5,
      }
    })
  }, [win])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    if (start.current === null) start.current = state.clock.elapsedTime
    const since = state.clock.elapsedTime - start.current
    g.children.forEach((child, i) => {
      const p = parts[i]
      child.position.addScaledVector(p.dir, p.speed * delta)
      child.position.y -= 2.2 * delta * since // gravedad acumulada
      child.rotation.x += delta * p.spin
      child.rotation.y += delta * p.spin
      const life = Math.max(0, 1 - since / 1.5)
      child.scale.setScalar(life * p.size * 10)
    })
  })

  return (
    <group ref={ref} position={position}>
      {parts.map((p, i) => (
        <mesh key={i}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={0.25}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

function Scene({
  selected,
  winnerIndex,
  onSelect,
  onRevealReady,
}: {
  selected: number | null
  winnerIndex: number
  onSelect: (i: number) => void
  onRevealReady: () => void
}) {
  const start = useRef<number | null>(null)
  const fired = useRef(false)
  const [popped, setPopped] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (selected === null) {
      start.current = null
      fired.current = false
      if (popped) setPopped(false)
      return
    }
    if (start.current === null) start.current = t
    const since = t - start.current
    if (since > GROW_TIME && !popped) setPopped(true)
    if (since > REVEAL_DELAY && !fired.current) {
      fired.current = true
      onRevealReady()
    }
  })

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#bcd5ea" />
      <pointLight position={[0, -2, 4]} intensity={0.6} color="#75AADB" />

      {BOX_POSITIONS.map((p, i) => (
        <GiftBox
          key={i}
          position={p}
          phase={i * 1.7}
          selected={selected === i}
          dimmed={selected !== null && selected !== i}
          popped={popped && selected === i}
          onClick={() => onSelect(i)}
        />
      ))}

      {popped && selected !== null && (
        <Confetti position={BOX_POSITIONS[selected]} win={selected === winnerIndex} />
      )}
    </>
  )
}

export function MysteryBoxes3D({
  selected,
  winnerIndex,
  onSelect,
  onRevealReady,
  className,
}: {
  selected: number | null
  winnerIndex: number
  onSelect: (i: number) => void
  onRevealReady: () => void
  className?: string
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.4, 7.2], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        onPointerMissed={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <Suspense fallback={null}>
          <Scene
            selected={selected}
            winnerIndex={winnerIndex}
            onSelect={onSelect}
            onRevealReady={onRevealReady}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default MysteryBoxes3D
