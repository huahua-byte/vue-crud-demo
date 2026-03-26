import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { useBookingStore } from './useBookingStore'
import { STORAGE_KEYS, type AppSeedMeta, type Booking, type BookingDraft, type Venue, type VenueDraft } from '../domain/booking'

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

  store.venues.value = [createVenue(), createVenue({ id: 'venue-2', name: 'Riverside Studio' })]
  store.bookings.value = []
  store.seedMeta.value = seedMeta
  store.initialized.value = true
}

beforeEach(() => {
  localStorageStub.clear()
  resetStoreState()
})

describe('useBookingStore().createBooking()', () => {
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
    assert.match(result.validation?.generalErrors[0] ?? '', /预约时间冲突/)
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
