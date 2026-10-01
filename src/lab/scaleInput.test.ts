import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createScaleInput, editScaleInput } from './scaleInput.ts'

const initial = () => createScaleInput({ x: 1.7, y: 1, z: 0.55 })

describe('scale input recovery', () => {
  for (const raw of ['', '0', '-0', 'NaN', 'Infinity', '1e-30', '1e309']) {
    it(`keeps the last valid transform for ${JSON.stringify(raw)}`, () => {
      const previous = initial()
      const next = editScaleInput(previous, 'x', raw)
      assert.equal(next.draft.x, raw)
      assert.equal(next.value, previous.value)
      assert.ok(next.error)
    })
  }

  it('accepts negative nonzero scale and clears the error after correction', () => {
    const invalid = editScaleInput(initial(), 'x', '')
    const corrected = editScaleInput(invalid, 'x', '-2')
    assert.equal(corrected.error, null)
    assert.deepEqual(corrected.value, { x: -2, y: 1, z: 0.55 })
  })

  it('waits until all draft axes are valid before applying them', () => {
    const previous = initial()
    const blank = editScaleInput(previous, 'x', '')
    const pending = editScaleInput(blank, 'y', '3')
    assert.equal(pending.value, previous.value)
    assert.ok(pending.error)
    const corrected = editScaleInput(pending, 'x', '2')
    assert.equal(corrected.error, null)
    assert.deepEqual(corrected.value, { x: 2, y: 3, z: 0.55 })
  })

  it('restores all drafts to the last accepted values', () => {
    const accepted = editScaleInput(initial(), 'x', '2')
    const invalid = editScaleInput(accepted, 'y', '0')
    const restored = createScaleInput(invalid.value)
    assert.deepEqual(restored.draft, { x: '2', y: '1', z: '0.55' })
    assert.equal(restored.error, null)
    assert.equal(restored.value, accepted.value)
  })

  it('rejects a combined scale that is too close to singular', () => {
    let state = editScaleInput(initial(), 'x', '1e-7')
    state = editScaleInput(state, 'y', '1e-7')
    const invalid = editScaleInput(state, 'z', '1e-7')
    assert.equal(invalid.value, state.value)
    assert.ok(invalid.error)
  })
})
