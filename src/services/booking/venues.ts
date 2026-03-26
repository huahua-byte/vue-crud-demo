import { createDefaultVenueSearchFilter, type StoreActionResult, type Venue, type VenueSearchFilter } from '../../domain/booking'
import { useBookingStore } from '../../stores/useBookingStore'

export async function getVenues(
  filter: VenueSearchFilter = createDefaultVenueSearchFilter(),
): Promise<StoreActionResult<Venue[]>> {
  const store = useBookingStore()

  return store.getVenues(filter)
}

export async function getVenueById(venueId: string): Promise<StoreActionResult<Venue>> {
  const store = useBookingStore()

  return store.getVenueById(venueId)
}

export async function deleteVenue(venueId: string): Promise<StoreActionResult<{ id: string }>> {
  const store = useBookingStore()

  return store.deleteVenue(venueId)
}
