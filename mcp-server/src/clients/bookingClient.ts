import { IHttpClient } from "../core/http/types.js";
import { httpClient } from "../core/http/coliviHttpClient.js";
import { PageResponse } from "./listingClient.js";

export type BookingRequestStatus =
  | "PENDING"
  | "REJECTED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED";

export interface BookingRequestItem {
  id: string;
  requesterId: string;
  accommodationListingId: string;
  startDate: string;
  endDate: string;
  message?: string;
  status: BookingRequestStatus;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface IBookingClient {
  getMyBookings(params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<BookingRequestItem>>;
}

export class BookingClient implements IBookingClient {
  constructor(private readonly http: IHttpClient = httpClient) {}

  public async getMyBookings(params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<BookingRequestItem>> {
    const query: Record<string, unknown> = {
      page: params?.page ?? 0,
      size: params?.size ?? 20
    };

    return this.http.get<PageResponse<BookingRequestItem>>("/booking-requests/tenant", query);
  }
}

export const bookingClient = new BookingClient();
