import type { AccommodationResponse, AccommodationImageResponse } from './accommodation.types';

// ── Enums ─────────────────────────────────────────────────────────

export type RentalType = 'ENTIRE_PLACE' | 'ROOM';

export type ListingStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'BANNED';

// ── Request DTOs ───────────────────────────────────────────────────

export interface AccommodationListingRequest {
  accommodationId: string;
  title: string;
  description: string;
  pricePerMonth: number;
  rentalType: RentalType;
  securityDeposit: number;
  selectedImages?: string[];
}

export interface AccommodationListingUpdateRequest {
  title?: string;
  description?: string;
  pricePerMonth?: number;
  securityDeposit?: number;
  selectedImages?: string[];
}

// ── Filter params (query params for GET /api/v1/listings) ──────────

export interface ListingFilterParams {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  requiredFreeRooms?: number;
  rentalType?: RentalType;
  hostId?: string;
  page?: number;
  size?: number;
}

// ── Response DTO ───────────────────────────────────────────────────

export interface AccommodationListingResponse {
  id: string;
  title: string;
  description: string;
  pricePerMonth: number;
  securityDeposit: number;
  status: ListingStatus;
  rentalType: string;
  createdAt: string;
  accommodation: AccommodationResponse;
  hostId: string;
  hostNickname: string;
  isPromoted: boolean;
  selectedImages: AccommodationImageResponse[];
}
