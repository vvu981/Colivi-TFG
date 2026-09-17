import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyListingsPage } from './MyListingsPage';
import * as AuthContext from '../features/auth/context/AuthContext';
import * as useMyListingsHook from '../features/housing/hooks/useMyListings';
import * as useDeleteListingHook from '../features/housing/hooks/useDeleteListing';
import type { AccommodationListingResponse } from '../features/housing/types/listing.types';

vi.mock('../features/auth/context/AuthContext');
vi.mock('../features/housing/hooks/useMyListings');
vi.mock('../features/housing/hooks/useDeleteListing');

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
  accommodation: {
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
  },
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
});
