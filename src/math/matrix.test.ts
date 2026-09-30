import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IDENTITY, cloneMat4, determinant, formatMatrixRows, frobenius, invert, mat4, mat4FromRows, multiply } from './matrix.ts'

describe('mat4', () => {
  it('defaults to identity', () => {
    assert.deepEqual([...mat4()], [...IDENTITY])
  })

  it('stores set() row-major args as column-major elements', () => {
    const m = mat4FromRows(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
    assert.deepEqual([...m], [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16])
  })

  it('rejects the wrong length', () => {
    assert.throws(() => mat4([1, 2, 3]), /16/)
  })
})

describe('multiply / invert', () => {
  it('I I = I', () => {
    assert.equal(frobenius(multiply(IDENTITY, IDENTITY), IDENTITY), 0)
  })

  it('inverts a general affine matrix', () => {
    const x = mat4FromRows(2, 0.4, 0, 0, 0, 1.5, 0.2, 0, 0, 0, 0.8, 0, 0, 0, 0, 1)
    const inv = invert(x)
    assert.ok(frobenius(multiply(x, inv), IDENTITY) < 1e-12)
    assert.ok(frobenius(multiply(inv, x), IDENTITY) < 1e-12)
    assert.ok(Math.abs(determinant(x) * determinant(inv) - 1) < 1e-10)
  })

  it('throws on a singular matrix', () => {
    const singular = mat4FromRows(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
    assert.throws(() => invert(singular), /singular/)
  })

  it('clone is a copy', () => {
    const a = mat4FromRows(1, 2, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
    const b = cloneMat4(a)
    a[0] = 99
    assert.equal(b[0], 1)
  })
})

describe('formatMatrixRows', () => {
  it('prints identity rows', () => {
    assert.match(formatMatrixRows(IDENTITY).join('\n'), /\[   1\.000/)
  })
})
