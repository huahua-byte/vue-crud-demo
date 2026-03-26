import type { BookingStatus, VenueStatus } from './types'

export const BUSINESS_HOUR_START = '08:00'
export const BUSINESS_HOUR_END = '22:00'
export const DEFAULT_WEEK_VIEW_DAYS = 7
export const DEFAULT_WEEK_VIEW_RANGE = {
  days: DEFAULT_WEEK_VIEW_DAYS,
} as const

export const DATE_FORMAT = 'YYYY-MM-DD'
export const TIME_FORMAT = 'HH:mm'
export const DATE_TIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`

export const VENUE_STATUSES = ['active', 'inactive', 'maintenance'] as const satisfies readonly VenueStatus[]
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const satisfies readonly BookingStatus[]

export const STORAGE_KEYS = {
  venues: 'booking-system:venues',
  bookings: 'booking-system:bookings',
  seedMeta: 'booking-system:seed-meta',
} as const

export function isVenueStatus(value: string): value is VenueStatus {
  return VENUE_STATUSES.includes(value as VenueStatus)
}

export function isBookingStatus(value: string): value is BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus)
}

export function getBusinessHourSlots(): readonly string[] {
  const slots: string[] = []
  const [startHour] = BUSINESS_HOUR_START.split(':').map(Number)
  const [endHour] = BUSINESS_HOUR_END.split(':').map(Number)

  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
  }

  return slots
}
