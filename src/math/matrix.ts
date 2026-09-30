import type { Mat4 } from './types.ts'

export const IDENTITY: Mat4 = Float64Array.from([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]) as Mat4

export function mat4(elements?: ArrayLike<number>): Mat4 {
  const out = new Float64Array(16) as Mat4
  if (elements) {
    if (elements.length !== 16) throw new Error('Mat4 needs 16 elements')
    out.set(elements)
  } else {
    out.set(IDENTITY)
  }
  return out
}

/** Row-major constructor, same argument order as three.Matrix4.set. */
export function mat4FromRows(
  n11: number, n12: number, n13: number, n14: number,
  n21: number, n22: number, n23: number, n24: number,
  n31: number, n32: number, n33: number, n34: number,
  n41: number, n42: number, n43: number, n44: number,
): Mat4 {
  return mat4([
    n11, n21, n31, n41,
    n12, n22, n32, n42,
    n13, n23, n33, n43,
    n14, n24, n34, n44,
  ])
}

export function cloneMat4(m: Mat4): Mat4 {
  return mat4(m)
}

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const ae = a, be = b
  const out = new Float64Array(16) as Mat4
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        ae[row] * be[col * 4] +
        ae[4 + row] * be[col * 4 + 1] +
        ae[8 + row] * be[col * 4 + 2] +
        ae[12 + row] * be[col * 4 + 3]
    }
  }
  return out
}

export function determinant(m: Mat4): number {
  const n11 = m[0], n21 = m[1], n31 = m[2], n41 = m[3]
  const n12 = m[4], n22 = m[5], n32 = m[6], n42 = m[7]
  const n13 = m[8], n23 = m[9], n33 = m[10], n43 = m[11]
  const n14 = m[12], n24 = m[13], n34 = m[14], n44 = m[15]
  return (
    n14 * n23 * n32 * n41 - n13 * n24 * n32 * n41 - n14 * n22 * n33 * n41 + n12 * n24 * n33 * n41 +
    n13 * n22 * n34 * n41 - n12 * n23 * n34 * n41 - n14 * n23 * n31 * n42 + n13 * n24 * n31 * n42 +
    n14 * n21 * n33 * n42 - n11 * n24 * n33 * n42 - n13 * n21 * n34 * n42 + n11 * n23 * n34 * n42 +
    n14 * n22 * n31 * n43 - n12 * n24 * n31 * n43 - n14 * n21 * n32 * n43 + n11 * n24 * n32 * n43 +
    n12 * n21 * n34 * n43 - n11 * n22 * n34 * n43 - n13 * n22 * n31 * n44 + n12 * n23 * n31 * n44 +
    n13 * n21 * n32 * n44 - n11 * n23 * n32 * n44 - n12 * n21 * n33 * n44 + n11 * n22 * n33 * n44
  )
}

export function invert(m: Mat4): Mat4 {
  const n11 = m[0], n21 = m[1], n31 = m[2], n41 = m[3]
  const n12 = m[4], n22 = m[5], n32 = m[6], n42 = m[7]
  const n13 = m[8], n23 = m[9], n33 = m[10], n43 = m[11]
  const n14 = m[12], n24 = m[13], n34 = m[14], n44 = m[15]

  const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44
  const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44
  const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44
  const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34

  const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14
  if (Math.abs(det) < 1e-18) throw new Error('singular matrix')
  const invDet = 1 / det

  return mat4([
    t11 * invDet,
    (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * invDet,
    (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * invDet,
    (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * invDet,
    t12 * invDet,
    (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * invDet,
    (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * invDet,
    (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * invDet,
    t13 * invDet,
    (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * invDet,
    (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * invDet,
    (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * invDet,
    t14 * invDet,
    (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * invDet,
    (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * invDet,
    (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * invDet,
  ])
}

export function frobenius(a: Mat4, b: Mat4): number {
  let s = 0
  for (let i = 0; i < 16; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return Math.sqrt(s)
}

export function linear3(m: Mat4): number[][] {
  return [
    [m[0], m[4], m[8]],
    [m[1], m[5], m[9]],
    [m[2], m[6], m[10]],
  ]
}

export function formatMatrixRows(m: Mat4): string[] {
  const rows = [
    [m[0], m[4], m[8], m[12]],
    [m[1], m[5], m[9], m[13]],
    [m[2], m[6], m[10], m[14]],
    [m[3], m[7], m[11], m[15]],
  ]
  return rows.map((row) => `[ ${row.map((v) => v.toFixed(3).padStart(7)).join(' ')} ]`)
}
