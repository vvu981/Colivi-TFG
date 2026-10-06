import api from "../../../lib/api";
import type { BookingRequestPayload, BookingRequestResponse, BookingRequest, BookingRequestStatus } from '../types/booking.types';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

import { listingService } from './listingService';
import { userService } from '../../user/services/userService';

export const bookingRequestService = {
  createBookingRequest: async (payload: BookingRequestPayload): Promise<BookingRequestResponse> => {
    const { data } = await api.post<BookingRequestResponse>('/booking-requests', payload);
    return data;
  },

  getMyRequests: async (): Promise<BookingRequest[]> => {
    const { data } = await api.get<PageResponse<BookingRequestResponse>>('/booking-requests/tenant');
    
    // Populamos la información del listing (precio, imagen, ubicación)
    const populated = await Promise.all(data.content.map(async (req) => {
      try {
        const listing = await listingService.getById(req.accommodationListingId);
        return {
          ...req,
          totalPrice: listing.pricePerMonth,
          listing: {
            id: listing.id,
            title: listing.title,
            address: listing.accommodation?.address || 'Ubicación no especificada',
            coverImageUrl: listing.selectedImages?.[0]?.imageUrl || listing.accommodation?.images?.[0]?.imageUrl
          }
        };
      } catch (err) {
        console.error(`Error fetching listing ${req.accommodationListingId}`, err);
        return { ...req, totalPrice: 0 } as BookingRequest;
      }
    }));
    return populated;
  },

  getListingRequests: async (listingId?: string): Promise<BookingRequest[]> => {
    const params = listingId ? { listingId } : undefined;
    const { data } = await api.get<PageResponse<BookingRequestResponse>>('/booking-requests/landlord', {
      params
    });
    
    // Si tenemos el listingId específico, optimizamos obteniendo el precio una vez
    let specificListingPrice = 0;
    if (listingId) {
      try {
        const listing = await listingService.getById(listingId);
        specificListingPrice = listing.pricePerMonth;
      } catch (e) {
        console.error(`Error fetching listing price ${listingId}`, e);
      }
    }

    const populated = await Promise.all(data.content.map(async (req) => {
      try {
        const user = await userService.getById(req.requesterId);
        
        let reqPrice = specificListingPrice;
        let reqListing = undefined;

        // Si es búsqueda global (todas las solicitudes del landlord), necesitamos poblar cada anuncio individualmente
        if (!listingId) {
          try {
            const reqList = await listingService.getById(req.accommodationListingId);
            reqPrice = reqList.pricePerMonth;
            reqListing = {
              id: reqList.id,
              title: reqList.title,
              address: reqList.accommodation?.address || 'Ubicación no especificada',
              coverImageUrl: reqList.selectedImages?.[0]?.imageUrl || reqList.accommodation?.images?.[0]?.imageUrl
            };
          } catch (e) {
            console.error(`Error fetching individual listing ${req.accommodationListingId}`, e);
          }
        }

        return {
          ...req,
          totalPrice: reqPrice,
          listing: reqListing, // Puede ser útil en la vista global
          tenant: {
            id: user.id,
            firstName: user.firstName,
            lastName: [user.lastName1, user.lastName2].filter(Boolean).join(' ') || user.nickname || '',
            profilePictureUrl: user.profilePicUrl || undefined,
          }
        };
      } catch (err) {
        console.error(`Error fetching user ${req.requesterId}`, err);
        return { ...req, totalPrice: specificListingPrice } as BookingRequest;
      }
    }));
    return populated;
  },

  updateRequestStatus: async (id: string, status: BookingRequestStatus): Promise<BookingRequestResponse> => {
    // El backend espera status como @RequestParam, por lo que va en la URL
    const { data } = await api.patch<BookingRequestResponse>(`/booking-requests/${id}/status`, null, {
      params: { status }
    });
    return data;
  },

  confirmPayment: async (id: string, paymentData: { paymentToken: string, paymentMethod: string }): Promise<BookingRequestResponse> => {
    const { data } = await api.post<BookingRequestResponse>(`/booking-requests/${id}/confirm-payment`, paymentData);
    return data;
  },

  getPendingRequestsCount: async (): Promise<number> => {
    const { data } = await api.get<{ count: number }>('/booking-requests/landlord/pending-count');
    return data.count;
  },

  getById: async (id: string): Promise<BookingRequest> => {
    const { data } = await api.get<BookingRequestResponse>(`/booking-requests/${id}`);
    
    let reqPrice = 0;
    let reqListing = undefined;
    try {
      const listing = await listingService.getById(data.accommodationListingId);
      reqPrice = listing.pricePerMonth;
      reqListing = {
        id: listing.id,
        title: listing.title,
        address: listing.accommodation?.address || 'Ubicación no especificada',
        coverImageUrl: listing.selectedImages?.[0]?.imageUrl || listing.accommodation?.images?.[0]?.imageUrl
      };
    } catch (e) {
      console.error(`Error fetching listing for request ${id}`, e);
    }

    let reqTenant = undefined;
    try {
      const user = await userService.getById(data.requesterId);
      reqTenant = {
        id: user.id,
        firstName: user.firstName,
        lastName: [user.lastName1, user.lastName2].filter(Boolean).join(' ') || user.nickname || '',
        profilePictureUrl: user.profilePicUrl || undefined,
      };
    } catch (e) {
      console.error(`Error fetching tenant user for request ${id}`, e);
    }

    return {
      ...data,
      totalPrice: reqPrice,
      listing: reqListing,
      tenant: reqTenant
    };
  }
};
