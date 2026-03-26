import {
  DEFAULT_WEEK_VIEW_DAYS,
  createDefaultBookingFilter,
  createWeeklyCalendarCell,
  getBusinessHourSlots,
  getStartOfWeek,
  type Booking,
  type StoreActionResult,
  type WeeklyCalendarQuery,
  type WeeklyCalendarResult,
} from '../../domain/booking'
import { useBookingStore } from '../../stores/useBookingStore'

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`)

  value.setUTCDate(value.getUTCDate() + days)

  return value.toISOString().slice(0, 10)
}

function findBookingId(bookings: Booking[], date: string, time: string, venueId: string): string | null {
  const booking = bookings.find((entry) => {
    if (entry.status === 'cancelled' || entry.date !== date || entry.venueId !== venueId) {
      return false
    }

    return entry.startTime <= time && entry.endTime > time
  })

  return booking?.id ?? null
}

export async function getWeeklyCalendar(
  query: WeeklyCalendarQuery,
): Promise<StoreActionResult<WeeklyCalendarResult>> {
  const store = useBookingStore()

  try {
    const weekStart = getStartOfWeek(query.date)
    const dates = Array.from({ length: DEFAULT_WEEK_VIEW_DAYS }, (_, index) => addDays(weekStart, index))
    const venues = query.venueId === null
      ? store.venues.value
      : store.venues.value.filter((venue) => venue.id === query.venueId)

    if (query.venueId !== null && venues.length === 0) {
      return {
        ok: false,
        message: '场地不存在。',
      }
    }

    const bookingsResult = store.getBookings({
      ...createDefaultBookingFilter(),
      venueId: query.venueId,
      dateFrom: dates[0],
      dateTo: dates[dates.length - 1],
    })

    if (!bookingsResult.ok || bookingsResult.data === undefined) {
      return {
        ok: false,
        message: bookingsResult.message ?? '获取周历预约数据失败。',
        validation: bookingsResult.validation,
      }
    }

    const slots = getBusinessHourSlots()
    const cells = venues.flatMap((venue) =>
      dates.flatMap((date) =>
        slots.map((time) =>
          createWeeklyCalendarCell({
            date,
            time,
            venueId: venue.id,
            bookingId: findBookingId(bookingsResult.data as Booking[], date, time, venue.id),
            openingTime: venue.openingTime,
            closingTime: venue.closingTime,
          }),
        ),
      ),
    )

    return {
      ok: true,
      data: {
        weekStart,
        dates,
        cells,
      },
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : '获取周历数据失败。',
    }
  }
}
