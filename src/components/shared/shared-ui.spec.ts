import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mapBookingValidationToMessages } from './sharedUi'
import type { BookingValidationResult } from '../../domain/booking'

describe('mapBookingValidationToMessages()', () => {
  it('returns empty errors when validation is undefined', () => {
    const messages = mapBookingValidationToMessages(undefined)

    assert.deepEqual(messages, {
      fieldErrors: {},
      generalErrors: [],
    })
  })

  it('preserves field errors from validation results', () => {
    const validation: BookingValidationResult = {
      isValid: false,
      fieldErrors: {
        contactPhone: '联系电话格式必须为 11 位手机号。',
      },
      generalErrors: [],
    }

    const messages = mapBookingValidationToMessages(validation)

    assert.equal(messages.fieldErrors.contactPhone, '联系电话格式必须为 11 位手机号。')
  })

  it('preserves general errors from validation results', () => {
    const validation: BookingValidationResult = {
      isValid: false,
      fieldErrors: {},
      generalErrors: ['预约时间冲突：2026-03-30 09:00-11:00 已存在预约《晨会》。'],
    }

    const messages = mapBookingValidationToMessages(validation)

    assert.equal(messages.generalErrors[0], '预约时间冲突：2026-03-30 09:00-11:00 已存在预约《晨会》。')
  })
})
