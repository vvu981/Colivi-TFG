import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMapClusters, type MapViewport } from './useMapClusters';
import type { AccommodationListingResponse } from '../types/listing.types';

const mockListing = (
  id: string,
  lat: number,
  lng: number,
  accId = 'acc-1',
): AccommodationListingResponse => ({
  id,
  title: `Listing ${id}`,
  description: 'Test description',
  pricePerMonth: 500,
  securityDeposit: 500,
  rentalType: 'ROOM',
  status: 'AVAILABLE',
  createdAt: '2026-01-01T00:00:00Z',
  hostId: 'user-1',
  hostNickname: 'JohnDoe',
  isPromoted: false,
  selectedImages: [],
  accommodation: {
    id: accId,
    address: 'Calle Mayor 1',
    city: 'Madrid',
    country: 'Spain',
    province: 'Madrid',
    latitude: lat,
    longitude: lng,
    totalRooms: 3,
    totalBathrooms: 2,
    freeRooms: 1,
    squareMeters: 90,
    amenities: [],
    images: [],
    ownerId: 'user-1',
    ownerNickname: 'JohnDoe',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    deletedAt: null,
  },
});

describe('useMapClusters', () => {
  const globalViewport: MapViewport = {
    bounds: [-180, -85, 180, 85],
    zoom: 4,
  };

  it('returns empty array when listings are empty', () => {
    const { result } = renderHook(() => useMapClusters([], globalViewport));
    expect(result.current).toEqual([]);
  });

  it('renders a single leaf when there is only one listing in viewport', () => {
    const listings = [mockListing('1', 40.4168, -3.7038)];
    const { result } = renderHook(() => useMapClusters(listings, globalViewport));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('leaf');
    if (result.current[0].type === 'leaf') {
      expect(result.current[0].listing.id).toBe('1');
    }
  });

  it('aggregates nearby listings into a macro cluster at low zoom', () => {
    const listings = [
      mockListing('1', 40.4168, -3.7038),
      mockListing('2', 40.42, -3.71),
      mockListing('3', 40.41, -3.69),
    ];
    const { result } = renderHook(() => useMapClusters(listings, globalViewport));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('cluster');
    if (result.current[0].type === 'cluster') {
      expect(result.current[0].count).toBe(3);
    }
  });

  it('returns a fan when multiple listings share the exact same coordinate', () => {
    const listings = [
      mockListing('1', 40.4168, -3.7038, 'building-a'),
      mockListing('2', 40.4168, -3.7038, 'building-a'),
    ];
    const highZoomViewport: MapViewport = {
      bounds: [-3.8, 40.3, -3.6, 40.5],
      zoom: 16,
    };
    const { result } = renderHook(() => useMapClusters(listings, highZoomViewport));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].type).toBe('fan');
    if (result.current[0].type === 'fan') {
      expect(result.current[0].listings).toHaveLength(2);
    }
  });
});
