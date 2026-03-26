import { BUSINESS_HOUR_END, BUSINESS_HOUR_START, getBusinessHourSlots } from './constants'
import type { WeeklyCalendarCell } from './types'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function isIsoDateString(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function isTimeSlotLabel(value: string): boolean {
  if (!TIME_SLOT_PATTERN.test(value)) {
    return false
  }

  return getBusinessHourSlots().includes(value)
}

export function createWeeklyCalendarCell(params: {
  date: string
  time: string
  venueId: string
  bookingId?: string | null
}): WeeklyCalendarCell {
  const { date, time, venueId, bookingId = null } = params

  if (!isIsoDateString(date)) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD.`)
  }

  if (!isTimeSlotLabel(time)) {
    throw new Error(`Invalid time slot: "${time}". Expected a business hour slot between ${BUSINESS_HOUR_START} and ${BUSINESS_HOUR_END}.`)
  }

  const businessHourSlots = getBusinessHourSlots()

  return {
    date,
    time,
    venueId,
    bookingId,
    isBusinessHour: businessHourSlots.includes(time),
  }
}
