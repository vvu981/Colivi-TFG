import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { useMyListings } from './useMyListings';
import { listingService } from '../api/listingService';
import * as AuthContext from '../../auth/context/AuthContext';

vi.mock('../api/listingService');
vi.mock('../../auth/context/AuthContext');

describe('useMyListings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not trigger fetch if user is not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any);

    const { result } = renderHook(() => useMyListings(0, 10));

    expect(result.current.listings).toEqual([]);
    expect(result.current.totalElements).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(listingService.search).not.toHaveBeenCalled();
  });

  it('fetches listings successfully without accommodationId', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'host-123' },
      isAuthenticated: true,
    } as any);

    const mockResponse = {
      content: [
        { id: 'l1', title: 'Listing 1' },
        { id: 'l2', title: 'Listing 2' },
      ],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(listingService.search).mockResolvedValueOnce(mockResponse as any);

    const { result } = renderHook(() => useMyListings(0, 10));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listingService.search).toHaveBeenCalledWith({
      hostId: 'host-123',
      page: 0,
      size: 10,
    });
    expect(result.current.listings).toHaveLength(2);
    expect(result.current.totalElements).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('fetches listings filtered by accommodationId when provided', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'host-123' },
      isAuthenticated: true,
    } as any);

    const mockResponse = {
      content: [{ id: 'l-acc-1', title: 'Listing for Accommodation' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    vi.mocked(listingService.search).mockResolvedValueOnce(mockResponse as any);

    const { result } = renderHook(() => useMyListings(0, 10, 'acc-xyz'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listingService.search).toHaveBeenCalledWith({
      hostId: 'host-123',
      page: 0,
      size: 10,
      accommodationId: 'acc-xyz',
    });
    expect(result.current.listings).toHaveLength(1);
    expect(result.current.totalElements).toBe(1);
  });

  it('handles axios error with backend message', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'host-123' },
      isAuthenticated: true,
    } as any);

    const axiosError = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        data: { message: 'Filtro no válido' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );

    vi.mocked(listingService.search).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useMyListings(0, 10));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Filtro no válido');
    expect(result.current.listings).toEqual([]);
  });

  it('handles axios error fallback and generic error', async () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'host-123' },
      isAuthenticated: true,
    } as any);

    // Axios error without message
    const emptyAxiosError = new AxiosError('Network Error');
    vi.mocked(listingService.search).mockRejectedValueOnce(emptyAxiosError);

    const { result } = renderHook(() => useMyListings(0, 10));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Error al cargar tus anuncios.');

    // Generic error
    vi.mocked(listingService.search).mockRejectedValueOnce(new Error('Unknown crash'));
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Error inesperado al cargar tus anuncios.');
    });
  });

  it('cancels pending requests on unmount', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'host-123' },
      isAuthenticated: true,
    } as any);

    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(listingService.search).mockReturnValue(promise as any);

    const { result, unmount } = renderHook(() => useMyListings(0, 10));
    expect(result.current.isLoading).toBe(true);

    unmount();
    resolvePromise!({ content: [], totalElements: 0 });
    // Should not throw or crash on cancelled state update
  });
});
