import {
  createDefaultWeeklyCalendarQuery,
  type BookingDraft,
  type StoreActionResult,
  type WeeklyCalendarResult,
} from '../../domain/booking'
import {
  createBooking,
  deleteBooking,
  deleteVenue,
  getBookings,
  getVenueById,
  getVenues,
  getWeeklyCalendar,
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

async function verifyServiceContracts(): Promise<void> {
  const venuesResult = await getVenues()
  const venueResult = await getVenueById('venue-1')
  const bookingsBeforeCreate = await getBookings()
  const createResult = await createBooking(draft)
  const conflictResult = await createBooking(draft)
  const calendarQuery = createDefaultWeeklyCalendarQuery('2026-03-30', 'venue-1')
  const calendarResult = await getWeeklyCalendar(calendarQuery)

  const deleteBookingResult = createResult.ok && createResult.data
    ? await deleteBooking(createResult.data.id)
    : ({ ok: false, message: '预约创建失败。' } satisfies StoreActionResult<{ id: string }>)

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

  if (!conflictResult.message?.includes('预约时间冲突')) {
    throw new Error('Expected booking conflict message to be preserved for page usage.')
  }

  if (!calendarResult.ok || !calendarResult.data) {
    throw new Error('Expected getWeeklyCalendar() to return the weekly calendar payload.')
  }

  if (calendarResult.data.weekStart !== '2026-03-30') {
    throw new Error('Expected weekly calendar to start from the Monday of the query week.')
  }

  if (deleteBookingResult.ok !== true) {
    throw new Error('Expected deleteBooking() to delete the newly created booking.')
  }

  if (deleteVenueResult.ok !== false || deleteVenueResult.message !== '当前场地存在未来预约，删除前请先处理相关预约。') {
    throw new Error('Expected deleteVenue() to preserve the business restriction message.')
  }

  const weeklyCalendarPayload: WeeklyCalendarResult | undefined = calendarResult.data

  void weeklyCalendarPayload
}

void verifyServiceContracts
