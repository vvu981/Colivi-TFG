import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ListingHeader } from './ListingHeader';
import type { AccommodationListingResponse } from '../../types/listing.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ListingHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockListing: AccommodationListingResponse = {
    id: 'listing-123',
    title: 'Piso compartido en Gràcia',
    description: 'Piso amplio y luminoso',
    pricePerMonth: 550,
    securityDeposit: 550,
    status: 'AVAILABLE',
    rentalType: 'ROOM',
    createdAt: '2026-08-01T10:00:00Z',
    hostId: 'host-user-999',
    hostNickname: 'Carlos',
    isPromoted: true,
    selectedImages: [],
    accommodation: {
      id: 'acc-1',
      address: 'Carrer Gran 12',
      totalRooms: 4,
      totalBathrooms: 2,
      freeRooms: 1,
      squareMeters: 95,
      city: 'Barcelona',
      province: 'Barcelona',
      country: 'España',
      latitude: 41.38,
      longitude: 2.17,
      deletedAt: null,
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: null,
      ownerId: 'host-user-999',
      ownerNickname: 'Carlos',
      amenities: [],
      images: [],
    },
  };

  it('muestra el botón de denunciar cuando el usuario no es el propietario', () => {
    const onReportClick = vi.fn();
    render(
      <MemoryRouter>
        <ListingHeader
          listing={mockListing}
          currentUserId="other-user-111"
          onReportClick={onReportClick}
        />
      </MemoryRouter>
    );

    const reportButton = screen.getByRole('button', { name: /denunciar anuncio/i });
    expect(reportButton).toBeInTheDocument();

    fireEvent.click(reportButton);
    expect(onReportClick).toHaveBeenCalled();
  });

  it('oculta el botón de denunciar cuando el usuario es el anfitrión del anuncio', () => {
    render(
      <MemoryRouter>
        <ListingHeader
          listing={mockListing}
          currentUserId="host-user-999"
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /denunciar anuncio/i })).not.toBeInTheDocument();
  });

  it('redirige a /login al intentar denunciar sin sesión iniciada', () => {
    render(
      <MemoryRouter>
        <ListingHeader
          listing={mockListing}
          currentUserId={null}
        />
      </MemoryRouter>
    );

    const reportButton = screen.getByRole('button', { name: /denunciar anuncio/i });
    fireEvent.click(reportButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({
      state: expect.any(Object),
    }));
  });

  it('muestra el badge de administración con los IDs para copiar cuando isAdmin es true', () => {
    render(
      <MemoryRouter>
        <ListingHeader
          listing={mockListing}
          currentUserId="admin-user-id"
          isAdmin={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('ADMIN:')).toBeInTheDocument();
    expect(screen.getByText('listing-123')).toBeInTheDocument();
    expect(screen.getByText('host-user-999')).toBeInTheDocument();
  });
});
