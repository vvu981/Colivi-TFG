// ── Enums ─────────────────────────────────────────────────────────

export type AmenityType =
  | 'HEATING'
  | 'WIFI'
  | 'AIR_CONDITIONING'
  | 'PETS_ALLOWED'
  | 'ELEVATOR'
  | 'BALCONY';

export type AccommodationVisibility = 'AVAILABLE' | 'DELETED' | 'ALL';

// ── Request DTOs ───────────────────────────────────────────────────

export interface AccommodationRequest {
  address: string;
  totalRooms: number;
  totalBathrooms: number;
  freeRooms: number;
  squareMeters: number;
  city: string;
  country: string;
  province: string;
  latitude: number;
  longitude: number;
  amenities: AmenityType[];
}

// ── Response DTOs ──────────────────────────────────────────────────

export interface AccommodationImageResponse {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface AccommodationResponse {
  id: string;
  address: string;
  totalRooms: number;
  totalBathrooms: number;
  freeRooms: number;
  squareMeters: number;
  city: string;
  country: string;
  province: string;
  latitude: number;
  longitude: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  amenities: AmenityType[];
  ownerId: string;
  ownerNickname: string;
  ownerProfilePicUrl?: string;
  images: AccommodationImageResponse[];
}

// ── Pagination ─────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
