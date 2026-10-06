import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteAccommodation } from './useDeleteAccommodation';
import { accommodationService } from '../api/accommodationService';
import type { AccommodationResponse } from '../types/accommodation.types';

vi.mock('../api/accommodationService', () => ({
  accommodationService: {
    softDelete: vi.fn(),
  },
}));

describe('useDeleteAccommodation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDeleteAccommodation());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('successfully deletes an accommodation', async () => {
    vi.mocked(accommodationService.softDelete).mockResolvedValueOnce({} as AccommodationResponse);

    const { result } = renderHook(() => useDeleteAccommodation());

    let success = false;
    await act(async () => {
      success = await result.current.deleteAccommodation('test-acc-id');
    });

    expect(success).toBe(true);
    expect(accommodationService.softDelete).toHaveBeenCalledWith('test-acc-id');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles axios error with custom backend message (e.g. active listings present)', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: { message: 'No es posible eliminar el alojamiento porque todavía tiene anuncios activos asociados.' },
      },
    };
    vi.mocked(accommodationService.softDelete).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useDeleteAccommodation());

    let success = true;
    await act(async () => {
      success = await result.current.deleteAccommodation('test-acc-id');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('No es posible eliminar el alojamiento porque todavía tiene anuncios activos asociados.');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles axios error fallback message when response data has no message', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: {},
      },
    };
    vi.mocked(accommodationService.softDelete).mockRejectedValueOnce(axiosError);

    const { result } = renderHook(() => useDeleteAccommodation());

    let success = true;
    await act(async () => {
      success = await result.current.deleteAccommodation('test-acc-id');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Error al eliminar el alojamiento.');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles standard Error instances', async () => {
    vi.mocked(accommodationService.softDelete).mockRejectedValueOnce(new Error('Network disconnected'));

    const { result } = renderHook(() => useDeleteAccommodation());

    let success = true;
    await act(async () => {
      success = await result.current.deleteAccommodation('test-acc-id');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Network disconnected');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles unexpected non-Error objects', async () => {
    vi.mocked(accommodationService.softDelete).mockRejectedValueOnce('unexpected string error');

    const { result } = renderHook(() => useDeleteAccommodation());

    let success = true;
    await act(async () => {
      success = await result.current.deleteAccommodation('test-acc-id');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Ocurrió un error inesperado al eliminar el alojamiento.');
    expect(result.current.isLoading).toBe(false);
  });

  it('allows manual reset of error via setError', () => {
    const { result } = renderHook(() => useDeleteAccommodation());

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
