// Export Housing Feature
export * from './components/RecommendedListings';
export * from './components/SearchBar';
export * from './hooks/useRecommendations';
export * from './api/recommendationsService';
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
export { useMapListings } from './hooks/useMapListings';

// Components — Accommodation
export { AccommodationForm } from './components/accommodation/AccommodationForm';
export { AmenitySelector } from './components/accommodation/AmenitySelector';
export { ImageUploader } from './components/accommodation/ImageUploader';
export { MapPicker } from './components/accommodation/MapPicker';

// Components — Listing
export { ListingForm } from './components/listing/ListingForm';

// Components — Map
export { ClusterFan } from './components/map/ClusterFan';
export { MarkerPin } from './components/map/MarkerPin';
export { ClusterBadge } from './components/map/ClusterBadge';

// Utils — Map
export { clusterListings } from './utils/mapUtils';
export type { CoordinateKey, ListingClusterMap } from './utils/mapUtils';

// Hooks — Map
export { useMapClusters } from './hooks/useMapClusters';
export type { MapClusterItem, MacroCluster, ExactFan, SingleLeaf, MapViewport } from './hooks/useMapClusters';
