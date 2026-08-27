import api from "../../../lib/api";
import type { BookingRequestPayload, BookingRequestResponse } from '../types/booking.types';

export const bookingRequestService = {
  createBookingRequest: async (payload: BookingRequestPayload): Promise<BookingRequestResponse> => {
    const { data } = await api.post<BookingRequestResponse>('/booking-requests', payload);
    return data;
  }
};
