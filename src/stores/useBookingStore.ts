import { reactive, toRefs } from 'vue'

import {
  assertVenueCanDelete,
  compareIsoDateStrings,
  ensureBookingStorageSeeded,
  expandTimeRange,
  findBookingConflict,
  saveBookings,
  saveSeedMeta,
  saveVenues,
  validateBookingDraft,
  validateVenueDraft,
  type AppSeedMeta,
  type Booking,
  type BookingDraft,
  type BookingFilter,
  type BookingValidationResult,
  type StoreActionResult,
  type ValidationResult,
  type Venue,
  type VenueDraft,
  type VenueSearchFilter,
} from '../domain/booking'

const state = reactive<{
  venues: Venue[]
  bookings: Booking[]
  seedMeta: AppSeedMeta | null
  initialized: boolean
}>({
  venues: [],
  bookings: [],
  seedMeta: null,
  initialized: false,
})

function ensureInitialized(): void {
  if (state.initialized) {
    return
  }

  const seeded = ensureBookingStorageSeeded()

  state.venues = seeded.venues
  state.bookings = seeded.bookings
  state.seedMeta = seeded.seedMeta
  state.initialized = true
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function getValidationMessage(validation: ValidationResult): string {
  const firstFieldError = Object.values(validation.fieldErrors)[0]

  return firstFieldError ?? validation.generalErrors[0] ?? '提交的数据校验失败。'
}

function syncVenues(): void {
  saveVenues(state.venues)

  if (state.seedMeta !== null) {
    state.seedMeta = {
      ...state.seedMeta,
      venueCount: state.venues.length,
    }
    saveSeedMeta(state.seedMeta)
  }
}

function syncBookings(): void {
  saveBookings(state.bookings)

  if (state.seedMeta !== null) {
    state.seedMeta = {
      ...state.seedMeta,
      bookingCount: state.bookings.length,
    }
    saveSeedMeta(state.seedMeta)
  }
}

function matchesVenueFilter(venue: Venue, filter: VenueSearchFilter): boolean {
  const keyword = filter.keyword.trim().toLowerCase()
  const hasKeyword = keyword.length === 0 || venue.name.toLowerCase().includes(keyword)

  const matchesStatus = filter.statuses.length === 0 || filter.statuses.includes(venue.status)
  const matchesMinCapacity = filter.minCapacity === null || venue.capacity >= filter.minCapacity
  const matchesMaxCapacity = filter.maxCapacity === null || venue.capacity <= filter.maxCapacity
  const matchesAmenity = filter.amenity === null || venue.amenities.includes(filter.amenity)

  return hasKeyword && matchesStatus && matchesMinCapacity && matchesMaxCapacity && matchesAmenity
}

function matchesBookingFilter(booking: Booking, filter: BookingFilter): boolean {
  const keyword = filter.keyword.trim().toLowerCase()
  const hasKeyword =
    keyword.length === 0 ||
    booking.title.toLowerCase().includes(keyword) ||
    booking.contactName.toLowerCase().includes(keyword) ||
    booking.contactPhone.includes(keyword) ||
    booking.notes.toLowerCase().includes(keyword)

  const matchesVenue = filter.venueId === null || booking.venueId === filter.venueId
  const matchesStatus = filter.statuses.length === 0 || filter.statuses.includes(booking.status)
  const matchesDateFrom = filter.dateFrom === null || compareIsoDateStrings(booking.date, filter.dateFrom) >= 0
  const matchesDateTo = filter.dateTo === null || compareIsoDateStrings(booking.date, filter.dateTo) <= 0

  return hasKeyword && matchesVenue && matchesStatus && matchesDateFrom && matchesDateTo
}

function getVenues(filter: VenueSearchFilter): StoreActionResult<Venue[]> {
  ensureInitialized()

  return {
    ok: true,
    data: state.venues.filter((venue) => matchesVenueFilter(venue, filter)),
  }
}

function getVenueById(venueId: string): StoreActionResult<Venue> {
  ensureInitialized()

  const venue = state.venues.find((entry) => entry.id === venueId)

  if (venue === undefined) {
    return {
      ok: false,
      message: '场地不存在。',
    }
  }

  return {
    ok: true,
    data: venue,
  }
}

function createVenue(draft: VenueDraft): StoreActionResult<Venue> {
  ensureInitialized()

  const validation = validateVenueDraft(draft)

  if (!validation.isValid) {
    return {
      ok: false,
      message: getValidationMessage(validation),
      validation,
    }
  }

  const now = new Date().toISOString()
  const venue: Venue = {
    id: generateId('venue'),
    name: draft.name.trim(),
    location: draft.location.trim(),
    capacity: draft.capacity,
    hourlyPrice: draft.hourlyPrice,
    amenities: [...draft.amenities],
    openingTime: draft.openingTime,
    closingTime: draft.closingTime,
    status: draft.status,
    description: draft.description.trim(),
    createdAt: now,
    updatedAt: now,
  }

  state.venues = [venue, ...state.venues]
  syncVenues()

  return {
    ok: true,
    data: venue,
  }
}

function updateVenue(venueId: string, draft: VenueDraft): StoreActionResult<Venue> {
  ensureInitialized()

  const existingVenue = state.venues.find((entry) => entry.id === venueId)

  if (existingVenue === undefined) {
    return {
      ok: false,
      message: '场地不存在。',
    }
  }

  const validation = validateVenueDraft(draft)

  if (!validation.isValid) {
    return {
      ok: false,
      message: getValidationMessage(validation),
      validation,
    }
  }

  const updatedVenue: Venue = {
    ...existingVenue,
    name: draft.name.trim(),
    location: draft.location.trim(),
    capacity: draft.capacity,
    hourlyPrice: draft.hourlyPrice,
    amenities: [...draft.amenities],
    openingTime: draft.openingTime,
    closingTime: draft.closingTime,
    status: draft.status,
    description: draft.description.trim(),
    updatedAt: new Date().toISOString(),
  }

  state.venues = state.venues.map((entry) => (entry.id === venueId ? updatedVenue : entry))
  syncVenues()

  return {
    ok: true,
    data: updatedVenue,
  }
}

function deleteVenue(venueId: string): StoreActionResult<{ id: string }> {
  ensureInitialized()

  const venue = state.venues.find((entry) => entry.id === venueId)

  if (venue === undefined) {
    return {
      ok: false,
      message: '场地不存在。',
    }
  }

  try {
    assertVenueCanDelete(state.bookings, venueId)
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '删除场地失败。',
    }
  }

  state.venues = state.venues.filter((entry) => entry.id !== venueId)
  syncVenues()

  return {
    ok: true,
    data: { id: venueId },
  }
}

