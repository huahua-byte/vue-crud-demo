import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  assertVenueCanDelete,
  findBookingConflict,
  hasFutureVenueBookings,
  validateBookingDraft,
  validateVenueDraft,
} from './rules'
import type { Booking, BookingDraft, VenueDraft } from './types'

function createBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    venueId: 'venue-1',
    title: 'Team Workshop',
    contactName: 'Alex Chen',
    contactPhone: '13800000000',
    date: '2026-03-30',
    startTime: '09:00',
    endTime: '11:00',
    attendeeCount: 24,
    status: 'confirmed',
    notes: 'Need microphone support',
    createdAt: '2026-03-26T08:30:00.000Z',
    updatedAt: '2026-03-26T08:30:00.000Z',
    ...overrides,
  }
}

function createDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    venueId: 'venue-1',
    title: 'Morning Workshop',
    contactName: 'Alex Chen',
    contactPhone: '13800000000',
    date: '2026-03-30',
    startTime: '09:00',
    endTime: '11:00',
    attendeeCount: 20,
    notes: 'Need projector support',
    ...overrides,
  }
}

function createVenueDraft(overrides: Partial<VenueDraft> = {}): VenueDraft {
  return {
    name: 'Main Hall',
    location: '1F East Wing',
    capacity: 120,
    hourlyPrice: 300,
    amenities: ['projector', 'sound-system'],
    openingTime: '08:00',
    closingTime: '22:00',
    status: 'active',
    description: 'Primary event venue with full AV support.',
    ...overrides,
  }
}

describe('validateBookingDraft()', () => {
  it('rejects booking slots outside business hours', () => {
    const validation = validateBookingDraft(createDraft({ startTime: '07:00', endTime: '09:00' }))

    assert.equal(validation.isValid, false)
    assert.equal(validation.fieldErrors.startTime, '预约时间仅支持 08:00-22:00 的整点时段。')
  })

  it('rejects non-full-hour booking ranges', () => {
    const validation = validateBookingDraft(createDraft({ startTime: '09:30', endTime: '10:30' }))

    assert.equal(validation.isValid, false)
    assert.equal(validation.fieldErrors.startTime, '预约时间仅支持 08:00-22:00 的整点时段。')
    assert.equal(validation.fieldErrors.endTime, '预约时间必须为连续且结束时间晚于开始时间的整点时段。')
  })

  it('rejects ranges whose end time is not later than the start time', () => {
    const validation = validateBookingDraft(createDraft({ startTime: '11:00', endTime: '10:00' }))

    assert.equal(validation.isValid, false)
    assert.equal(validation.fieldErrors.endTime, '预约时间必须为连续且结束时间晚于开始时间的整点时段。')
  })
})

describe('validateVenueDraft()', () => {
  it('requires venue name', () => {
    const validation = validateVenueDraft(createVenueDraft({ name: '   ' }))

    assert.equal(validation.isValid, false)
    assert.equal(validation.fieldErrors.name, '请输入场地名称。')
  })

  it('rejects zero capacity', () => {
    const validation = validateVenueDraft(createVenueDraft({ capacity: 0 }))

    assert.equal(validation.isValid, false)
    assert.equal(validation.fieldErrors.capacity, '容纳人数必须为大于 0 的整数。')
  })

  it('rejects negative hourly prices', () => {
    const validation = validateVenueDraft(createVenueDraft({ hourlyPrice: -1 }))

    assert.equal(validation.isValid, false)
    assert.equal(validation.fieldErrors.hourlyPrice, '每小时价格必须为大于等于 0 的整数。')
  })

  it('accepts a valid venue draft', () => {
    const validation = validateVenueDraft(createVenueDraft())

    assert.equal(validation.isValid, true)
    assert.deepEqual(validation.fieldErrors, {})
  })
})

describe('findBookingConflict()', () => {
  it('returns the conflicting booking for overlapping ranges', () => {
    const existingBooking = createBooking()

    const conflict = findBookingConflict([existingBooking], {
      id: 'booking-2',
      venueId: 'venue-1',
      date: '2026-03-30',
      startTime: '10:00',
      endTime: '12:00',
    })

    assert.equal(conflict?.id, existingBooking.id)
  })

  it('allows adjacent bookings that only touch at their boundaries', () => {
    const conflict = findBookingConflict([createBooking()], {
      id: 'booking-2',
      venueId: 'venue-1',
      date: '2026-03-30',
      startTime: '11:00',
      endTime: '12:00',
    })

    assert.equal(conflict, null)
  })

  it('ignores bookings from other venues or dates', () => {
    const bookings = [
      createBooking(),
      createBooking({
        id: 'booking-2',
        venueId: 'venue-2',
        date: '2026-03-30',
        startTime: '10:00',
        endTime: '12:00',
      }),
      createBooking({
        id: 'booking-3',
        venueId: 'venue-1',
        date: '2026-03-31',
        startTime: '10:00',
        endTime: '12:00',
      }),
    ]

    const differentVenueConflict = findBookingConflict(bookings, {
      id: 'booking-4',
      venueId: 'venue-2',
      date: '2026-03-31',
      startTime: '09:00',
      endTime: '11:00',
    })

    const differentDateConflict = findBookingConflict(bookings, {
      id: 'booking-5',
      venueId: 'venue-1',
      date: '2026-04-01',
      startTime: '09:00',
      endTime: '11:00',
    })

    assert.equal(differentVenueConflict, null)
    assert.equal(differentDateConflict, null)
  })
})

describe('hasFutureVenueBookings()', () => {
  it('detects future bookings for the selected venue', () => {
    assert.equal(
      hasFutureVenueBookings([createBooking()], 'venue-1', '2026-03-26T08:00:00.000Z'),
      true,
    )
  })

  it('ignores historical bookings and bookings from other venues', () => {
    const bookings = [
      createBooking({ date: '2026-03-20' }),
      createBooking({ id: 'booking-2', venueId: 'venue-2' }),
    ]

    assert.equal(hasFutureVenueBookings(bookings, 'venue-1', '2026-03-26T08:00:00.000Z'), false)
  })
})

describe('assertVenueCanDelete()', () => {
  it('throws the business protection message when a venue has future bookings', () => {
    assert.throws(
      () => assertVenueCanDelete([createBooking()], 'venue-1', '2026-03-26T08:00:00.000Z'),
      new Error('当前场地存在未来预约，删除前请先处理相关预约。'),
    )
  })

  it('allows deleting venues that only have historical bookings', () => {
    assert.doesNotThrow(() =>
      assertVenueCanDelete([createBooking({ date: '2026-03-20' })], 'venue-1', '2026-03-26T08:00:00.000Z'),
    )
  })
})
