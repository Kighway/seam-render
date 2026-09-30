import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import type { Mat4 } from '../math'
import { AnimatedPlate } from './AnimatedPlate'
import { Stanchion } from './Stanchion'

export function Viewport({ target }: { target: Mat4 }) {
  return (
    <Canvas shadows camera={{ position: [4.2, 2.8, 5.2], fov: 40 }} dpr={[1, 2]}>
      <color attach="background" args={['#8a93a0']} />
      <fog attach="fog" args={['#8a93a0', 8, 22]} />
      <hemisphereLight args={['#cfd6de', '#3a4048', 0.55]} />
      <directionalLight position={[6, 8, 4]} intensity={1.35} castShadow />
      <AnimatedPlate target={target} />
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
