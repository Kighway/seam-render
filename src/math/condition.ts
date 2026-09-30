import { linear3 } from './matrix.ts'
import type { Mat4 } from './types.ts'

/** κ₂ of the linear 3×3 part: σ_max / σ_min via Jacobi on AᵀA. */
export function conditionNumber(matrix: Mat4): number {
  const rows = linear3(matrix)
  const ata = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0)),
  )
  for (let n = 0; n < 20; n++) {
    let p = 0, q = 1
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]] as const) {
      if (Math.abs(ata[i][j]) > Math.abs(ata[p][q])) [p, q] = [i, j]
    }
    if (Math.abs(ata[p][q]) < 1e-15) break
    const theta = 0.5 * Math.atan2(2 * ata[p][q], ata[q][q] - ata[p][p])
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    const app = c * c * ata[p][p] - 2 * s * c * ata[p][q] + s * s * ata[q][q]
    const aqq = s * s * ata[p][p] + 2 * s * c * ata[p][q] + c * c * ata[q][q]
    for (let k = 0; k < 3; k++) {
      if (k !== p && k !== q) {
        const apk = c * ata[p][k] - s * ata[q][k]
        const aqk = s * ata[p][k] + c * ata[q][k]
        ata[p][k] = ata[k][p] = apk
        ata[q][k] = ata[k][q] = aqk
      }
    }
    ata[p][p] = app
    ata[q][q] = aqq
    ata[p][q] = ata[q][p] = 0
  }
  const eigen = [ata[0][0], ata[1][1], ata[2][2]].map((v) => Math.max(0, v)).sort((a, b) => a - b)
  if (eigen[0] === 0) return Number.POSITIVE_INFINITY
  return Math.sqrt(eigen[2] / eigen[0])
}
