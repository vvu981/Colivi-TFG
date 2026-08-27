export interface BookingRequestPayload {
  accommodationListingId: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string; // Formato YYYY-MM-DD
  message?: string;
}

export interface BookingRequestResponse {
  id: string;
  listingId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'PAYMENT_PENDING' | 'CONFIRMED';
  createdAt: string;
  updatedAt: string;
}
