import { determinant, invert } from '../math/matrix.ts'
import { scaleMatrix } from '../math/transforms.ts'
import type { Axis, Vec3Scale } from '../math/types.ts'

export type ScaleInputState = {
  draft: Record<Axis, string>
  value: Vec3Scale
  error: string | null
}

export function createScaleInput(value: Vec3Scale): ScaleInputState {
  return {
    draft: { x: String(value.x), y: String(value.y), z: String(value.z) },
    value,
    error: null,
  }
}

/** Keep incomplete edits separate from the last invertible transform. */
export function editScaleInput(state: ScaleInputState, axis: Axis, raw: string): ScaleInputState {
  const draft = { ...state.draft, [axis]: raw }
  const value: Vec3Scale = { x: Number(draft.x), y: Number(draft.y), z: Number(draft.z) }

  for (const a of ['x', 'y', 'z'] as const) {
    if (draft[a].trim() === '' || !Number.isFinite(value[a])) {
      return { ...state, draft, error: `Enter a finite number for ${a.toUpperCase()} scale.` }
    }
    if (value[a] === 0) {
      return { ...state, draft, error: `${a.toUpperCase()} scale cannot be zero because it cannot be inverted.` }
    }
  }

  try {
    const matrix = scaleMatrix(value)
    if (!Number.isFinite(determinant(matrix)) || !invert(matrix).every(Number.isFinite)) {
      throw new Error('unstable scale')
    }
  } catch {
    return { ...state, draft, error: 'These scale values cannot be safely inverted. Try values closer to 1.' }
  }

  return { draft, value, error: null }
}
