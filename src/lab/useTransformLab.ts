import { useMemo, useState } from 'react'
import {
  IDENTITY,
  buildTransform,
  conditionNumber,
  invert,
  multiply,
  type Axis,
  type ShearPlane,
  type Stage,
  type TransformKind,
  type Vec3Scale,
} from '../math'

export function useTransformLab() {
  const [stage, setStage] = useState<Stage>(0)
  const [kind, setKind] = useState<TransformKind>('rotate')
  const [rotationAxis, setRotationAxis] = useState<Axis>('y')
  const [angle, setAngle] = useState(45)
  const [scale, setScale] = useState<Vec3Scale>({ x: 1.7, y: 1, z: 0.55 })
  const [shearPlane, setShearPlane] = useState<ShearPlane>('xy')
  const [shear, setShear] = useState(0.85)
  const [illAxis, setIllAxis] = useState<Axis>('z')
  const [epsilon, setEpsilon] = useState(0.0001)
  const [compact, setCompact] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [renderOpen, setRenderOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const showTransform = () => setStage(1)

  const transform = useMemo(() => {
    if (kind === 'rotate') return buildTransform({ kind, axis: rotationAxis, degrees: angle })
    if (kind === 'scale') return buildTransform({ kind, scale })
    if (kind === 'shear') return buildTransform({ kind, plane: shearPlane, amount: shear })
    return buildTransform({ kind: 'ill', axis: illAxis, epsilon })
  }, [kind, rotationAxis, angle, scale, shearPlane, shear, illAxis, epsilon])

  const inverse = useMemo(() => invert(transform), [transform])
  const restored = useMemo(() => multiply(transform, inverse), [transform, inverse])
  const targets = useMemo(() => [IDENTITY, transform, restored] as const, [transform, restored])
  const shownMatrix = stage === 0 ? IDENTITY : stage === 1 ? transform : inverse
  const kappa = useMemo(() => conditionNumber(transform), [transform])

  return {
    stage, setStage, showTransform,
    kind, setKind,
    rotationAxis, setRotationAxis,
    angle, setAngle,
    scale, setScale,
    shearPlane, setShearPlane,
    shear, setShear,
    illAxis, setIllAxis,
    epsilon, setEpsilon,
    compact, setCompact,
    controlsOpen, setControlsOpen,
    renderOpen, setRenderOpen,
    menuOpen, setMenuOpen,
    transform, inverse, restored, targets, shownMatrix, kappa,
  }
}

export type TransformLab = ReturnType<typeof useTransformLab>
