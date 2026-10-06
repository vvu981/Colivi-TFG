import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteListing } from './useDeleteListing';
import { listingService } from '../api/listingService';

vi.mock('../api/listingService', () => ({
  listingService: {
    softDelete: vi.fn(),
  },
}));

describe('useDeleteListing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDeleteListing());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('successfully deletes a listing', async () => {
    vi.mocked(listingService.softDelete).mockResolvedValueOnce();

    const { result } = renderHook(() => useDeleteListing());

    let success = false;
    await act(async () => {
      success = await result.current.deleteListing('test-listing-id');
    });

    expect(success).toBe(true);
    expect(listingService.softDelete).toHaveBeenCalledWith('test-listing-id');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles axios error with custom backend message', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: { message: 'No tienes permisos para eliminar este anuncio' },
      },
    };
    vi.mocked(listingService.softDelete).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useDeleteListing());

    let success = true;
    await act(async () => {
      success = await result.current.deleteListing('test-listing-id');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('No tienes permisos para eliminar este anuncio');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles generic error gracefully', async () => {
    vi.mocked(listingService.softDelete).mockRejectedValueOnce(new Error('Network disconnected'));

    const { result } = renderHook(() => useDeleteListing());

    let success = true;
    await act(async () => {
      success = await result.current.deleteListing('test-listing-id');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Network disconnected');
  });

  it('allows manual reset of error via setError', () => {
    const { result } = renderHook(() => useDeleteListing());

    act(() => {
      result.current.setError('Error puntual');
    });
    expect(result.current.error).toBe('Error puntual');

    act(() => {
      result.current.setError(null);
    });
    expect(result.current.error).toBeNull();
  });
});
