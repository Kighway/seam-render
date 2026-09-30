import type { WheelEvent } from 'react'
import { SHEAR_PLANES, type Axis } from '../math'
import type { TransformLab } from '../lab/useTransformLab'
import { AxisButtons } from './AxisButtons'

export function TransformEditor({ lab }: { lab: TransformLab }) {
  const {
    kind, rotationAxis, setRotationAxis, angle, setAngle,
    scale, setScale, shearPlane, setShearPlane, shear, setShear,
    illAxis, setIllAxis, epsilon, setEpsilon, showTransform,
  } = lab

  const wheelAngle = (e: WheelEvent<HTMLInputElement>) => {
    e.preventDefault()
    setAngle((v) => Math.max(-180, Math.min(180, v + (e.deltaY < 0 ? 1 : -1))))
    showTransform()
  }

  return (
    <div className="transform-editor">
      {kind === 'rotate' && (
        <>
          <div className="editor-row">
            <span>Axis</span>
            <AxisButtons axis={rotationAxis} onChange={(a) => { setRotationAxis(a); showTransform() }} />
          </div>
          <div className="editor-row">
            <span>Angle</span>
            <div className="number-unit">
              <input type="number" value={angle} min={-180} max={180} step={1} onWheel={wheelAngle} onChange={(e) => { setAngle(Number(e.target.value)); showTransform() }} />
              <b>°</b>
            </div>
          </div>
          <input className="range" type="range" min={-180} max={180} step={1} value={angle} onChange={(e) => { setAngle(Number(e.target.value)); showTransform() }} />
        </>
      )}
      {kind === 'scale' && (
        <div className="xyz-grid">
          {(['x', 'y', 'z'] as Axis[]).map((a) => (
            <label key={a}>
              <span>{a.toUpperCase()}</span>
              <input type="number" step="0.05" value={scale[a]} onChange={(e) => { setScale({ ...scale, [a]: Number(e.target.value) }); showTransform() }} />
            </label>
          ))}
        </div>
      )}
      {kind === 'shear' && (
        <>
          <div className="editor-row">
            <span>Plane</span>
            <select value={shearPlane} onChange={(e) => { setShearPlane(e.target.value as typeof shearPlane); showTransform() }}>
              {SHEAR_PLANES.map((p) => (
                <option key={p} value={p}>{p.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="editor-row">
            <span>Amount</span>
            <input type="number" step="0.05" value={shear} onChange={(e) => { setShear(Number(e.target.value)); showTransform() }} />
          </div>
          <input className="range" type="range" min={-2} max={2} step={0.05} value={shear} onChange={(e) => { setShear(Number(e.target.value)); showTransform() }} />
        </>
      )}
      {kind === 'ill' && (
        <>
          <div className="editor-row">
            <span>Weak axis</span>
            <AxisButtons axis={illAxis} onChange={(a) => { setIllAxis(a); showTransform() }} />
          </div>
          <div className="editor-row">
            <span>ε</span>
            <input type="number" min="0.00000001" max="1" step="0.0001" value={epsilon} onChange={(e) => { setEpsilon(Number(e.target.value)); showTransform() }} />
          </div>
          <input
            className="range logarithmic"
            type="range"
            min={1}
            max={8}
            step={0.05}
            value={-Math.log10(Math.max(1e-8, epsilon))}
            onChange={(e) => { setEpsilon(Math.pow(10, -Number(e.target.value))); showTransform() }}
          />
        </>
      )}
    </div>
  )
}
