import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IDENTITY, determinant, frobenius, invert, multiply } from './matrix.ts'
import { AXES, SHEAR_PLANES, buildTransform, rotationMatrix, scaleMatrix, shearMatrix, stageMatrix } from './transforms.ts'

const closeToI = (m: ReturnType<typeof multiply>) => {
  assert.ok(frobenius(m, IDENTITY) < 1e-12)
}

describe('rotationMatrix', () => {
  it('is orthogonal with det 1', () => {
    for (const axis of AXES) {
      const r = rotationMatrix(axis, 37)
      assert.ok(Math.abs(determinant(r) - 1) < 1e-12)
      closeToI(multiply(r, invert(r)))
    }
  })

  it('360° is identity', () => {
    for (const axis of AXES) closeToI(rotationMatrix(axis, 360))
  })

  it('90° about Z sends e1 toward e2', () => {
    const r = rotationMatrix('z', 90)
    assert.ok(Math.abs(r[0]) < 1e-12)
    assert.ok(Math.abs(r[1] - 1) < 1e-12)
  })
})

describe('scaleMatrix', () => {
  it('places the factors on the diagonal', () => {
    const s = scaleMatrix({ x: 2, y: 3, z: 4 })
    assert.equal(s[0], 2)
    assert.equal(s[5], 3)
    assert.equal(s[10], 4)
    assert.equal(s[15], 1)
    assert.ok(Math.abs(determinant(s) - 24) < 1e-12)
  })
})

describe('shearMatrix', () => {
  for (const plane of SHEAR_PLANES) {
    it(`${plane} has unit det and inverts`, () => {
      const s = shearMatrix(plane, 0.85)
      assert.ok(Math.abs(determinant(s) - 1) < 1e-12)
      closeToI(multiply(s, invert(s)))
    })
  }

  it('xy offsets x by k y', () => {
    const s = shearMatrix('xy', 0.5)
    assert.equal(s[0], 1)
    assert.equal(s[4], 0.5)
    assert.equal(s[1], 0)
    assert.equal(s[5], 1)
  })

  it('plane option keys stay lowercase', () => {
    assert.deepEqual([...SHEAR_PLANES], ['xy', 'xz', 'yx', 'yz', 'zx', 'zy'])
  })
})

describe('buildTransform', () => {
  it('dispatches each kind', () => {
    assert.deepEqual(
      [...buildTransform({ kind: 'rotate', axis: 'y', degrees: 0 })],
      [...rotationMatrix('y', 0)],
    )
    assert.equal(buildTransform({ kind: 'scale', scale: { x: 1.7, y: 1, z: 0.55 } })[0], 1.7)
    assert.equal(buildTransform({ kind: 'shear', plane: 'xy', amount: 0.85 })[4], 0.85)
    assert.equal(buildTransform({ kind: 'ill', axis: 'z', epsilon: 0.0001 })[10], 0.0001)
  })

  it('clamps ill epsilon to 1e-8', () => {
    assert.equal(buildTransform({ kind: 'ill', axis: 'x', epsilon: 0 })[0], 1e-8)
  })
})

describe('stageMatrix', () => {
  it('selects I / X / X⁻¹', () => {
    const x = scaleMatrix({ x: 2, y: 1, z: 1 })
    const inv = invert(x)
    assert.deepEqual([...stageMatrix(0, x, inv)], [...IDENTITY])
    assert.deepEqual([...stageMatrix(1, x, inv)], [...x])
    assert.deepEqual([...stageMatrix(2, x, inv)], [...inv])
  })
})
