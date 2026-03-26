import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { useBookingStore } from './useBookingStore'
import { STORAGE_KEYS, type AppSeedMeta, type Booking, type BookingDraft, type Venue, type VenueDraft } from '../domain/booking'
import { getWeeklyCalendar } from '../services/booking'

class MemoryStorage {
  #map = new Map<string, string>()

  clear(): void {
    this.#map.clear()
  }

  getItem(key: string): string | null {
    return this.#map.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#map.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#map.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#map.set(key, value)
  }

  get length(): number {
    return this.#map.size
  }
}

const localStorageStub = new MemoryStorage()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageStub,
})

function createVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: 'venue-1',
    name: 'Main Hall',
    location: '1F East Wing',
    capacity: 120,
    hourlyPrice: 300,
    amenities: ['projector', 'sound-system'],
    openingTime: '08:00',
    closingTime: '22:00',
    status: 'active',
    description: 'Primary event venue with full AV support.',
    createdAt: '2026-03-26T08:00:00.000Z',
    updatedAt: '2026-03-26T08:00:00.000Z',
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

function createBookingDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
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

function createBooking(overrides: Partial<Booking> = {}): Booking {
  const draft = createBookingDraft()

  return {
    id: 'booking-1',
    venueId: draft.venueId,
    venueNameSnapshot: 'Main Hall',
    title: draft.title,
    contactName: draft.contactName,
    contactPhone: draft.contactPhone,
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    attendeeCount: draft.attendeeCount,
    status: 'confirmed',
    notes: draft.notes,
    createdAt: '2026-03-26T08:30:00.000Z',
    updatedAt: '2026-03-26T08:30:00.000Z',
    ...overrides,
  }
}

function resetStoreState(): void {
  const store = useBookingStore()
  const seedMeta: AppSeedMeta = {
    version: '1.0.0',
    seededAt: '2026-03-26T08:00:00.000Z',
    venueCount: 2,
    bookingCount: 0,
  }

  store.venues.value = [
    createVenue(),
    createVenue({ id: 'venue-2', name: 'Riverside Studio', openingTime: '09:00', closingTime: '20:00' }),
  ]
  store.bookings.value = []
  store.seedMeta.value = seedMeta
  store.initialized.value = true
}

beforeEach(() => {
  localStorageStub.clear()
  resetStoreState()
})

describe('useBookingStore().createBooking()', () => {
  it('creates a booking and persists it to localStorage immediately', () => {
    const store = useBookingStore()

    const result = store.createBooking(
      createBookingDraft({
        date: '2026-03-30',
        startTime: '10:00',
        endTime: '12:00',
      }),
    )

    assert.equal(result.ok, true)
    assert.equal(store.bookings.value[0]?.date, '2026-03-30')
    assert.equal(store.bookings.value[0]?.startTime, '10:00')
    assert.equal(store.bookings.value[0]?.endTime, '12:00')
    assert.equal(store.bookings.value[0]?.venueNameSnapshot, 'Main Hall')

    const savedBookings = JSON.parse(localStorageStub.getItem(STORAGE_KEYS.bookings) ?? '[]') as Booking[]
    assert.equal(savedBookings[0]?.date, '2026-03-30')
    assert.equal(savedBookings[0]?.startTime, '10:00')
    assert.equal(savedBookings[0]?.endTime, '12:00')
    assert.equal(savedBookings[0]?.venueNameSnapshot, 'Main Hall')
  })

  it('returns a clear conflict validation when an overlapping booking already exists', () => {
    const store = useBookingStore()
    store.bookings.value = [createBooking()]

    const result = store.createBooking(
      createBookingDraft({
        startTime: '10:00',
        endTime: '12:00',
      }),
    )

    assert.equal(result.ok, false)
    assert.equal(
      result.validation?.generalErrors[0],
      '预约时间冲突：2026-03-30 09:00-11:00 已存在预约《Morning Workshop》。',
    )
  })

  it('rejects bookings outside the selected venue business hours', () => {
    const store = useBookingStore()
    store.venues.value = [createVenue({ openingTime: '09:00', closingTime: '20:00' })]

    const earlyResult = store.createBooking(
      createBookingDraft({
        startTime: '08:00',
        endTime: '10:00',
      }),
    )
    const lateResult = store.createBooking(
      createBookingDraft({
        startTime: '19:00',
        endTime: '21:00',
      }),
    )

    assert.equal(earlyResult.ok, false)
    assert.equal(earlyResult.validation?.fieldErrors.startTime, '所选场地营业时间为 09:00-20:00。 请选择营业时间内的开始时间。')
    assert.equal(lateResult.ok, false)
    assert.equal(lateResult.validation?.fieldErrors.endTime, '所选场地营业时间为 09:00-20:00。 请选择营业时间内的结束时间。')
    assert.equal(store.bookings.value.length, 0)
  })
})

describe('useBookingStore().cancelBooking()', () => {
  it('marks a booking as cancelled, persists it, and releases calendar occupancy', async () => {
    const store = useBookingStore()
    store.bookings.value = [createBooking()]

    const result = store.cancelBooking('booking-1')

    assert.equal(result.ok, true)
    assert.equal(result.data?.status, 'cancelled')
    assert.equal(store.bookings.value[0]?.status, 'cancelled')
    assert.equal(store.bookings.value[0]?.venueNameSnapshot, 'Main Hall')

    const savedBookings = JSON.parse(localStorageStub.getItem(STORAGE_KEYS.bookings) ?? '[]') as Booking[]
    assert.equal(savedBookings[0]?.status, 'cancelled')
    assert.equal(savedBookings[0]?.venueNameSnapshot, 'Main Hall')

    const calendarResult = await getWeeklyCalendar({ date: '2026-03-30', venueId: 'venue-1' })

    assert.equal(calendarResult.ok, true)
    assert.equal(
      calendarResult.data?.cells.some(
        (cell) => cell.date === '2026-03-30' && (cell.time === '09:00' || cell.time === '10:00') && cell.bookingId !== null,
      ),
      false,
    )
  })
})

