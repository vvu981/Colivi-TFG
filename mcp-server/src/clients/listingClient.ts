import { IHttpClient } from "../core/http/types.js";
import { httpClient } from "../core/http/coliviHttpClient.js";

export interface AccommodationResponse {
  id: string;
  address: string;
  city: string;
  country: string;
  province?: string;
  totalRooms: number;
  freeRooms: number;
  amenities: string[];
}

export interface AccommodationListingItem {
  id: string;
  title: string;
  description: string;
  pricePerMonth: number;
  securityDeposit?: number;
  rentalType: string;
  status: string;
  accommodation?: AccommodationResponse;
  hostId?: string;
  hostNickname?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IListingClient {
  searchCatalog(params: {
    city: string;
    maxPrice?: number;
    rentalType?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AccommodationListingItem>>;
}

export class ListingClient implements IListingClient {
  constructor(private readonly http: IHttpClient = httpClient) {}

  public async searchCatalog(params: {
    city: string;
    maxPrice?: number;
    rentalType?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AccommodationListingItem>> {
    const query: Record<string, unknown> = {
      city: params.city,
      page: params.page ?? 0,
      size: params.size ?? 20
    };

    if (params.maxPrice !== undefined) {
      query.maxPrice = params.maxPrice;
    }

    if (params.rentalType) {
      query.rentalType = params.rentalType;
    }

    return this.http.get<PageResponse<AccommodationListingItem>>("/listings", query);
  }
}

export const listingClient = new ListingClient();
