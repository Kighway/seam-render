export type Axis = 'x' | 'y' | 'z'
export type ShearPlane = 'xy' | 'xz' | 'yx' | 'yz' | 'zx' | 'zy'
export type TransformKind = 'rotate' | 'scale' | 'shear' | 'ill'
export type Stage = 0 | 1 | 2

/** Column-major 4×4, matching three.js Matrix4.elements. */
export type Mat4 = Float64Array & { readonly length: 16 }

export type Vec3Scale = { x: number; y: number; z: number }

export type TransformSpec =
  | { kind: 'rotate'; axis: Axis; degrees: number }
  | { kind: 'scale'; scale: Vec3Scale }
  | { kind: 'shear'; plane: ShearPlane; amount: number }
  | { kind: 'ill'; axis: Axis; epsilon: number }