function getBookings(filter: BookingFilter): StoreActionResult<Booking[]> {
  ensureInitialized()

  try {
    return {
      ok: true,
      data: state.bookings.filter((booking) => matchesBookingFilter(booking, filter)),
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '获取预约列表失败。',
    }
  }
}

function createBooking(draft: BookingDraft): StoreActionResult<Booking> {
  ensureInitialized()

  const validation = validateBookingDraft(draft)

  if (!validation.isValid) {
    return {
      ok: false,
      message: getValidationMessage(validation),
      validation,
    }
  }

  const venue = state.venues.find((entry) => entry.id === draft.venueId)

  if (venue === undefined) {
    const venueValidation: BookingValidationResult = {
      isValid: false,
      fieldErrors: {
        venueId: '所选场地不存在。',
      },
      generalErrors: [],
    }

    return {
      ok: false,
      message: getValidationMessage(venueValidation),
      validation: venueValidation,
    }
  }

  const conflict = findBookingConflict(state.bookings, {
    venueId: draft.venueId,
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
  })

  if (conflict !== null) {
    const conflictValidation: BookingValidationResult = {
      isValid: false,
      fieldErrors: {},
      generalErrors: [
        `预约时间冲突：${conflict.date} ${conflict.startTime}-${conflict.endTime} 已存在预约《${conflict.title}》。`,
      ],
    }

    return {
      ok: false,
      message: getValidationMessage(conflictValidation),
      validation: conflictValidation,
    }
  }

  const now = new Date().toISOString()
  const booking: Booking = {
    id: generateId('booking'),
    venueId: venue.id,
    title: draft.title.trim(),
    contactName: draft.contactName.trim(),
    contactPhone: draft.contactPhone.trim(),
    date: draft.date,
    startTime: draft.startTime,
    endTime: draft.endTime,
    attendeeCount: draft.attendeeCount,
    status: 'confirmed',
    notes: draft.notes.trim(),
    createdAt: now,
    updatedAt: now,
  }

  state.bookings = [booking, ...state.bookings]
  syncBookings()

  return {
    ok: true,
    data: booking,
  }
}

function deleteBooking(bookingId: string): StoreActionResult<{ id: string }> {
  ensureInitialized()

  const hasBooking = state.bookings.some((booking) => booking.id === bookingId)

  if (!hasBooking) {
    return {
      ok: false,
      message: '预约不存在。',
    }
  }

  state.bookings = state.bookings.filter((booking) => booking.id !== bookingId)
  syncBookings()

  return {
    ok: true,
    data: { id: bookingId },
  }
}

function getOccupiedSlots(booking: Booking): string[] {
  return expandTimeRange(booking.startTime, booking.endTime)
}

ensureInitialized()

export function useBookingStore() {
  return {
    ...toRefs(state),
    getVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    getBookings,
    createBooking,
    deleteBooking,
    getOccupiedSlots,
  }
}
