import type { BookingFieldErrors, BookingValidationResult } from '../../domain/booking'

export interface SharedValidationMessages {
  fieldErrors: BookingFieldErrors
  generalErrors: string[]
}

export function mapBookingValidationToMessages(
  validation: BookingValidationResult | undefined,
): SharedValidationMessages {
  if (validation === undefined) {
    return {
      fieldErrors: {},
      generalErrors: [],
    }
  }

  return {
    fieldErrors: { ...validation.fieldErrors },
    generalErrors: [...validation.generalErrors],
  }
}
