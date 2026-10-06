import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePriceHistogram } from './usePriceHistogram';
import type { AccommodationListingResponse } from '../types/listing.types';

describe('usePriceHistogram', () => {
  const mockListings: AccommodationListingResponse[] = [
    {
      id: '1',
      title: 'Habitación céntrica',
      description: 'Descripción 1',
      pricePerMonth: 300,
      securityDeposit: 300,
      rentalType: 'ROOM',
      status: 'AVAILABLE',
      hostId: 'host-1',
      hostNickname: 'Host 1',
      isPromoted: false,
      selectedImages: [],
      createdAt: '2026-01-01',
      accommodation: {
        id: 'acc-1',
        ownerId: 'host-1',
        ownerNickname: 'Host 1',
        address: 'Calle Mayor 1',
        city: 'Madrid',
        province: 'Madrid',
        country: 'España',
        totalRooms: 4,
        freeRooms: 2,
        totalBathrooms: 2,
        squareMeters: 100,
        latitude: 40.4168,
        longitude: -3.7038,
        images: [],
        amenities: [],
        deletedAt: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    },
    {
      id: '2',
      title: 'Estudio entero',
      description: 'Descripción 2',
      pricePerMonth: 800,
      securityDeposit: 800,
      rentalType: 'ENTIRE_PLACE',
      status: 'AVAILABLE',
      hostId: 'host-1',
      hostNickname: 'Host 1',
      isPromoted: false,
      selectedImages: [],
      createdAt: '2026-01-01',
      accommodation: {
        id: 'acc-2',
        ownerId: 'host-1',
        ownerNickname: 'Host 1',
        address: 'Plaza Sol 2',
        city: 'Madrid',
        province: 'Madrid',
        country: 'España',
        totalRooms: 1,
        freeRooms: 1,
        totalBathrooms: 1,
        squareMeters: 40,
        latitude: 40.417,
        longitude: -3.704,
        images: [],
        amenities: [],
        deletedAt: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    },
  ];

  it('computes globalMaxPrice rounded to nearest 10 and creates buckets', () => {
    const { result } = renderHook(() =>
      usePriceHistogram(mockListings, { minPrice: undefined, maxPrice: undefined })
    );

    expect(result.current.globalMaxPrice).toBe(800);
    expect(result.current.globalHistogramData.length).toBe(20);
    // Total items in buckets should equal listing count
    const totalCount = result.current.globalHistogramData.reduce((a, b) => a + b, 0);
    expect(totalCount).toBe(2);
  });

  it('preserves globalMaxPrice across re-renders when price filter is applied and list shrinks', () => {
    const { result, rerender } = renderHook(
      ({ listings, filters }) => usePriceHistogram(listings, filters),
      {
        initialProps: { listings: mockListings, filters: { minPrice: undefined as number | undefined, maxPrice: undefined as number | undefined } },
      }
    );

    expect(result.current.globalMaxPrice).toBe(800);

    // Simulate applying a filter: the input list shrinks to only the cheaper listing
    const filteredListings = mockListings.filter(l => l.pricePerMonth <= 500);
    
    rerender({ listings: filteredListings, filters: { minPrice: 200, maxPrice: 500 } });

    // The maximum should remain 800 (the original max before filtering)
    expect(result.current.globalMaxPrice).toBe(800);
  });
});
