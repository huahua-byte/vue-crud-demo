export type VenueStatus = 'active' | 'inactive' | 'maintenance'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Venue {
  id: string
  name: string
  location: string
  capacity: number
  amenities: string[]
  openingTime: string
  closingTime: string
  status: VenueStatus
  description: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  venueId: string
  title: string
  contactName: string
  contactPhone: string
  date: string
  startTime: string
  endTime: string
  attendeeCount: number
  status: BookingStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface BookingDraft {
  venueId: string
  title: string
  contactName: string
  contactPhone: string
  date: string
  startTime: string
  endTime: string
  attendeeCount: number
  notes: string
}

export interface VenueDraft {
  name: string
  location: string
  capacity: number
  amenities: string[]
  openingTime: string
  closingTime: string
  status: VenueStatus
  description: string
}

export interface BookingTimeRange {
  id?: string
  venueId: string
  date: string
  startTime: string
  endTime: string
}

export interface BookingFieldErrors {
  venueId?: string
  title?: string
  contactName?: string
  contactPhone?: string
  date?: string
  startTime?: string
  endTime?: string
  attendeeCount?: string
  notes?: string
}

export interface BookingValidationResult {
  isValid: boolean
  fieldErrors: BookingFieldErrors
  generalErrors: string[]
}

export interface StoreActionResult<T> {
  ok: boolean
  data?: T
  message?: string
  validation?: BookingValidationResult
}

export interface WeeklyCalendarCell {
  date: string
  time: string
  venueId: string
  bookingId: string | null
  isBusinessHour: boolean
}

export interface VenueSearchFilter {
  keyword: string
  statuses: VenueStatus[]
  minCapacity: number | null
  maxCapacity: number | null
  amenity: string | null
}

export interface BookingFilter {
  venueId: string | null
  dateFrom: string | null
  dateTo: string | null
  statuses: BookingStatus[]
  keyword: string
}

export interface AppSeedMeta {
  version: string
  seededAt: string
  venueCount: number
  bookingCount: number
}

export function createDefaultVenueSearchFilter(): VenueSearchFilter {
  return {
    keyword: '',
    statuses: [],
    minCapacity: null,
    maxCapacity: null,
    amenity: null,
  }
}

export function createDefaultBookingFilter(): BookingFilter {
  return {
    venueId: null,
    dateFrom: null,
    dateTo: null,
    statuses: [],
    keyword: '',
  }
}
