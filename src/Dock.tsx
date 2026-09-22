import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

function Plate() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <boxGeometry args={[4, 4, 0.08]} />
      <meshStandardMaterial
        color="#4a5560"
        metalness={0.85}
        roughness={0.18}
        envMapIntensity={1.2}
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
      <Plate />
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
