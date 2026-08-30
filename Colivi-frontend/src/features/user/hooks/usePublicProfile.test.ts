import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePublicProfile } from './usePublicProfile';
import { userService } from '../services/userService';
import { listingService } from '../../housing/api/listingService';
import * as authContext from '../../auth/context/AuthContext';
import type { PublicUserProfile } from '../types/user.types';
import type { Page } from '../../housing/types/accommodation.types';
import type { AccommodationListingResponse } from '../../housing/types/listing.types';

vi.mock('../services/userService', () => ({
  userService: {
    getById: vi.fn(),
  },
}));

vi.mock('../../housing/api/listingService', () => ({
  listingService: {
    search: vi.fn(),
  },
}));

vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('usePublicProfile', () => {
  const mockUser: PublicUserProfile = {
    id: 'user-uuid-123',
    nickname: 'carlos_host',
    firstName: 'Carlos',
    lastName1: 'López',
    lastName2: 'Ruiz',
    profilePicUrl: 'https://example.com/avatar.jpg',
    createdAt: '2025-01-15T12:00:00Z',
  };

  const mockListingsPage: Page<AccommodationListingResponse> = {
    content: [
      {
        id: 'listing-1',
        title: 'Habitación céntrica en piso compartido',
        description: 'Piso amplio con terraza',
        pricePerMonth: 450,
        securityDeposit: 450,
        status: 'AVAILABLE',
        rentalType: 'ROOM',
        createdAt: '2025-02-01T10:00:00Z',
        accommodation: {
          id: 'acc-1',
          title: 'Casa Centro',
          address: 'Calle Mayor 10',
          city: 'Madrid',
          province: 'Madrid',
          country: 'España',
          postalCode: '28013',
          totalRooms: 4,
          totalBathrooms: 2,
          squareMeters: 120,
          propertyType: 'FLAT',
          images: [],
        },
        hostId: 'user-uuid-123',
        hostNickname: 'carlos_host',
        hostProfilePicUrl: 'https://example.com/avatar.jpg',
        isPromoted: false,
        selectedImages: [],
      },
    ],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'other-user-999', email: 'other@test.com', firstName: 'Other', lastName1: 'User', nickname: 'other', role: 'USER', phone: null, profilePicUrl: null, createdAt: '' },
      token: 'jwt-token',
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
    });
    vi.mocked(userService.getById).mockResolvedValue(mockUser);
    vi.mocked(listingService.search).mockResolvedValue(mockListingsPage);
  });

  it('carga correctamente los datos del usuario y sus anuncios', async () => {
    const { result } = renderHook(() => usePublicProfile('user-uuid-123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(userService.getById).toHaveBeenCalledWith('user-uuid-123');
    expect(listingService.search).toHaveBeenCalledWith({ hostId: 'user-uuid-123', size: 20 });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.listings).toEqual(mockListingsPage.content);
    expect(result.current.isSelf).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('detecta correctamente si el perfil consultado es el propio', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-uuid-123', email: 'carlos@test.com', firstName: 'Carlos', lastName1: 'López', nickname: 'carlos_host', role: 'USER', phone: null, profilePicUrl: null, createdAt: '' },
      token: 'jwt-token',
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
    });

    const { result } = renderHook(() => usePublicProfile('user-uuid-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSelf).toBe(true);
  });

  it('maneja el error 404 cuando el usuario no existe', async () => {
    vi.mocked(userService.getById).mockRejectedValueOnce({
      response: { status: 404, data: { message: 'Error: Usuario no encontrado' } },
    });

    const { result } = renderHook(() => usePublicProfile('non-existing-id'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Error: Usuario no encontrado');
  });

  it('establece error cuando no se pasa un userId', async () => {
    const { result } = renderHook(() => usePublicProfile(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('ID de usuario no especificado.');
  });

  it('si falla la carga de anuncios, mantiene el perfil del usuario con lista vacía', async () => {
    vi.mocked(listingService.search).mockRejectedValueOnce(new Error('Listings service error'));

    const { result } = renderHook(() => usePublicProfile('user-uuid-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.listings).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('refetch vuelve a consultar los datos', async () => {
    const { result } = renderHook(() => usePublicProfile('user-uuid-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(userService.getById).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(userService.getById).toHaveBeenCalledTimes(2);
  });
});
