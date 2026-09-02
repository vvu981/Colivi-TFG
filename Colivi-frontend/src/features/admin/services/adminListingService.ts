import api from '../../../lib/api';
import type { AccommodationListing } from '../../housing/types/listing.types';
import type { AdminListingFilters, PageResponse } from '../types/admin.types';

export const adminListingService = {
  /**
   * Searches and catalogs all listings for administration (including BANNED and soft-deleted).
   */
  searchAllListings: async (
    filters: AdminListingFilters = {},
    page = 0,
    size = 10
  ): Promise<PageResponse<AccommodationListing>> => {
    const params = new URLSearchParams();
    if (filters.id) params.append('id', filters.id);
    if (filters.city) params.append('city', filters.city);
    if (filters.rentalType) params.append('rentalType', filters.rentalType);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.status) params.append('status', filters.status);
    if (filters.title) params.append('title', filters.title);
    if (filters.hostId) params.append('hostId', filters.hostId);
    params.append('page', page.toString());
    params.append('size', size.toString());

    const { data } = await api.get<PageResponse<AccommodationListing>>(
      `/admin/listings?${params.toString()}`
    );
    return data;
  },

  /**
   * Bans a listing from public visibility.
   */
  banListing: async (id: string): Promise<void> => {
    await api.patch(`/listings/ban/${id}`);
  },

  /**
   * Unbans a previously banned listing.
   */
  unbanListing: async (id: string): Promise<void> => {
    await api.patch(`/listings/unban/${id}`);
  },

  /**
   * Permanently hard deletes a listing.
   */
  hardDeleteListing: async (id: string): Promise<void> => {
    await api.delete(`/listings/hardDelete/${id}`);
  },

  /**
   * Recovers a soft-deleted listing.
   */
  recoverListing: async (id: string): Promise<AccommodationListing> => {
    const { data } = await api.patch<AccommodationListing>(`/listings/recover/${id}`);
    return data;
  },

  /**
   * Retrieves single listing details for inspection.
   */
  getListingById: async (id: string): Promise<AccommodationListing> => {
    const { data } = await api.get<AccommodationListing>(`/listings/${id}`);
    return data;
  },
};
