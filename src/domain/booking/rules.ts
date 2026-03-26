import { BUSINESS_HOUR_END, BUSINESS_HOUR_START, getBusinessHourSlots } from './constants'
import {
  compareIsoDateStrings,
  compareTimeSlotLabels,
  expandTimeRange,
  isFutureBookingDateTime,
  isIsoDateString,
} from './date'
import type {
  Booking,
  BookingDraft,
  BookingFieldErrors,
  BookingTimeRange,
  BookingValidationResult,
  VenueDraft,
  VenueFieldErrors,
  VenueValidationResult,
} from './types'

const PHONE_PATTERN = /^1\d{10}$/

function createValidationResult(fieldErrors: BookingFieldErrors = {}, generalErrors: string[] = []): BookingValidationResult {
  return {
    isValid: Object.keys(fieldErrors).length === 0 && generalErrors.length === 0,
    fieldErrors,
    generalErrors,
  }
}

function createVenueValidationResult(
  fieldErrors: VenueFieldErrors = {},
  generalErrors: string[] = [],
): VenueValidationResult {
  return {
    isValid: Object.keys(fieldErrors).length === 0 && generalErrors.length === 0,
    fieldErrors,
    generalErrors,
  }
}

function mergeValidationResults(...results: BookingValidationResult[]): BookingValidationResult {
  const fieldErrors: BookingFieldErrors = {}
  const generalErrors: string[] = []

  for (const result of results) {
    Object.assign(fieldErrors, result.fieldErrors)
    generalErrors.push(...result.generalErrors)
  }

  return createValidationResult(fieldErrors, generalErrors)
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function isFullHourLabel(value: string): boolean {
  return /^([01]\d|2[0-3]):00$/.test(value)
}

function hasBookingOverlap(left: BookingTimeRange, right: BookingTimeRange): boolean {
  return (
    compareTimeSlotLabels(left.startTime, right.endTime) < 0 &&
    compareTimeSlotLabels(left.endTime, right.startTime) > 0
  )
}

export function validateRequiredBookingFields(draft: BookingDraft): BookingValidationResult {
  const fieldErrors: BookingFieldErrors = {}

  if (isBlank(draft.venueId)) {
    fieldErrors.venueId = '请选择场地。'
  }

  if (isBlank(draft.title)) {
    fieldErrors.title = '请输入预约标题。'
  }

  if (isBlank(draft.contactName)) {
    fieldErrors.contactName = '请输入联系人姓名。'
  }

  if (isBlank(draft.contactPhone)) {
    fieldErrors.contactPhone = '请输入联系电话。'
  }

  if (isBlank(draft.date)) {
    fieldErrors.date = '请选择预约日期。'
  }

  if (isBlank(draft.startTime)) {
    fieldErrors.startTime = '请选择开始时间。'
  }

  if (isBlank(draft.endTime)) {
    fieldErrors.endTime = '请选择结束时间。'
  }

  if (!Number.isInteger(draft.attendeeCount) || draft.attendeeCount <= 0) {
    fieldErrors.attendeeCount = '预约人数必须为大于 0 的整数。'
  }

  return createValidationResult(fieldErrors)
}

export function isValidContactPhone(contactPhone: string): boolean {
  return PHONE_PATTERN.test(contactPhone.trim())
}

export function isValidBusinessHourBooking(startTime: string, endTime: string): boolean {
  if (!isFullHourLabel(startTime) || !isFullHourLabel(endTime)) {
    return false
  }

  const businessHourSlots = getBusinessHourSlots()
  const isStartTimeValid = businessHourSlots.includes(startTime)
  const isEndTimeAtBusinessClose = endTime === BUSINESS_HOUR_END
  const isEndTimeWithinBusinessHours =
    (businessHourSlots.includes(endTime) || isEndTimeAtBusinessClose) &&
    compareTimeSlotLabels(endTime, BUSINESS_HOUR_START) > 0 &&
    compareTimeSlotLabels(endTime, BUSINESS_HOUR_END) <= 0

  return isStartTimeValid && isEndTimeWithinBusinessHours
}

export function isValidContinuousBooking(startTime: string, endTime: string): boolean {
  return expandTimeRange(startTime, endTime).length > 0
}

export function validateBookingDraft(draft: BookingDraft): BookingValidationResult {
  const requiredValidation = validateRequiredBookingFields(draft)

  if (!requiredValidation.isValid) {
    return requiredValidation
  }

  const fieldErrors: BookingFieldErrors = {}

  if (!isValidContactPhone(draft.contactPhone)) {
    fieldErrors.contactPhone = '联系电话格式必须为 11 位手机号。'
  }

  if (!isIsoDateString(draft.date)) {
    fieldErrors.date = '预约日期格式必须为 YYYY-MM-DD。'
  }

  if (!isValidBusinessHourBooking(draft.startTime, draft.endTime)) {
    fieldErrors.startTime = `预约时间仅支持 ${BUSINESS_HOUR_START}-${BUSINESS_HOUR_END} 的整点时段。`
  }

  if (!isValidContinuousBooking(draft.startTime, draft.endTime)) {
    fieldErrors.endTime = '预约时间必须为连续且结束时间晚于开始时间的整点时段。'
  }

  return mergeValidationResults(requiredValidation, createValidationResult(fieldErrors))
}

export function validateVenueDraft(draft: VenueDraft): VenueValidationResult {
  const fieldErrors: VenueFieldErrors = {}

  if (isBlank(draft.name)) {
    fieldErrors.name = '请输入场地名称。'
  }

  if (isBlank(draft.location)) {
    fieldErrors.location = '请输入场地位置。'
  }

  if (!Number.isInteger(draft.capacity) || draft.capacity <= 0) {
    fieldErrors.capacity = '容纳人数必须为大于 0 的整数。'
  }

  if (isBlank(draft.description)) {
    fieldErrors.description = '请输入设施描述。'
  }

  if (!Number.isInteger(draft.hourlyPrice) || draft.hourlyPrice < 0) {
    fieldErrors.hourlyPrice = '每小时价格必须为大于等于 0 的整数。'
  }

  return createVenueValidationResult(fieldErrors)
}

export function findBookingConflict(bookings: Booking[], candidate: BookingTimeRange): Booking | null {
  for (const booking of bookings) {
    if (booking.id === candidate.id) {
      continue
    }

    if (booking.venueId !== candidate.venueId) {
      continue
    }

    if (compareIsoDateStrings(booking.date, candidate.date) !== 0) {
      continue
    }

    if (hasBookingOverlap(booking, candidate)) {
      return booking
    }
  }

  return null
}

export function hasFutureVenueBookings(bookings: Booking[], venueId: string, now?: string): boolean {
  return bookings.some(
    (booking) => booking.venueId === venueId && isFutureBookingDateTime(booking.date, booking.startTime, now),
  )
}

export function assertVenueCanDelete(bookings: Booking[], venueId: string, now?: string): void {
  if (hasFutureVenueBookings(bookings, venueId, now)) {
    throw new Error('当前场地存在未来预约，删除前请先处理相关预约。')
  }
}
