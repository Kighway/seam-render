import { AXES, type Axis } from '../math/index.ts'

export function AxisButtons({ axis, onChange }: { axis: Axis; onChange: (axis: Axis) => void }) {
  return (
    <div className="axis-buttons">
      {AXES.map((a) => (
        <button key={a} className={axis === a ? 'active' : ''} onClick={() => onChange(a)}>
          {a.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
