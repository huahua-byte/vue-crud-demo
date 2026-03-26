import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { expandTimeRange, isFutureBookingDateTime } from './date'

describe('expandTimeRange()', () => {
  it('returns each occupied hour slot for a valid continuous range', () => {
    assert.deepEqual(expandTimeRange('09:00', '12:00'), ['09:00', '10:00', '11:00'])
  })

  it('returns five slots for a continuous multi-hour booking', () => {
    assert.deepEqual(expandTimeRange('08:00', '13:00'), ['08:00', '09:00', '10:00', '11:00', '12:00'])
  })

  it('returns an empty array for non-full-hour ranges', () => {
    assert.deepEqual(expandTimeRange('09:30', '12:00'), [])
    assert.deepEqual(expandTimeRange('09:00', '10:30'), [])
  })

  it('returns an empty array for zero-length or reversed ranges', () => {
    assert.deepEqual(expandTimeRange('09:00', '09:00'), [])
    assert.deepEqual(expandTimeRange('12:00', '09:00'), [])
  })
})

describe('isFutureBookingDateTime()', () => {
  it('treats a later booking slot as future relative to a fixed current time', () => {
    assert.equal(isFutureBookingDateTime('2026-03-30', '09:00', '2026-03-26T08:00:00.000Z'), true)
  })

  it('treats the same booking slot as not future when the timestamps are equal', () => {
    assert.equal(isFutureBookingDateTime('2026-03-30', '09:00', '2026-03-30T09:00:00.000Z'), false)
  })
})
