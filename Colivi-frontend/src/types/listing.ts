import { type BaseEntity } from './index';

/** Accommodation types as returned by the backend enum. */
export type AccommodationType = 'ROOM' | 'STUDIO' | 'APARTMENT' | 'HOUSE' | string;

/**
 * DTO returned by GET /api/v1/listings/recommendations (and other listing endpoints).
 * Mirrors the backend AccommodationListingResponse.
 */
export interface AccommodationListingResponse extends BaseEntity {
  title: string;
  description: string;
  city: string;
  address: string;
  pricePerMonth: number;
  accommodationType: AccommodationType;
  availableFrom: string;
  imageUrls: string[];
  isPromoted: boolean;
  hostNickname?: string;
  hostProfilePicUrl?: string;
}
