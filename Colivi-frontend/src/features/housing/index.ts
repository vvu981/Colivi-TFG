// ── Housing Feature Public API ─────────────────────────────────────

// Types
export type { AccommodationRequest, AccommodationResponse, AccommodationImageResponse, AmenityType } from './types/accommodation.types';
export type { AccommodationListingRequest, AccommodationListingResponse, RentalType, ListingStatus } from './types/listing.types';

// Services
export { accommodationService } from './api/accommodationService';
export { listingService } from './api/listingService';

// Hooks
export { useCreateAccommodation } from './hooks/useCreateAccommodation';
export { useMyAccommodations } from './hooks/useMyAccommodations';
export { useCreateListing } from './hooks/useCreateListing';

// Components — Accommodation
export { AccommodationForm } from './components/accommodation/AccommodationForm';
export { AmenitySelector } from './components/accommodation/AmenitySelector';
export { ImageUploader } from './components/accommodation/ImageUploader';
export { MapPicker } from './components/accommodation/MapPicker';

// Components — Listing
export { ListingForm } from './components/listing/ListingForm';