describe('useBookingStore() venue CRUD', () => {
  it('filters venues by name keyword only', () => {
    const store = useBookingStore()

    const result = store.getVenues({
      keyword: 'Main',
      statuses: [],
      minCapacity: null,
      maxCapacity: null,
      amenity: null,
    })

    assert.equal(result.ok, true)
    assert.deepEqual(
      result.data?.map((venue) => venue.name),
      ['Main Hall'],
    )
  })

  it('creates a venue and persists it to localStorage immediately', () => {
    const store = useBookingStore()

    const result = store.createVenue(
      createVenueDraft({
        name: 'Sky Forum',
        location: '8F West Wing',
        capacity: 200,
        hourlyPrice: 520,
      }),
    )

    assert.equal(result.ok, true)
    assert.equal(store.venues.value[0]?.name, 'Sky Forum')

    const savedVenues = JSON.parse(localStorageStub.getItem(STORAGE_KEYS.venues) ?? '[]') as Venue[]
    assert.equal(savedVenues[0]?.name, 'Sky Forum')
    assert.equal(savedVenues[0]?.hourlyPrice, 520)
  })

  it('updates venue fields in place', () => {
    const store = useBookingStore()

    const result = store.updateVenue(
      'venue-1',
      createVenueDraft({
        name: 'Main Hall Plus',
        description: 'Upgraded AV support and modular seating.',
        hourlyPrice: 360,
      }),
    )

    assert.equal(result.ok, true)
    assert.equal(result.data?.name, 'Main Hall Plus')
    assert.equal(result.data?.hourlyPrice, 360)
    assert.equal(store.venues.value[0]?.description, 'Upgraded AV support and modular seating.')
  })
})

describe('useBookingStore().deleteVenue()', () => {
  it('blocks deleting a venue that still has future bookings', () => {
    const store = useBookingStore()
    store.bookings.value = [
      createBooking({
        date: '2099-03-30',
        startTime: '09:00',
      }),
    ]

    const result = store.deleteVenue('venue-1')

    assert.equal(result.ok, false)
    assert.equal(result.message, '当前场地存在未来预约，删除前请先处理相关预约。')
  })

  it('allows deleting a venue when only historical bookings or other venues remain', () => {
    const store = useBookingStore()
    store.bookings.value = [
      createBooking({
        date: '2020-03-20',
      }),
      createBooking({
        id: 'booking-2',
        venueId: 'venue-2',
        date: '2099-03-30',
      }),
    ]

    const result = store.deleteVenue('venue-1')

    assert.equal(result.ok, true)
    assert.equal(result.data?.id, 'venue-1')
    assert.equal(store.venues.value.some((venue) => venue.id === 'venue-1'), false)
  })
})

describe('getWeeklyCalendar()', () => {
  it('marks each occupied hour cell for a multi-hour booking', async () => {
    const store = useBookingStore()
    store.bookings.value = [createBooking()]

    const result = await getWeeklyCalendar({
      date: '2026-03-30',
      venueId: 'venue-1',
    })

    assert.equal(result.ok, true)
    assert.deepEqual(result.data?.dates, [
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
    ])

    const occupiedSlots = result.data?.cells
      .filter((cell) => cell.bookingId === 'booking-1')
      .map((cell) => `${cell.date} ${cell.time}`)

    assert.deepEqual(occupiedSlots, ['2026-03-30 09:00', '2026-03-30 10:00'])
  })

  it('isolates cells by venue and preserves closed hours for narrower schedules', async () => {
    const store = useBookingStore()
    store.bookings.value = [createBooking()]

    const venueOneCalendar = await getWeeklyCalendar({
      date: '2026-03-30',
      venueId: 'venue-1',
    })
    const venueTwoCalendar = await getWeeklyCalendar({
      date: '2026-03-30',
      venueId: 'venue-2',
    })

    const venueOneOccupiedSlots = venueOneCalendar.data?.cells
      .filter((cell) => cell.bookingId === 'booking-1')
      .map((cell) => `${cell.date} ${cell.time}`)
    const venueTwoOccupiedCells = venueTwoCalendar.data?.cells.filter((cell) => cell.bookingId !== null) ?? []
    const earlyCell = venueTwoCalendar.data?.cells.find((cell) => cell.date === '2026-03-30' && cell.time === '08:00')
    const firstOpenCell = venueTwoCalendar.data?.cells.find((cell) => cell.date === '2026-03-30' && cell.time === '09:00')
    const lateCell = venueTwoCalendar.data?.cells.find((cell) => cell.date === '2026-03-30' && cell.time === '20:00')

    assert.equal(venueOneCalendar.ok, true)
    assert.equal(venueTwoCalendar.ok, true)
    assert.deepEqual(venueOneOccupiedSlots, ['2026-03-30 09:00', '2026-03-30 10:00'])
    assert.equal(venueTwoOccupiedCells.length, 0)
    assert.equal(earlyCell?.isBusinessHour, false)
    assert.equal(firstOpenCell?.isBusinessHour, true)
    assert.equal(lateCell?.isBusinessHour, false)
  })
})
