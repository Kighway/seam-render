import { IDENTITY, mat4, mat4FromRows } from './matrix.ts'
import type { Axis, Mat4, ShearPlane, TransformSpec, Vec3Scale } from './types.ts'

export function rotationMatrix(axis: Axis, degrees: number): Mat4 {
  const r = degrees * Math.PI / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  if (axis === 'x') return mat4FromRows(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1)
  if (axis === 'y') return mat4FromRows(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1)
  return mat4FromRows(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
}

export function scaleMatrix(scale: Vec3Scale): Mat4 {
  return mat4FromRows(scale.x, 0, 0, 0, 0, scale.y, 0, 0, 0, 0, scale.z, 0, 0, 0, 0, 1)
}

/** First letter is the offset axis; second is the driving axis. */
export function shearMatrix(plane: ShearPlane, amount: number): Mat4 {
  const values: Record<ShearPlane, Parameters<typeof mat4FromRows>> = {
    xy: [1, amount, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    xz: [1, 0, amount, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    yx: [1, 0, 0, 0, amount, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    yz: [1, 0, 0, 0, 0, 1, amount, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    zx: [1, 0, 0, 0, 0, 1, 0, 0, amount, 0, 1, 0, 0, 0, 0, 1],
    zy: [1, 0, 0, 0, 0, 1, 0, 0, 0, amount, 1, 0, 0, 0, 0, 1],
  }
  return mat4FromRows(...values[plane])
}

export function illMatrix(axis: Axis, epsilon: number): Mat4 {
  const s: Vec3Scale = { x: 1, y: 1, z: 1 }
  s[axis] = Math.max(1e-8, epsilon)
  return scaleMatrix(s)
}

export function buildTransform(spec: TransformSpec): Mat4 {
  switch (spec.kind) {
    case 'rotate':
      return rotationMatrix(spec.axis, spec.degrees)
    case 'scale':
      return scaleMatrix(spec.scale)
    case 'shear':
      return shearMatrix(spec.plane, spec.amount)
    case 'ill':
      return illMatrix(spec.axis, spec.epsilon)
  }
}

export function stageMatrix(stage: 0 | 1 | 2, transform: Mat4, inverse: Mat4): Mat4 {
  if (stage === 0) return mat4(IDENTITY)
  if (stage === 1) return mat4(transform)
  return mat4(inverse)
}

export const SHEAR_PLANES: ShearPlane[] = ['xy', 'xz', 'yx', 'yz', 'zx', 'zy']
export const AXES: Axis[] = ['x', 'y', 'z']
export const STAGE_NAMES = ['Original', 'Transformed', 'Restored'] as const
