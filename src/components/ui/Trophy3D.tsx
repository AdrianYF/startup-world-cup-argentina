import { Suspense, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, Lightformer, useTexture } from '@react-three/drei'
import {
  type Group,
  type Mesh,
  type MeshStandardMaterial,
  Box3,
  Vector3,
  SRGBColorSpace,
  NoColorSpace,
  ACESFilmicToneMapping,
} from 'three'

/**
 * Trofeo 3D — modelo GLB (public/golden_trophy.glb) con su textura ORIGINAL
 * (metálica embebida). Rota siguiendo el cursor + leve flotación.
 */
const MODEL_URL = '/golden_trophy.glb'

function TrophyModel() {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(MODEL_URL)
  // baseColor original del GLB con el oro recoloreado a amarillo mate (madera intacta).
  // Color (copa oro + base blanca) + mapas de metalness/roughness para que la copa
  // sea oro metálico y la base blanco MATE (no-metálico).
  const [base, metalMap, roughMap] = useTexture([
    '/trophy-base.jpg',
    '/trophy-metal.jpg',
    '/trophy-rough.jpg',
  ])
  base.flipY = false
  base.colorSpace = SRGBColorSpace
  base.anisotropy = 8
  for (const t of [metalMap, roughMap]) {
    t.flipY = false
    t.colorSpace = NoColorSpace
    t.anisotropy = 8
  }

  const { object, scale } = useMemo(() => {
    const obj = scene.clone(true)
    obj.traverse(o => {
      const m = o as Mesh
      if (!m.isMesh) return
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      mats.forEach(mat => {
        const sm = mat as MeshStandardMaterial
        if (!sm || sm.roughness === undefined) return
        sm.map = base
        sm.color.set('#ffffff')
        sm.metalness = 1
        sm.metalnessMap = metalMap // copa=metal, base=no-metal
        sm.roughness = 1
        sm.roughnessMap = roughMap // base mate
        sm.envMapIntensity = 1.35
        sm.needsUpdate = true
      })
    })
    const box = new Box3().setFromObject(obj)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const s = 2.05 / Math.max(size.y, 0.0001)
    obj.position.sub(center)
    return { object: obj, scale: s }
  }, [scene, base, metalMap, roughMap])

  // La copa rota siguiendo el cursor (movimiento del mouse en toda la página).
  const mouse = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const targetY = mouse.current.x * Math.PI * 0.85
    const targetX = -mouse.current.y * 0.3
    ref.current.rotation.y += (targetY - ref.current.rotation.y) * 0.07
    ref.current.rotation.x += (targetX - ref.current.rotation.x) * 0.07
    ref.current.position.y = 0.74 + Math.sin(t * 0.8) * 0.04
  })

  return (
    <group ref={ref}>
      <primitive object={object} scale={scale} />
    </group>
  )
}

useGLTF.preload(MODEL_URL)

export function Trophy3D({ className }: { className?: string }) {
  const glConfig = useMemo(
    () => ({
      antialias: true,
      alpha: true,
      toneMapping: ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
    }),
    [],
  )

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.2, 5.0], fov: 35, near: 0.1, far: 100 }}
        gl={glConfig}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        {/* Key a 45° cálida apuntando a la copa */}
        <directionalLight position={[6, 6, 6]} intensity={1.1} color="#fff0cf" />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#ffe2a6" />

        <Suspense fallback={null}>
          <TrophyModel />
          {/* Estudio CÁLIDO envolvente → el metal refleja dorado (no negro) con brillo */}
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={1.3} color="#ffe9c2" position={[0, 0, -8]} scale={[40, 40, 1]} />
            <Lightformer form="rect" intensity={1.1} color="#fff2d8" position={[0, 1, 8]} scale={[40, 40, 1]} />
            <Lightformer form="rect" intensity={1.4} color="#fff0cf" position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[30, 30, 1]} />
            <Lightformer form="rect" intensity={0.7} color="#e6c587" position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[30, 30, 1]} />
            {/* laterales (evitan bandas negras en los reflejos) */}
            <Lightformer form="rect" intensity={1.1} color="#ffe6b8" position={[-8, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={[40, 40, 1]} />
            <Lightformer form="rect" intensity={1.1} color="#ffe6b8" position={[8, 1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[40, 40, 1]} />
            <Lightformer form="rect" intensity={4.5} color="#fff7e6" position={[0, 6, 4]} rotation={[-Math.PI / 3, 0, 0]} scale={[8, 6, 1]} />
            <Lightformer form="rect" intensity={3.2} color="#ffffff" position={[-5, 2, 4]} rotation={[0, Math.PI / 4, 0]} scale={[2.5, 9, 1]} />
            <Lightformer form="rect" intensity={3.2} color="#ffffff" position={[5, 2, 4]} rotation={[0, -Math.PI / 4, 0]} scale={[2.5, 9, 1]} />
          </Environment>
          <ContactShadows position={[0, -1.05, 0]} opacity={0.42} scale={3.6} blur={2.2} far={2.5} resolution={1024} color="#1a2230" />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Trophy3D
