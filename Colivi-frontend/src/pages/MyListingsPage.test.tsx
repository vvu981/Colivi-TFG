import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyListingsPage } from './MyListingsPage';
import * as AuthContext from '../features/auth/context/AuthContext';
import * as useMyListingsHook from '../features/housing/hooks/useMyListings';
import * as useMyAccommodationsHook from '../features/housing/hooks/useMyAccommodations';
import * as useDeleteListingHook from '../features/housing/hooks/useDeleteListing';
import type { AccommodationListingResponse } from '../features/housing/types/listing.types';
import type { AccommodationResponse } from '../features/housing/types/accommodation.types';

vi.mock('../features/auth/context/AuthContext');
vi.mock('../features/housing/hooks/useMyListings');
vi.mock('../features/housing/hooks/useMyAccommodations');
vi.mock('../features/housing/hooks/useDeleteListing');

const mockAccommodation: AccommodationResponse = {
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
  images: [],
  ownerId: 'host-1',
  ownerNickname: 'HostUser',
  deletedAt: null,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

const mockListing: AccommodationListingResponse = {
  id: 'listing-123',
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
  accommodation: mockAccommodation,
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

    vi.mocked(useMyAccommodationsHook.useMyAccommodations).mockReturnValue({
      accommodations: [mockAccommodation],
      totalElements: 1,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [mockListing],
      totalElements: 1,
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

  it('renders listing cards with action buttons including delete', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Piso amplio en Triana')).toBeInTheDocument();
    expect(screen.getByText('Ver página')).toBeInTheDocument();
    expect(screen.getByTitle('Editar anuncio')).toBeInTheDocument();
    expect(screen.getByTitle('Eliminar anuncio')).toBeInTheDocument();
  });

  it('renders accommodation filter dropdown and filters by selection', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Filtrar por alojamiento') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Todos mis alojamientos (1)')).toBeInTheDocument();
    expect(screen.getByText('Calle Betis 10 (Sevilla)')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'acc-1' } });
    expect(select.value).toBe('acc-1');
    expect(screen.getByText('Limpiar filtro de alojamiento')).toBeInTheDocument();
  });

  it('pre-selects accommodation filter when URL contains accommodationId query param', () => {
    render(
      <MemoryRouter initialEntries={['/my-listings?accommodationId=acc-1']}>
        <MyListingsPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Filtrar por alojamiento') as HTMLSelectElement;
    expect(select.value).toBe('acc-1');
    expect(screen.getByText('Limpiar filtro de alojamiento')).toBeInTheDocument();

    // Clear filter
    fireEvent.click(screen.getByText('Limpiar filtro de alojamiento'));
    expect(select.value).toBe('');
    expect(screen.queryByText('Limpiar filtro de alojamiento')).not.toBeInTheDocument();
  });

  it('renders contextual empty state when filtered accommodation has no listings', () => {
    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [],
      totalElements: 0,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/my-listings?accommodationId=acc-1']}>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No hay anuncios para este alojamiento')).toBeInTheDocument();
    expect(
      screen.getByText(/Este inmueble no cuenta con ningún anuncio activo./)
    ).toBeInTheDocument();
    
    const clearBtn = screen.getByRole('button', { name: 'Ver todos los anuncios' });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    const select = screen.getByLabelText('Filtrar por alojamiento') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('renders general empty state when user has no listings at all', () => {
    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [],
      totalElements: 0,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter initialEntries={['/my-listings']}>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No tienes anuncios publicados')).toBeInTheDocument();
    expect(screen.getByText(/Publica un anuncio sobre alguno de tus alojamientos/)).toBeInTheDocument();
  });

  it('opens confirm delete modal when clicking the delete button', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByTitle('Eliminar anuncio');
    fireEvent.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Eliminar Anuncio')).toBeInTheDocument();
    expect(within(dialog).getByText(/Piso amplio en Triana/)).toBeInTheDocument();
  });

  it('calls deleteListing and refreshes list on confirmation', async () => {
    mockDeleteListing.mockResolvedValueOnce(true);

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    // Open modal
    fireEvent.click(screen.getByTitle('Eliminar anuncio'));

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: 'Eliminar anuncio' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteListing).toHaveBeenCalledWith('listing-123');
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/El anuncio "Piso amplio en Triana" ha sido retirado del catálogo./)
    ).toBeInTheDocument();
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

  it('renders error state when error is present', () => {
    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [],
      totalElements: 0,
      isLoading: false,
      error: 'Error al conectar con el servidor',
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Error al conectar con el servidor')).toBeInTheDocument();
  });

  it('renders listing with sorted images', () => {
    const listingWithImages: AccommodationListingResponse = {
      ...mockListing,
      accommodation: {
        ...mockAccommodation,
        images: [
          { id: 'img-2', imageUrl: 'https://demo.com/img2.jpg', displayOrder: 2 },
          { id: 'img-1', imageUrl: 'https://demo.com/img1.jpg', displayOrder: 1 },
        ],
      },
    };

    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [listingWithImages],
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

    const img = screen.getByRole('img', { name: 'Piso amplio en Triana' }) as HTMLImageElement;
    expect(img.src).toBe('https://demo.com/img1.jpg');
  });

  it('closes delete modal on cancel without performing deletion', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar anuncio'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockDeleteListing).not.toHaveBeenCalled();
  });

  it('renders room rental type, unavailable status and fallback location when accommodation is missing', () => {
    const roomListing: AccommodationListingResponse = {
      ...mockListing,
      id: 'listing-room',
      title: 'Habitación individual',
      rentalType: 'ROOM',
      status: 'UNAVAILABLE',
      accommodation: undefined as any,
    };

    vi.mocked(useMyListingsHook.useMyListings).mockReturnValue({
      listings: [roomListing],
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

    expect(screen.getByText('Habitación individual')).toBeInTheDocument();
    expect(screen.getByText('Habitación')).toBeInTheDocument();
    expect(screen.getByText('Oculto')).toBeInTheDocument();
    expect(screen.getByText('Ubicación no disponible')).toBeInTheDocument();
  });

  it('does not refresh or show banner when delete fails', async () => {
    mockDeleteListing.mockResolvedValueOnce(false);

    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Eliminar anuncio'));
    const confirmBtn = screen.getByRole('button', { name: 'Eliminar anuncio' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteListing).toHaveBeenCalledWith('listing-123');
    });

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/ha sido retirado del catálogo/)).not.toBeInTheDocument();
  });
});
