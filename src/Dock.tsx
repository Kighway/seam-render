import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { Group, Matrix4, Quaternion, Vector3 } from 'three'

const transform = new Matrix4().set(
  1.15, 0.35, 0, 0.9,
  0.10, 1.00, 0, 0.15,
  0,    0,    1, 0.55,
  0,    0,    0, 1,
)
const inverse = transform.clone().invert()
const identity = new Matrix4()

type Stage = 0 | 1 | 2
const stageNames = ['Original: I', 'Apply X', 'Apply X⁻¹: restored'] as const

function decompose(matrix: Matrix4) {
  const position = new Vector3()
  const rotation = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, rotation, scale)
  return { position, rotation, scale }
}

function AnimatedPlate({ target }: { target: Matrix4 }) {
  const group = useRef<Group>(null)
  const targetParts = useMemo(() => decompose(target), [target])

  useFrame((_, delta) => {
    if (!group.current) return
    const alpha = 1 - Math.exp(-4 * delta)
    group.current.position.lerp(targetParts.position, alpha)
    group.current.quaternion.slerp(targetParts.rotation, alpha)
    group.current.scale.lerp(targetParts.scale, alpha)
  })

  return (
    <group ref={group}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[2.4, 0.08, 2.4]} />
        <meshStandardMaterial color="#4a5560" metalness={0.85} roughness={0.18} envMapIntensity={1.2} />
      </mesh>
    </group>
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

function MatrixReadout({ matrix }: { matrix: Matrix4 }) {
  // Matrix4.elements is column-major; transpose for familiar row display.
  const e = matrix.clone().transpose().elements
  return (
    <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
      {[0, 1, 2, 3].map((row) =>
        `[ ${[0, 1, 2, 3].map((col) => e[row * 4 + col].toFixed(2).padStart(5)).join('  ')} ]`,
      ).join('\n')}
    </pre>
  )
}

export function Dock() {
  const [stage, setStage] = useState<Stage>(0)
  const restored = useMemo(() => transform.clone().multiply(inverse), [])
  const targets = [identity, transform, restored] as const
  const shownMatrix = stage === 0 ? identity : stage === 1 ? transform : inverse

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Canvas shadows camera={{ position: [4.2, 2.8, 5.2], fov: 40 }}>
        <color attach="background" args={['#8a93a0']} />
        <fog attach="fog" args={['#8a93a0', 8, 22]} />
        <hemisphereLight args={['#cfd6de', '#3a4048', 0.55]} />
        <directionalLight position={[6, 8, 4]} intensity={1.35} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

        <AnimatedPlate target={targets[stage]} />
        <Stanchion position={[1.6, 0.6, 1.4]} />
        <Stanchion position={[-1.5, 0.6, 1.2]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#6d7680" roughness={1} />
        </mesh>
        <Environment preset="city" />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>

      <div style={{ position: 'absolute', left: 16, bottom: 16, padding: 14, background: 'rgba(18,22,27,.82)', color: '#eef2f6', borderRadius: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        <div style={{ marginBottom: 10, fontWeight: 700 }}>{stageNames[stage]}</div>
        <MatrixReadout matrix={shownMatrix} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => setStage(0)}>Original</button>
          <button onClick={() => setStage(1)}>Apply X</button>
          <button onClick={() => setStage(2)}>Apply X⁻¹</button>
        </div>
        <div style={{ marginTop: 8, opacity: 0.72, fontSize: 11 }}>
          X · X⁻¹ ≈ I — the final plate returns to its starting geometry.
        </div>
      </div>
    </div>
  )
}
