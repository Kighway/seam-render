import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { Group, Matrix3, Matrix4 } from 'three'

type PresetName = 'Rotation' | 'Scale' | 'Shear' | 'Ill-conditioned'
type Stage = 0 | 1 | 2

const identity = new Matrix4()
const stageNames = ['Original', 'Transformed', 'Restored'] as const

const presetDescriptions: Record<PresetName, string> = {
  Rotation: 'Turns the plate 45° around the vertical axis.',
  Scale: 'Stretches one axis while compressing another.',
  Shear: 'Slides one axis in proportion to another.',
  'Ill-conditioned': 'Nearly collapses one dimension; inversion becomes numerically fragile.',
}

const presets: Record<PresetName, Matrix4> = {
  Rotation: new Matrix4().makeRotationY(Math.PI / 4),
  Scale: new Matrix4().makeScale(1.7, 1, 0.55),
  Shear: new Matrix4().set(
    1, 0.85, 0, 0,
    0, 1,    0, 0,
    0, 0,    1, 0,
    0, 0,    0, 1,
  ),
  'Ill-conditioned': new Matrix4().makeScale(1, 1, 0.0001),
}

function AnimatedPlate({ target }: { target: Matrix4 }) {
  const group = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!group.current) return
    const alpha = 1 - Math.exp(-4 * delta)
    const current = group.current.matrix.elements
    const goal = target.elements
    for (let i = 0; i < 16; i++) current[i] += (goal[i] - current[i]) * alpha
    group.current.matrixWorldNeedsUpdate = true
  })

  return (
    <group ref={group} matrixAutoUpdate={false}>
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
    <pre className="matrix-readout">
      {[0, 1, 2, 3].map(row =>
        `[ ${[0, 1, 2, 3].map(col => e[row * 4 + col].toFixed(3).padStart(7)).join(' ')} ]`,
      ).join('\n')}
    </pre>
  )
}

function conditionNumber(matrix: Matrix4) {
  const a = new Matrix3().setFromMatrix4(matrix)
  const e = a.elements
  const rows = [[e[0], e[3], e[6]], [e[1], e[4], e[7]], [e[2], e[5], e[8]]]
  const ata = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0)),
  )

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
    ata[p][p] = app
    ata[q][q] = aqq
    ata[p][q] = ata[q][p] = 0
  }

  const eigen = [ata[0][0], ata[1][1], ata[2][2]]
    .map(v => Math.max(0, v))
    .sort((a, b) => a - b)
  return Math.sqrt(eigen[2] / eigen[0])
}

export function Dock() {
  const [stage, setStage] = useState<Stage>(0)
  const [preset, setPreset] = useState<PresetName>('Rotation')
  const [compact, setCompact] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [renderOpen, setRenderOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const transform = presets[preset]
  const inverse = useMemo(() => transform.clone().invert(), [transform])
  const restored = useMemo(() => transform.clone().multiply(inverse), [transform, inverse])
  const targets = [identity, transform, restored] as const
  const shownMatrix = stage === 0 ? identity : stage === 1 ? transform : inverse
  const kappa = useMemo(() => conditionNumber(transform), [transform])
  const anyMinimized = !controlsOpen || !renderOpen
  const bothOpen = controlsOpen && renderOpen

  return (
    <div className="dock-shell">
      <div className={`window-manager ${anyMinimized ? 'has-minimized' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <button
          className="window-menu-button"
          aria-label="Window menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(value => !value)}
        >
          ☰
        </button>
        {menuOpen && (
          <div className="window-menu">
            <button onClick={() => setControlsOpen(value => !value)}>
              <span>{controlsOpen ? '✓' : ''}</span> Controls
            </button>
            <button onClick={() => setRenderOpen(value => !value)}>
              <span>{renderOpen ? '✓' : ''}</span> Render
            </button>
          </div>
        )}
      </div>

      <div className={`workspace ${bothOpen ? 'both-windows' : 'single-window'}`}>
        {controlsOpen && (
          <aside className={`window controls-window ${compact ? 'compact' : 'expanded'}`}>
            <header className="window-titlebar">
              <div className="window-heading">
                <span className="window-kicker">seam-render</span>
                <strong>Transform Lab</strong>
              </div>
              <div className="window-actions">
                <span className={`kappa-badge ${kappa > 100 ? 'warning' : ''}`}>κ {kappa.toExponential(1)}</span>
                <button className="compact-toggle" onClick={() => setCompact(value => !value)}>
                  {compact ? 'Details' : 'Mini'}
                </button>
                <button className="icon-button" aria-label="Minimize controls" onClick={() => setControlsOpen(false)}>−</button>
              </div>
            </header>

            <div className="controls-body">
              <div className="control-grid">
                <label className="field">
                  <span>Transformation</span>
                  <select
                    className="transform-select"
                    value={preset}
                    onChange={e => {
                      setPreset(e.target.value as PresetName)
                      setStage(0)
                    }}
                  >
                    {(Object.keys(presets) as PresetName[]).map(name => <option key={name}>{name}</option>)}
                  </select>
                </label>

                <div className="field">
                  <span>State</span>
                  <div className="segmented" role="group" aria-label="Transformation state">
                    {stageNames.map((name, index) => (
                      <button
                        key={name}
                        className={stage === index ? 'active' : ''}
                        onClick={() => setStage(index as Stage)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="verbose-only">
                <p className="description">{presetDescriptions[preset]}</p>
                <div className="status-row">
                  <span>condition number κ₂(X)</span>
                  <strong className={kappa > 100 ? 'warning' : ''}>{kappa.toExponential(3)}</strong>
                </div>
                <div className="matrix-card">
                  <div className="matrix-title">{stage === 0 ? 'I' : stage === 1 ? 'X' : 'X⁻¹'}</div>
                  <MatrixReadout matrix={shownMatrix} />
                </div>
                <p className="hint">
                  {stage === 2 ? 'X · X⁻¹ ≈ I — geometry restored.' : 'Orbit the scene, then step through the transformation.'}
                </p>
              </div>
            </div>
          </aside>
        )}

        {renderOpen && (
          <section className="window render-window">
            <header className="window-titlebar render-titlebar">
              <div className="window-heading">
                <span className="window-kicker">viewport</span>
                <strong>Render</strong>
              </div>
              <button className="icon-button" aria-label="Minimize render" onClick={() => setRenderOpen(false)}>−</button>
            </header>
            <div className="canvas-frame">
              <Canvas shadows camera={{ position: [4.2, 2.8, 5.2], fov: 40 }} dpr={[1, 2]}>
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
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
