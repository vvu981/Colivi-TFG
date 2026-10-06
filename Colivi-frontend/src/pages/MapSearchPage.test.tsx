import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MapSearchPage } from './MapSearchPage';
import * as MapListingsHook from '../features/housing/hooks/useMapListings';
import * as AuthContext from '../features/auth/context/AuthContext';

vi.mock('../features/auth/context/AuthContext');
vi.mock('../features/housing/hooks/useMapListings');
vi.mock('../features/housing/hooks/usePriceHistogram', () => ({
  usePriceHistogram: () => ({
    globalMaxPrice: 1000,
    globalHistogramData: [],
  }),
}));

// Mock leaflet
vi.mock('leaflet', () => {
  const mapInstance = {
    setView: vi.fn(),
    fitBounds: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    getBounds: () => ({
      getWest: () => -3.8,
      getSouth: () => 40.3,
      getEast: () => -3.6,
      getNorth: () => 40.5,
    }),
    getZoom: () => 12,
  };

  return {
    default: {
      map: vi.fn(() => mapInstance),
      latLngBounds: vi.fn(() => ({})),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      divIcon: vi.fn(),
      marker: vi.fn(() => {
        const markerObj = {
          addTo: vi.fn(() => markerObj),
          remove: vi.fn(),
          setLatLng: vi.fn(),
        };
        return markerObj;
      }),
      Icon: {
        Default: {
          prototype: {},
          mergeOptions: vi.fn(),
        },
      },
    },
  };
});

describe('MapSearchPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(MapListingsHook.useMapListings).mockReturnValue({
      listings: [
        {
          id: 'l1',
          title: 'Habitación céntrica',
          description: 'Descripción de prueba',
          pricePerMonth: 450,
          securityDeposit: 450,
          rentalType: 'ROOM',
          status: 'AVAILABLE',
          isPromoted: false,
          selectedImages: [],
          accommodation: {
            id: 'a1',
            address: 'Gran Vía 1',
            city: 'Madrid',
            province: 'Madrid',
            country: 'España',
            latitude: 40.4168,
            longitude: -3.7038,
            images: [],
            amenities: [],
            totalRooms: 3,
            totalBathrooms: 1,
            freeRooms: 1,
            squareMeters: 90,
            ownerId: 'u1',
            ownerNickname: 'Host1',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            deletedAt: null,
          },
          hostId: 'u1',
          hostNickname: 'Host1',
          hostProfilePicUrl: '',
          createdAt: '2024-01-01',
        },
      ],
      isLoading: false,
      error: null,
      search: vi.fn(),
    });
  });

  it('renderiza la página del mapa y el botón de alternancia móvil', () => {
    render(
      <MemoryRouter>
        <MapSearchPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Explorar mapa')).toBeInTheDocument();
    const toggleButton = screen.getByRole('button', { name: /Ver lista/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('permite alternar entre vista de mapa y vista de lista en móvil', () => {
    render(
      <MemoryRouter>
        <MapSearchPage />
      </MemoryRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /Ver lista/i });
    expect(toggleButton).toHaveTextContent(/Ver lista/i);

    // Cambiar a vista de lista
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /Ver mapa/i })).toBeInTheDocument();

    // Volver a vista de mapa
    fireEvent.click(screen.getByRole('button', { name: /Ver mapa/i }));
    expect(screen.getByRole('button', { name: /Ver lista/i })).toBeInTheDocument();
  });
});
