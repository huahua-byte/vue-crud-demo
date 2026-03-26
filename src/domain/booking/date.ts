import { BUSINESS_HOUR_END, BUSINESS_HOUR_START, getBusinessHourSlots } from './constants'
import type { WeeklyCalendarCell } from './types'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const FULL_HOUR_MINUTES = '00'
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function parseIsoDateParts(value: string): { year: number; month: number; day: number } | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

function parseTimeLabelParts(value: string): { hour: number; minute: number } | null {
  if (!TIME_SLOT_PATTERN.test(value)) {
    return null
  }

  const [hour, minute] = value.split(':').map(Number)

  return { hour, minute }
}

function assertIsoDateString(value: string): void {
  if (!isIsoDateString(value)) {
    throw new Error(`Invalid date format: "${value}". Expected YYYY-MM-DD.`)
  }
}

function assertTimeLabel(value: string): void {
  if (parseTimeLabelParts(value) === null) {
    throw new Error(`Invalid time format: "${value}". Expected HH:mm.`)
  }
}

export function isIsoDateString(value: string): boolean {
  return parseIsoDateParts(value) !== null
}

export function isTimeSlotLabel(value: string): boolean {
  if (!TIME_SLOT_PATTERN.test(value)) {
    return false
  }

  return getBusinessHourSlots().includes(value)
}

export function compareIsoDateStrings(left: string, right: string): number {
  assertIsoDateString(left)
  assertIsoDateString(right)

  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

export function compareTimeSlotLabels(left: string, right: string): number {
  assertTimeLabel(left)
  assertTimeLabel(right)

  if (left === right) {
    return 0
  }

  return left < right ? -1 : 1
}

export function getStartOfWeek(date: string): string {
  const dateParts = parseIsoDateParts(date)

  if (dateParts === null) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD.`)
  }

  const currentDate = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day))
  const dayOfWeek = currentDate.getUTCDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const startOfWeek = new Date(currentDate.getTime() - diffToMonday * MILLISECONDS_PER_DAY)

  return startOfWeek.toISOString().slice(0, 10)
}

export function expandTimeRange(startTime: string, endTime: string): string[] {
  const startParts = parseTimeLabelParts(startTime)
  const endParts = parseTimeLabelParts(endTime)

  if (startParts === null || endParts === null) {
    return []
  }

  if (startParts.minute !== 0 || endParts.minute !== 0) {
    return []
  }

  if (compareTimeSlotLabels(startTime, endTime) >= 0) {
    return []
  }

  const slots: string[] = []

  for (let hour = startParts.hour; hour < endParts.hour; hour += 1) {
    slots.push(`${String(hour).padStart(2, '0')}:${FULL_HOUR_MINUTES}`)
  }

  return slots
}

export function isFutureBookingDateTime(date: string, startTime: string, now: string = new Date().toISOString()): boolean {
  assertIsoDateString(date)
  assertTimeLabel(startTime)

  const bookingDateTime = Date.parse(`${date}T${startTime}:00.000Z`)
  const currentDateTime = Date.parse(now)

  if (Number.isNaN(bookingDateTime)) {
    throw new Error(`Invalid booking date time: "${date} ${startTime}".`)
  }

  if (Number.isNaN(currentDateTime)) {
    throw new Error(`Invalid current time: "${now}". Expected an ISO timestamp.`)
  }

  return bookingDateTime > currentDateTime
}

export function createWeeklyCalendarCell(params: {
  date: string
  time: string
  venueId: string
  bookingId?: string | null
}): WeeklyCalendarCell {
  const { date, time, venueId, bookingId = null } = params

  assertIsoDateString(date)

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
