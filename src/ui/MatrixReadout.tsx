import { formatMatrixRows, type Mat4 } from '../math/index.ts'

export function MatrixReadout({ matrix }: { matrix: Mat4 }) {
  return <pre className="matrix-readout">{formatMatrixRows(matrix).join('\n')}</pre>
}
