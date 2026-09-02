import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AdminListingsTable } from './AdminListingsTable';
import type { AccommodationListing } from '../../../housing/types/listing.types';

describe('AdminListingsTable', () => {
  const mockListings: AccommodationListing[] = [
    {
      id: 'listing-uuid-1',
      title: 'Habitación en Chamberí',
      description: 'Habitación amplia y luminosa',
      pricePerMonth: 500,
      securityDeposit: 500,
      rentalType: 'ROOM',
      status: 'AVAILABLE',
      accommodation: {
        id: 'acc-1',
        ownerId: 'owner-uuid-1',
        ownerNickname: 'host1',
        city: 'Madrid',
        address: 'Calle Fuencarral 10',
        totalRooms: 3,
        totalBathrooms: 1,
        freeRooms: 1,
        squareMeters: 80,
        country: 'España',
        province: 'Madrid',
        latitude: 40.4168,
        longitude: -3.7038,
        deletedAt: null,
        createdAt: '2026-01-01',
        updatedAt: null,
        amenities: [],
        images: [],
      },
      hostId: 'owner-uuid-1',
      hostNickname: 'host1',
      isPromoted: false,
      selectedImages: [],
      createdAt: '2026-01-01',
    },
  ];

  it('renders listing rows with status and quick action buttons', () => {
    const handleBan = vi.fn();
    render(
      <AdminListingsTable
        listings={mockListings}
        pageInfo={{
          content: mockListings,
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        }}
        page={0}
        size={10}
        isLoading={false}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
        onBanListing={handleBan}
        onUnbanListing={vi.fn()}
        onHardDeleteListing={vi.fn()}
        onRecoverListing={vi.fn()}
      />
    );

    expect(screen.getByText('Habitación en Chamberí')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();

    const banBtn = screen.getByTitle('Banear anuncio');
    fireEvent.click(banBtn);
    expect(handleBan).toHaveBeenCalledWith('listing-uuid-1');
  });

  it('opens confirmation modal when clicking unban listing button', async () => {
    const handleUnban = vi.fn().mockResolvedValue(undefined);
    const bannedListings: AccommodationListing[] = [
      {
        ...mockListings[0],
        status: 'BANNED',
      },
    ];

    await act(async () => {
      render(
        <AdminListingsTable
          listings={bannedListings}
          pageInfo={{
            content: bannedListings,
            totalElements: 1,
            totalPages: 1,
            size: 10,
            number: 0,
          }}
          page={0}
          size={10}
          isLoading={false}
          onPageChange={vi.fn()}
          onSizeChange={vi.fn()}
          onBanListing={vi.fn()}
          onUnbanListing={handleUnban}
          onHardDeleteListing={vi.fn()}
          onRecoverListing={vi.fn()}
        />
      );
    });

    const unbanBtn = screen.getByTitle('Desbanear anuncio');
    await act(async () => {
      fireEvent.click(unbanBtn);
    });

    expect(screen.getByText('¿Desbanear este anuncio?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, desbanear anuncio/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(handleUnban).toHaveBeenCalledWith('listing-uuid-1');
    });
  });
});
