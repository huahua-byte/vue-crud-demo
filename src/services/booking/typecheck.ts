import {
  createDefaultWeeklyCalendarQuery,
  type Booking,
  type BookingDraft,
  type StoreActionResult,
  type VenueDraft,
  type WeeklyCalendarResult,
} from '../../domain/booking'
import {
  createBooking,
  createVenue,
  cancelBooking,
  deleteVenue,
  getBookings,
  getVenueById,
  getVenues,
  getWeeklyCalendar,
  updateVenue,
} from './index'

const draft: BookingDraft = {
  venueId: 'venue-1',
  title: 'Morning Workshop',
  contactName: 'Alex Chen',
  contactPhone: '13800000000',
  date: '2026-03-30',
  startTime: '09:00',
  endTime: '11:00',
  attendeeCount: 20,
  notes: 'Need projector support',
}

const venueDraft: VenueDraft = {
  name: 'Sky Forum',
  location: '8F West Wing',
  capacity: 200,
  hourlyPrice: 520,
  amenities: ['wifi', 'projector'],
  openingTime: '08:00',
  closingTime: '22:00',
  status: 'active',
  description: 'Large venue for conferences and launch events.',
}

async function verifyServiceContracts(): Promise<void> {
  const venuesResult = await getVenues()
  const venueResult = await getVenueById('venue-1')
  const bookingsBeforeCreate = await getBookings()
  const createResult = await createBooking(draft)
  const conflictResult = await createBooking(draft)
  const createVenueResult = await createVenue(venueDraft)
  const updateVenueResult =
    createVenueResult.ok && createVenueResult.data
      ? await updateVenue(createVenueResult.data.id, {
          ...venueDraft,
          name: 'Sky Forum Plus',
          hourlyPrice: 560,
        })
      : ({ ok: false, message: '场地创建失败。' } satisfies StoreActionResult<{ id: string }>)
  const calendarQuery = createDefaultWeeklyCalendarQuery('2026-03-30', 'venue-1')
  const calendarResult = await getWeeklyCalendar(calendarQuery)

  const cancelBookingResult = createResult.ok && createResult.data
    ? await cancelBooking(createResult.data.id)
    : ({ ok: false, message: '预约创建失败。' } satisfies StoreActionResult<Booking>)

  const deleteVenueResult = await deleteVenue('venue-1')

  if (!venuesResult.ok || !venuesResult.data) {
    throw new Error('Expected getVenues() to resolve with seeded venue data.')
  }

  if (!venueResult.ok || venueResult.data?.id !== 'venue-1') {
    throw new Error('Expected getVenueById() to find the seeded venue.')
  }

  if (!bookingsBeforeCreate.ok || !bookingsBeforeCreate.data) {
    throw new Error('Expected getBookings() to return a successful result shell.')
  }

  if (!createResult.ok || !createResult.data) {
    throw new Error('Expected createBooking() to succeed for a valid draft.')
  }

  if (conflictResult.ok) {
    throw new Error('Expected createBooking() to surface a booking conflict for overlapping time ranges.')
  }

  if (!createVenueResult.ok || !createVenueResult.data?.id) {
    throw new Error('Expected createVenue() to succeed for a valid venue draft.')
  }

  if (!updateVenueResult.ok || updateVenueResult.data?.name !== 'Sky Forum Plus' || updateVenueResult.data.hourlyPrice !== 560) {
    throw new Error('Expected updateVenue() to preserve updated venue fields.')
  }

  if (!conflictResult.message?.includes('预约时间冲突')) {
    throw new Error('Expected booking conflict message to be preserved for page usage.')
  }

  if (!calendarResult.ok || !calendarResult.data) {
    throw new Error('Expected getWeeklyCalendar() to return the weekly calendar payload.')
  }

  if (calendarResult.data.weekStart !== '2026-03-30') {
    throw new Error('Expected weekly calendar to start from the Monday of the query week.')
  }

  if (cancelBookingResult.ok !== true || cancelBookingResult.data?.status !== 'cancelled') {
    throw new Error('Expected cancelBooking() to soft-cancel the newly created booking.')
  }

  if (deleteVenueResult.ok !== false || deleteVenueResult.message !== '当前场地存在未来预约，删除前请先处理相关预约。') {
    throw new Error('Expected deleteVenue() to preserve the business restriction message.')
  }

  const weeklyCalendarPayload: WeeklyCalendarResult | undefined = calendarResult.data

  void weeklyCalendarPayload
}

void verifyServiceContracts
