import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { Group, Matrix3, Matrix4, Quaternion, Vector3 } from 'three'

type PresetName = 'Rotation' | 'Scale' | 'Shear' | 'Ill-conditioned'
type Stage = 0 | 1 | 2

const identity = new Matrix4()
const stageNames = ['Original: I', 'Apply X', 'Apply X⁻¹: restored'] as const

const presets: Record<PresetName, Matrix4> = {
  Rotation: new Matrix4().makeRotationY(Math.PI / 4),
  Scale: new Matrix4().makeScale(1.7, 1, 0.55),
  Shear: new Matrix4().set(
    1, 0.85, 0, 0,
    0, 1,    0, 0,
    0, 0,    1, 0,
    0, 0,    0, 1,
  ),
  // One axis is almost collapsed. Inverting it requires enormous amplification
  // along that direction: tiny numerical/input errors can become large output errors.
  'Ill-conditioned': new Matrix4().makeScale(1, 1, 0.0001),
}

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
  const e = matrix.clone().transpose().elements
  return (
    <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>
      {[0, 1, 2, 3].map((row) =>
        `[ ${[0, 1, 2, 3].map((col) => e[row * 4 + col].toFixed(3).padStart(7)).join(' ')} ]`,
      ).join('\n')}
    </pre>
  )
}

function conditionNumber(matrix: Matrix4) {
  // For these affine demos the interesting part is the upper-left 3x3 linear map.
  // Estimate κ₂ via eigenvalues of AᵀA (singular values squared).
  const a = new Matrix3().setFromMatrix4(matrix)
  const e = a.elements
  const rows = [
    [e[0], e[3], e[6]],
    [e[1], e[4], e[7]],
    [e[2], e[5], e[8]],
  ]
  const ata = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0)),
  )

  // Jacobi iterations for this tiny real symmetric matrix.
  for (let n = 0; n < 20; n++) {
    let p = 0, q = 1
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]] as const)
      if (Math.abs(ata[i][j]) > Math.abs(ata[p][q])) [p, q] = [i, j]
    if (Math.abs(ata[p][q]) < 1e-15) break
    const theta = 0.5 * Math.atan2(2 * ata[p][q], ata[q][q] - ata[p][p])
    const c = Math.cos(theta), s = Math.sin(theta)
    const app = c*c*ata[p][p] - 2*s*c*ata[p][q] + s*s*ata[q][q]
    const aqq = s*s*ata[p][p] + 2*s*c*ata[p][q] + c*c*ata[q][q]
    for (let k = 0; k < 3; k++) if (k !== p && k !== q) {
      const apk = c*ata[p][k] - s*ata[q][k]
      const aqk = s*ata[p][k] + c*ata[q][k]
      ata[p][k] = ata[k][p] = apk
      ata[q][k] = ata[k][q] = aqk
    }
    ata[p][p] = app; ata[q][q] = aqq; ata[p][q] = ata[q][p] = 0
  }
  const eigen = [ata[0][0], ata[1][1], ata[2][2]].map(v => Math.max(0, v)).sort((a, b) => a - b)
  return Math.sqrt(eigen[2] / eigen[0])
}

export function Dock() {
  const [stage, setStage] = useState<Stage>(0)
  const [preset, setPreset] = useState<PresetName>('Rotation')
  const transform = presets[preset]
  const inverse = useMemo(() => transform.clone().invert(), [transform])
  const restored = useMemo(() => transform.clone().multiply(inverse), [transform, inverse])
  const targets = [identity, transform, restored] as const
  const shownMatrix = stage === 0 ? identity : stage === 1 ? transform : inverse
  const kappa = useMemo(() => conditionNumber(transform), [transform])

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

      <div style={{ position: 'absolute', left: 16, bottom: 16, maxWidth: 470, padding: 14, background: 'rgba(18,22,27,.86)', color: '#eef2f6', borderRadius: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {(Object.keys(presets) as PresetName[]).map(name =>
            <button key={name} onClick={() => { setPreset(name); setStage(0) }}>{name}</button>
          )}
        </div>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>{preset} · {stageNames[stage]}</div>
        <MatrixReadout matrix={shownMatrix} />
        <div style={{ marginTop: 7, fontSize: 12 }}>condition number κ₂(X) ≈ {kappa.toExponential(3)}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => setStage(0)}>Original</button>
          <button onClick={() => setStage(1)}>Apply X</button>
          <button onClick={() => setStage(2)}>Apply X⁻¹</button>
        </div>
        <div style={{ marginTop: 8, opacity: 0.72, fontSize: 11 }}>
          Small κ: stable geometry. Huge κ: X nearly collapses a dimension, so X⁻¹ must amplify it enormously.
        </div>
      </div>
    </div>
  )
}
