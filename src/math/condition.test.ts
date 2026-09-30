import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { conditionNumber } from './condition.ts'
import { IDENTITY } from './matrix.ts'
import { illMatrix, rotationMatrix, scaleMatrix, shearMatrix } from './transforms.ts'

describe('conditionNumber', () => {
  it('is 1 for identity and rotation', () => {
    assert.ok(Math.abs(conditionNumber(IDENTITY) - 1) < 1e-10)
    assert.ok(Math.abs(conditionNumber(rotationMatrix('y', 45)) - 1) < 1e-10)
  })

  it('is σmax/σmin for a diagonal scale', () => {
    const s = scaleMatrix({ x: 2, y: 1, z: 0.5 })
    assert.ok(Math.abs(conditionNumber(s) - 4) < 1e-8)
  })

  it('grows as the weak axis shrinks', () => {
    const mild = conditionNumber(illMatrix('z', 0.1))
    const sharp = conditionNumber(illMatrix('z', 1e-4))
    assert.ok(sharp > mild)
    assert.ok(sharp > 100)
  })

  it('stays modest for a unit-det shear', () => {
    const kappa = conditionNumber(shearMatrix('xy', 0.85))
    assert.ok(kappa > 1)
    assert.ok(kappa < 10)
  })
})
