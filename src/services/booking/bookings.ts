import {
  createDefaultBookingFilter,
  type Booking,
  type BookingDraft,
  type BookingFilter,
  type StoreActionResult,
} from '../../domain/booking'
import { useBookingStore } from '../../stores/useBookingStore'

export async function getBookings(
  filter: BookingFilter = createDefaultBookingFilter(),
): Promise<StoreActionResult<Booking[]>> {
  const store = useBookingStore()

  return store.getBookings(filter)
}

export async function createBooking(draft: BookingDraft): Promise<StoreActionResult<Booking>> {
  const store = useBookingStore()

  return store.createBooking(draft)
}

export async function cancelBooking(bookingId: string): Promise<StoreActionResult<Booking>> {
  const store = useBookingStore()

  return store.cancelBooking(bookingId)
}
