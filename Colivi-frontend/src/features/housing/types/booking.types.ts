export interface BookingRequestPayload {
  accommodationListingId: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string; // Formato YYYY-MM-DD
  message?: string;
}

export type BookingRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface BookingRequestResponse {
  id: string;
  accommodationListingId: string;
  requesterId: string;
  startDate: string;
  endDate: string;
  message?: string;
  status: BookingRequestStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface TenantInfo {
  id: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  email?: string;
}

export interface ListingInfo {
  id: string;
  title: string;
  address?: string;
  coverImageUrl?: string;
  pricePerMonth?: number;
  securityDeposit?: number;
}

// Extendido con relaciones para la UI
export interface BookingRequest extends BookingRequestResponse {
  tenant?: TenantInfo;
  listing?: ListingInfo;
  totalPrice: number;
}
