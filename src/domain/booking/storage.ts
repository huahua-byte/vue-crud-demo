import { APP_SEED_VERSION, STORAGE_KEYS, isBookingStatus, isVenueStatus } from './constants'
import { isIsoDateString } from './date'
import type { AppSeedMeta, Booking, Venue } from './types'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && value >= 0
}

function isIsoTimestampString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isTimeString(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function parseStorageItem(key: string): unknown {
  if (!hasLocalStorage()) {
    return null
  }

  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStorageItem(key: string, value: unknown): void {
  if (!hasLocalStorage()) {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota and serialization errors so storage failures do not crash the app.
  }
}

export function isVenueRecord(value: unknown): value is Venue {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.location === 'string' &&
    isNonNegativeInteger(value.capacity) &&
    isNonNegativeInteger(value.hourlyPrice) &&
    isStringArray(value.amenities) &&
    isTimeString(value.openingTime) &&
    isTimeString(value.closingTime) &&
    typeof value.status === 'string' &&
    isVenueStatus(value.status) &&
    typeof value.description === 'string' &&
    isIsoTimestampString(value.createdAt) &&
    isIsoTimestampString(value.updatedAt)
  )
}

export function isBookingRecord(value: unknown): value is Booking {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.venueId === 'string' &&
    typeof value.title === 'string' &&
    typeof value.contactName === 'string' &&
    typeof value.contactPhone === 'string' &&
    typeof value.date === 'string' &&
    isIsoDateString(value.date) &&
    isTimeString(value.startTime) &&
    isTimeString(value.endTime) &&
    isNonNegativeInteger(value.attendeeCount) &&
    typeof value.status === 'string' &&
    isBookingStatus(value.status) &&
    typeof value.notes === 'string' &&
    isIsoTimestampString(value.createdAt) &&
    isIsoTimestampString(value.updatedAt)
  )
}

export function isSeedMetaRecord(value: unknown): value is AppSeedMeta {
  return (
    isRecord(value) &&
    typeof value.version === 'string' &&
    isIsoTimestampString(value.seededAt) &&
    isNonNegativeInteger(value.venueCount) &&
    isNonNegativeInteger(value.bookingCount)
  )
}

export function loadVenues(): Venue[] {
  const value = parseStorageItem(STORAGE_KEYS.venues)

  if (!Array.isArray(value) || !value.every(isVenueRecord)) {
    return []
  }

  return value
}

export function saveVenues(venues: Venue[]): void {
  writeStorageItem(STORAGE_KEYS.venues, venues)
}

export function loadBookings(): Booking[] {
  const value = parseStorageItem(STORAGE_KEYS.bookings)

  if (!Array.isArray(value) || !value.every(isBookingRecord)) {
    return []
  }

  return value
}

export function saveBookings(bookings: Booking[]): void {
  writeStorageItem(STORAGE_KEYS.bookings, bookings)
}

export function loadSeedMeta(): AppSeedMeta | null {
  const value = parseStorageItem(STORAGE_KEYS.seedMeta)

  return isSeedMetaRecord(value) ? value : null
}

export function saveSeedMeta(seedMeta: AppSeedMeta | null): void {
  if (!hasLocalStorage()) {
    return
  }

  if (seedMeta === null) {
    try {
      localStorage.removeItem(STORAGE_KEYS.seedMeta)
    } catch {
      // Ignore storage removal errors.
    }
    return
  }

  writeStorageItem(STORAGE_KEYS.seedMeta, seedMeta)
}

export function createSeedVenues(now: string = new Date().toISOString()): Venue[] {
  return [
    {
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
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'venue-2',
      name: 'Riverside Studio',
      location: '3F South Wing',
      capacity: 48,
      hourlyPrice: 180,
      amenities: ['whiteboard', 'wifi'],
      openingTime: '09:00',
      closingTime: '20:00',
      status: 'active',
      description: 'Flexible studio space for workshops and classes.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'venue-3',
      name: 'Boardroom A',
      location: '5F North Wing',
      capacity: 16,
      hourlyPrice: 120,
      amenities: ['display', 'video-conference'],
      openingTime: '08:00',
      closingTime: '18:00',
      status: 'maintenance',
      description: 'Executive meeting room currently under maintenance.',
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export function ensureBookingStorageSeeded(version: string = APP_SEED_VERSION): {
  venues: Venue[]
  bookings: Booking[]
  seedMeta: AppSeedMeta
} {
  const venues = loadVenues()
  const bookings = loadBookings()
  const currentSeedMeta = loadSeedMeta()

  const shouldSeedVenues = venues.length === 0
  const nextVenues = shouldSeedVenues ? createSeedVenues() : venues
  const nextBookings = bookings
  const shouldWriteBookings = parseStorageItem(STORAGE_KEYS.bookings) === null
  const needsSeedMeta =
    currentSeedMeta === null ||
    currentSeedMeta.version !== version ||
    currentSeedMeta.venueCount !== nextVenues.length ||
    currentSeedMeta.bookingCount !== nextBookings.length

  if (shouldSeedVenues) {
    saveVenues(nextVenues)
  }

  if (shouldWriteBookings) {
    saveBookings(nextBookings)
  }

  const nextSeedMeta: AppSeedMeta = needsSeedMeta
    ? {
        version,
        seededAt: currentSeedMeta?.seededAt ?? new Date().toISOString(),
        venueCount: nextVenues.length,
        bookingCount: nextBookings.length,
      }
    : currentSeedMeta

  if (needsSeedMeta) {
    saveSeedMeta(nextSeedMeta)
  }

  return {
    venues: nextVenues,
    bookings: nextBookings,
    seedMeta: nextSeedMeta,
  }
}
