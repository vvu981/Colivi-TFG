import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecommendations } from './useRecommendations';
import * as recommendationsService from '../api/recommendationsService';
import * as authContext from '../../auth/context/AuthContext';
import type { RecommendationResponse } from '../types/listing.types';

vi.mock('../api/recommendationsService', () => ({
  fetchRecommendations: vi.fn(),
}));

vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useRecommendations', () => {
  const mockResponse: RecommendationResponse = {
    items: [],
    totalCount: 0,
    hasCriteria: false,
    fallbackApplied: false,
    criteriaMatchedCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authContext.useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUserContextData: vi.fn(),
    });
    vi.mocked(recommendationsService.fetchRecommendations).mockResolvedValue(mockResponse);
  });

  it('fetches clean recommendations on initial mount without injecting search parameters', async () => {
    const { result } = renderHook(() => useRecommendations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(recommendationsService.fetchRecommendations).toHaveBeenCalledTimes(1);
    expect(recommendationsService.fetchRecommendations).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('passes search parameters when search() is explicitly triggered', async () => {
    const searchParams = { title: 'Madrid', minPrice: 200, maxPrice: 600 };
    const { result } = renderHook(() => useRecommendations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.search(searchParams);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(recommendationsService.fetchRecommendations).toHaveBeenCalledTimes(2);
    expect(recommendationsService.fetchRecommendations).toHaveBeenLastCalledWith(searchParams);
  });

  it('resets to clean recommendations when reset() is called', async () => {
    const { result } = renderHook(() => useRecommendations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.search({ title: 'Sevilla' });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(recommendationsService.fetchRecommendations).toHaveBeenLastCalledWith({ title: 'Sevilla' });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(recommendationsService.fetchRecommendations).toHaveBeenLastCalledWith(undefined);
  });

  it('handles error gracefully when fetchRecommendations fails', async () => {
    vi.mocked(recommendationsService.fetchRecommendations).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useRecommendations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('No se pudieron cargar las recomendaciones. Inténtalo de nuevo más tarde.');
    expect(result.current.data).toBeNull();
  });
});
