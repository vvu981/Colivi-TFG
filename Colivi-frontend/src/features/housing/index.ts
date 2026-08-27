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
export { useGetListing } from './hooks/useGetListing';
export { useMapListings } from './hooks/useMapListings';

// Components — Accommodation
export { AccommodationForm } from './components/accommodation/AccommodationForm';
export { AmenitySelector } from './components/accommodation/AmenitySelector';
export { ImageUploader } from './components/accommodation/ImageUploader';
export { MapPicker } from './components/accommodation/MapPicker';

// Components — Listing
export { ListingForm } from './components/listing/ListingForm';
export { ListingHeader } from './components/listing/ListingHeader';
export { ListingGallery } from './components/listing/ListingGallery';
export { ListingSpecs } from './components/listing/ListingSpecs';
export { ListingHostCard } from './components/listing/ListingHostCard';
export { ListingAmenitiesView } from './components/listing/ListingAmenitiesView';
export { ListingLocationMap } from './components/listing/ListingLocationMap';
export { ListingBookingCard } from './components/listing/ListingBookingCard';
export { SiblingRoomsSection } from './components/listing/SiblingRoomsSection';

// Components — Map
export { ClusterFan } from './components/map/ClusterFan';
export { MarkerPin } from './components/map/MarkerPin';
export { ClusterBadge } from './components/map/ClusterBadge';

// Utils & Theme — Map
export { clusterListings } from './utils/mapUtils';
export type { CoordinateKey, ListingClusterMap } from './utils/mapUtils';
export { MAP_THEME } from './components/map/mapTheme';
export type { MapThemeConfig, MapPinTheme, MapTileTheme, MapBadgeTheme, MapClusterTheme } from './components/map/mapTheme';

// Hooks — Map
export { useMapClusters } from './hooks/useMapClusters';
export type { MapClusterItem, MacroCluster, ExactFan, SingleLeaf, MapViewport } from './hooks/useMapClusters';
