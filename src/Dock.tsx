import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { Matrix4 } from 'three'

// A simple invertible affine transform. Three.js stores Matrix4 values in
// column-major order, so set() keeps the mathematical matrix readable here.
const transform = new Matrix4().set(
  1.15, 0.35, 0, 0.9,
  0.10, 1.00, 0, 0.15,
  0,    0,    1, 0.55,
  0,    0,    0, 1,
)
const inverse = transform.clone().invert()

function Plate({ matrix, opacity = 1 }: { matrix?: Matrix4; opacity?: number }) {
  return (
    <mesh matrix={matrix} matrixAutoUpdate={!matrix} receiveShadow castShadow>
      <boxGeometry args={[2.4, 0.08, 2.4]} />
      <meshStandardMaterial
        color="#4a5560"
        metalness={0.85}
        roughness={0.18}
        envMapIntensity={1.2}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

function Stanchion({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
      <meshStandardMaterial color="#2b3036" metalness={0.4} roughness={0.5} />
    </mesh>
  )
}

export function Dock() {
  // transform · inverse = identity: the restored plate lands exactly on the
  // original. Keep a translucent transformed plate visible so the operation
  // has a spatial consequence you can inspect by orbiting the scene.
  const restored = transform.clone().multiply(inverse)

  return (
    <Canvas shadows camera={{ position: [4.2, 2.8, 5.2], fov: 40 }}>
      <color attach="background" args={['#8a93a0']} />
      <fog attach="fog" args={['#8a93a0', 8, 22]} />
      <hemisphereLight args={['#cfd6de', '#3a4048', 0.55]} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* X: visible transformed state. */}
      <Plate matrix={transform} opacity={0.35} />
      {/* X X^-1 = I: restored state, coincident with the original geometry. */}
      <Plate matrix={restored} />

      <Stanchion position={[1.6, 0.6, 1.4]} />
      <Stanchion position={[-1.5, 0.6, 1.2]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#6d7680" roughness={1} />
      </mesh>
      <Environment preset="city" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  )
}
