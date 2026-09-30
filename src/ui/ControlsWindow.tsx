import { STAGE_NAMES, type Stage, type TransformKind } from '../math'
import type { TransformLab } from '../lab/useTransformLab'
import { MatrixReadout } from './MatrixReadout'
import { TransformEditor } from './TransformEditor'

const KINDS: [TransformKind, string][] = [
  ['rotate', 'Rotate'],
  ['scale', 'Scale'],
  ['shear', 'Shear'],
  ['ill', 'Ill-conditioned'],
]

export function ControlsWindow({ lab }: { lab: TransformLab }) {
  const {
    kind, setKind, stage, setStage, showTransform, compact, setCompact,
    setControlsOpen, kappa, shownMatrix, shearPlane, illAxis,
  } = lab

  const hint =
    kind === 'shear'
      ? `${shearPlane.toUpperCase()}: first axis is offset in proportion to the second.`
      : kind === 'ill'
        ? `The ${illAxis.toUpperCase()} axis is scaled by ε; smaller ε drives the matrix toward singularity.`
        : 'Tap a value for precision; use the slider for exploration.'

  return (
    <aside className={`window controls-window ${compact ? 'compact' : 'expanded'}`}>
      <header className="window-titlebar">
        <div className="window-heading">
          <span className="window-kicker">seam-render</span>
          <strong>Transform</strong>
        </div>
        <div className="window-actions">
          <span className={`kappa-badge ${kappa > 100 ? 'warning' : ''}`}>κ {kappa.toExponential(1)}</span>
          <button className="compact-toggle" onClick={() => setCompact((v) => !v)}>{compact ? 'Details' : 'Mini'}</button>
          <button className="icon-button" onClick={() => setControlsOpen(false)}>−</button>
        </div>
      </header>
      <div className="controls-body">
        <div className="transform-tabs">
          {KINDS.map(([key, label]) => (
            <button key={key} className={kind === key ? 'active' : ''} onClick={() => { setKind(key); showTransform() }}>
              {label}
            </button>
          ))}
        </div>
        <TransformEditor lab={lab} />
        <div className="field state-field">
          <span>State</span>
          <div className="segmented">
            {STAGE_NAMES.map((name, index) => (
              <button key={name} className={stage === index ? 'active' : ''} onClick={() => setStage(index as Stage)}>
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="verbose-only">
          <div className="status-row">
            <span>condition number κ₂(X)</span>
            <strong className={kappa > 100 ? 'warning' : ''}>{kappa.toExponential(3)}</strong>
          </div>
          <div className="matrix-card">
            <div className="matrix-title">{stage === 0 ? 'I' : stage === 1 ? 'X' : 'X⁻¹'}</div>
            <MatrixReadout matrix={shownMatrix} />
          </div>
          <p className="hint">{hint}</p>
        </div>
      </div>
    </aside>
  )
}
