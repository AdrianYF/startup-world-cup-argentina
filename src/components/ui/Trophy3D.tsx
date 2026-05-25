import { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import {
  type Group,
  type Mesh,
  type MeshStandardMaterial as MeshStandardMaterialType,
  type Texture,
  MeshStandardMaterial,
  DoubleSide,
  ACESFilmicToneMapping,
} from 'three'

/**
 * Trofeo dorado en 3D con PBR realista.
 *
 * Pipeline:
 *  - useGLTF('/trophy-v2.glb') carga el mesh heightmap+inflación (ver
 *    scripts/generate-trophy-glb.py). El GLB trae la PNG embebida como baseColor.
 *  - useMemo + scene.traverse: override del material por uno PBR (metal pulido)
 *    preservando la textura PNG como map (engravings visibles).
 *  - Environment preset "warehouse" + envMapIntensity alta = reflejos cálidos.
 *  - ACESFilmicToneMapping + exposure 1.1 = highlights filmicos sin saturarse.
 *  - Camera distance 5.5 + scale 1.3 = mesh nunca sale del frustum al rotar.
 */

const TROPHY_MODEL_URL = '/trophy-v2.glb'

function TrophyModel() {
  const ref = useRef<Group>(null)
  // Args: (path, useDraco, useMeshopt, extendLoader)
  // useMeshopt=true porque el GLB se comprimió con `gltfpack -cc` (EXT_meshopt_compression)
  const { scene } = useGLTF(TROPHY_MODEL_URL, undefined, true)

  // Material PBR oro pulido — se aplica una vez por scene mount.
  // Preserva la textura embebida del GLB como baseColor map.
  useEffect(() => {
    scene.traverse(obj => {
      const m = obj as Mesh
      if (!m.isMesh) return
      const oldMat = m.material as MeshStandardMaterialType | undefined
      const baseTexture: Texture | null = oldMat?.map ?? null
      const newMat = new MeshStandardMaterial({
        map: baseTexture,
        color: 0xd4af37,           // gold
        metalness: 0.95,
        roughness: 0.32,
        envMapIntensity: 1.3,
        side: DoubleSide,          // render front y back de quads abiertos
      })
      m.material = newMat
      m.castShadow = true
      m.receiveShadow = true
    })
  }, [scene])

  // Rotación suave + float — useRef para evitar re-renders.
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 0.35
    ref.current.position.y = Math.sin(t * 0.8) * 0.05
  })

  return <primitive ref={ref} object={scene} scale={1.3} />
}

useGLTF.preload(TROPHY_MODEL_URL, undefined, true)

export function Trophy3D({ className }: { className?: string }) {
  // Memoize gl config para no re-crear el renderer en cada render del parent.
  const glConfig = useMemo(
    () => ({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      toneMapping: ACESFilmicToneMapping,
      toneMappingExposure: 1.1,
    }),
    [],
  )

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.3, 5.5], fov: 35, near: 0.1, far: 50 }}
        gl={glConfig}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        {/* Iluminación: el environment hace el 80% del trabajo en metales. */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 6, 5]} intensity={0.8} color="#fff4d6" />
        <directionalLight position={[-4, 2, -3]} intensity={0.3} color="#75AADB" />

        <Suspense fallback={null}>
          <TrophyModel />
          {/* warehouse = HDRI con ventanas cálidas = highlights interesantes en oro */}
          <Environment preset="warehouse" />
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.35}
            scale={4}
            blur={3}
            far={2.5}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Trophy3D
