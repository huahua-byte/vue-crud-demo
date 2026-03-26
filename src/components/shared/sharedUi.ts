import type { ValidationResult } from '../../domain/booking'

export interface SharedValidationMessages {
  fieldErrors: Record<string, string | undefined>
  generalErrors: string[]
}

export function mapValidationToMessages(
  validation: ValidationResult | undefined,
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

export const mapBookingValidationToMessages = mapValidationToMessages
