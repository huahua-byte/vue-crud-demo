import {
  APP_SEED_VERSION,
  BOOKING_STATUSES,
  DATE_FORMAT,
  STORAGE_KEYS,
  VENUE_STATUSES,
  createSeedVenues,
  createDefaultBookingFilter,
  createDefaultVenueSearchFilter,
  createWeeklyCalendarCell,
  ensureBookingStorageSeeded,
  isBookingStatus,
  isIsoDateString,
  isVenueStatus,
  loadBookings,
  loadSeedMeta,
  loadVenues,
  type AppSeedMeta,
  type Booking,
  type Venue,
} from './index'

const venueFilter = createDefaultVenueSearchFilter()
const bookingFilter = createDefaultBookingFilter()

const venue: Venue = {
  id: 'venue-1',
  name: 'Main Hall',
  location: '1F East Wing',
  capacity: 120,
  amenities: ['projector', 'sound-system'],
  openingTime: '08:00',
  closingTime: '22:00',
  status: 'active',
  description: 'Primary event venue',
  createdAt: '2026-03-26T08:00:00.000Z',
  updatedAt: '2026-03-26T08:00:00.000Z',
}

const booking: Booking = {
  id: 'booking-1',
  venueId: venue.id,
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
}

const seedMeta: AppSeedMeta = {
  version: '1.0.0',
  seededAt: '2026-03-26T08:45:00.000Z',
  venueCount: 1,
  bookingCount: 1,
}

const seededVenues = createSeedVenues('2026-03-26T08:00:00.000Z')
const firstSeedVenue: Venue = seededVenues[0]
const venues: Venue[] = loadVenues()
const bookings: Booking[] = loadBookings()
const loadedSeedMeta: AppSeedMeta | null = loadSeedMeta()
const seeded = ensureBookingStorageSeeded(APP_SEED_VERSION)

const cell = createWeeklyCalendarCell({
  date: booking.date,
  time: booking.startTime,
  venueId: booking.venueId,
  bookingId: booking.id,
})

const firstVenueStatus = VENUE_STATUSES[0]
const firstBookingStatus = BOOKING_STATUSES[0]

if (!isVenueStatus(firstVenueStatus) || !isBookingStatus(firstBookingStatus)) {
  throw new Error('Status guards must accept declared status constants.')
}

if (!isIsoDateString(booking.date)) {
  throw new Error(`Expected ${DATE_FORMAT} date string.`)
}

void venueFilter
void bookingFilter
void seedMeta
void cell
void firstSeedVenue
void venues
void bookings
void loadedSeedMeta
void seeded
void STORAGE_KEYS

const seededVenueCount: number = seeded.seedMeta.venueCount
const seededBookingCount: number = seeded.seedMeta.bookingCount

if (seededVenueCount !== 3 || seededBookingCount !== 0) {
  throw new Error('Expected initial booking storage seed counts to stay stable.')
}
