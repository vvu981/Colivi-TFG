import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyListingsPage } from './MyListingsPage';
import * as AuthContext from '../features/auth/context/AuthContext';
import * as useMyListingsHook from '../features/housing/hooks/useMyListings';
import * as useDeleteListingHook from '../features/housing/hooks/useDeleteListing';
import type { AccommodationListingResponse } from '../features/housing/types/listing.types';
import type { AccommodationResponse } from '../features/housing/types/accommodation.types';

vi.mock('../features/auth/context/AuthContext');
vi.mock('../features/housing/hooks/useMyListings');
vi.mock('../features/housing/hooks/useDeleteListing');

const mockAccommodation1: AccommodationResponse = {
  id: 'acc-1',
  address: 'Calle Betis 10',
  city: 'Sevilla',
  province: 'Sevilla',
  country: 'España',
  latitude: 37.38,
  longitude: -5.99,
  totalRooms: 3,
  totalBathrooms: 2,
  freeRooms: 1,
  squareMeters: 90,
  amenities: ['ELEVATOR'],
  images: [
    { id: 'img-1', imageUrl: 'https://demo.com/betis.jpg', displayOrder: 1 },
    { id: 'img-2', imageUrl: 'https://demo.com/betis2.jpg', displayOrder: 2 },
  ],
  ownerId: 'host-1',
  ownerNickname: 'HostUser',
  deletedAt: null,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

const mockAccommodation2: AccommodationResponse = {
  id: 'acc-2',
  address: 'Calle Sierpes 45',
  city: 'Sevilla',
  province: 'Sevilla',
  country: 'España',
  latitude: 37.39,
  longitude: -5.99,
  totalRooms: 4,
  totalBathrooms: 2,
  freeRooms: 2,
  squareMeters: 110,
  amenities: ['WIFI'],
  images: [],
  ownerId: 'host-1',
  ownerNickname: 'HostUser',
  deletedAt: null,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

const mockListing1: AccommodationListingResponse = {
  id: 'listing-1',
  title: 'Piso amplio en Triana',
  description: 'Excelente piso luminoso junto al río.',
  rentalType: 'ENTIRE_PLACE',
  pricePerMonth: 750,
  securityDeposit: 750,
  status: 'AVAILABLE',
  isPromoted: false,
  selectedImages: [],
  createdAt: '2026-09-01T10:00:00Z',
  deletedAt: null,
  hostId: 'host-1',
  hostNickname: 'HostUser',
  accommodation: mockAccommodation1,
};

const mockListing2: AccommodationListingResponse = {
  id: 'listing-2',
  title: 'Habitación 1 en Calle Betis',
  description: 'Habitación con balcón exterior.',
  rentalType: 'ROOM',
  pricePerMonth: 350,
  securityDeposit: 350,
  status: 'UNAVAILABLE',
  isPromoted: false,
  selectedImages: [],
  createdAt: '2026-09-02T10:00:00Z',
  deletedAt: null,
  hostId: 'host-1',
  hostNickname: 'HostUser',
  accommodation: mockAccommodation1,
};

const mockListing3: AccommodationListingResponse = {
  id: 'listing-3',
  title: 'Habitación centro Sierpes',
  description: 'Habitación tranquila en el centro.',
  rentalType: 'ROOM',
  pricePerMonth: 400,
  securityDeposit: 400,
  status: 'AVAILABLE',
  isPromoted: false,
  selectedImages: [],
  createdAt: '2026-09-03T10:00:00Z',
  deletedAt: null,
  hostId: 'host-1',
  hostNickname: 'HostUser',
  accommodation: mockAccommodation2,
};

describe('MyListingsPage', () => {
  const mockRefetch = vi.fn();
  const mockDeleteListing = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'host-1', email: 'host@test.com', role: 'HOST' } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      reactivateAccount: vi.fn(),
      updateUserContextData: vi.fn(),
      token: 'fake-token',
    });

    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [mockListing1, mockListing2, mockListing3],
      totalElements: 3,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    vi.mocked(useDeleteListingHook.useDeleteListing).mockReturnValue({
      deleteListing: mockDeleteListing,
      isLoading: false,
      error: null,
      setError: mockSetError,
    });
  });

  it('classifies and renders listings grouped by accommodation with headers and counts', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    // Section for Accommodation 1
    const sec1 = document.getElementById('accommodation-acc-1');
    expect(sec1).toBeInTheDocument();
    expect(within(sec1!).getByText('Calle Betis 10')).toBeInTheDocument();
    expect(within(sec1!).getByText(/Sevilla, Sevilla - 3 hab. \(90 m²\)/)).toBeInTheDocument();
    expect(within(sec1!).getByText('2 anuncios')).toBeInTheDocument();
    expect(within(sec1!).getByText('Piso amplio en Triana')).toBeInTheDocument();
    expect(within(sec1!).getByText('Habitación 1 en Calle Betis')).toBeInTheDocument();

    // Section for Accommodation 2
    const sec2 = document.getElementById('accommodation-acc-2');
    expect(sec2).toBeInTheDocument();
    expect(within(sec2!).getByText('Calle Sierpes 45')).toBeInTheDocument();
    expect(within(sec2!).getByText(/Sevilla, Sevilla - 4 hab. \(110 m²\)/)).toBeInTheDocument();
    expect(within(sec2!).getByText('1 anuncio')).toBeInTheDocument();
    expect(within(sec2!).getByText('Habitación centro Sierpes')).toBeInTheDocument();
  });

  it('renders listing cards with action buttons and details', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Piso completo')).toBeInTheDocument();
    expect(screen.getAllByText('Habitación').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Disponible').length).toBeGreaterThan(0);
    expect(screen.getByText('Oculto')).toBeInTheDocument();
    expect(screen.getAllByText('Ver página').length).toBe(3);
    expect(screen.getAllByTitle('Editar anuncio').length).toBe(3);
    expect(screen.getAllByTitle('Eliminar anuncio').length).toBe(3);
  });

  it('renders loading state when isLoading is true', () => {
    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [],
      totalElements: 0,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Mis anuncios')).toBeInTheDocument();
  });

  it('renders error state when fetch error occurs', () => {
    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [],
      totalElements: 0,
      isLoading: false,
      error: 'Error al cargar tus anuncios.',
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Error al cargar tus anuncios.')).toBeInTheDocument();
  });

  it('renders empty state when user has no listings', () => {
    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [],
      totalElements: 0,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No tienes anuncios publicados')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Publicar anuncio/ }).length).toBeGreaterThan(0);
  });

  it('handles fallback when listing has no associated accommodation', () => {
    const orphanedListing: AccommodationListingResponse = {
      ...mockListing1,
      id: 'listing-orphaned',
      accommodation: undefined as any,
    };

    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [orphanedListing],
      totalElements: 1,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Alojamiento no especificado')).toBeInTheDocument();
    expect(screen.getByText('Inmueble desvinculado')).toBeInTheDocument();
    expect(screen.getByText('Ubicación no disponible')).toBeInTheDocument();
  });

  it('opens and cancels delete modal without deleting', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const deleteBtns = screen.getAllByTitle('Eliminar anuncio');
    fireEvent.click(deleteBtns[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Eliminar Anuncio')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteListing).not.toHaveBeenCalled();
  });

  it('calls deleteListing and refreshes list on confirmation', async () => {
    mockDeleteListing.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const deleteBtns = screen.getAllByTitle('Eliminar anuncio');
    fireEvent.click(deleteBtns[0]);

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar anuncio' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteListing).toHaveBeenCalledWith('listing-1');
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/El anuncio "Piso amplio en Triana" ha sido retirado del catálogo./)
    ).toBeInTheDocument();
  });

  it('does not refresh list or show banner when delete fails', async () => {
    mockDeleteListing.mockResolvedValueOnce(false);

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const deleteBtns = screen.getAllByTitle('Eliminar anuncio');
    fireEvent.click(deleteBtns[0]);

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar anuncio' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteListing).toHaveBeenCalledWith('listing-1');
    });

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/ha sido retirado del catálogo/)).not.toBeInTheDocument();
  });

  it('does not close modal while isDeleting is true', () => {
    vi.mocked(useDeleteListingHook.useDeleteListing).mockReturnValue({
      deleteListing: mockDeleteListing,
      isLoading: true,
      error: null,
      setError: mockSetError,
    });

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const deleteBtns = screen.getAllByTitle('Eliminar anuncio');
    fireEvent.click(deleteBtns[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    expect(cancelBtn).toBeDisabled();
    fireEvent.click(cancelBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('automatically hides the success banner after timeout', async () => {
    vi.useFakeTimers();
    mockDeleteListing.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const deleteBtns = screen.getAllByTitle('Eliminar anuncio');
    fireEvent.click(deleteBtns[0]);

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar anuncio' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(
      screen.getByText(/El anuncio "Piso amplio en Triana" ha sido retirado del catálogo./)
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(
      screen.queryByText(/El anuncio "Piso amplio en Triana" ha sido retirado del catálogo./)
    ).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
