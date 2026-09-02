import { useState, useEffect, useCallback } from 'react';
import { adminListingService } from '../services/adminListingService';
import type { AccommodationListing } from '../../housing/types/listing.types';
import type { AdminListingFilters, PageResponse } from '../types/admin.types';

export const useAdminListings = (initialPageSize = 10) => {
  const [listingsPage, setListingsPage] = useState<PageResponse<AccommodationListing> | null>(null);
  const [filters, setFilters] = useState<AdminListingFilters>({});
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(initialPageSize);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeListing, setActiveListing] = useState<AccommodationListing | null>(null);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminListingService.searchAllListings(filters, page, size);
      setListingsPage(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los anuncios.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, size]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const setFilter = useCallback((key: keyof AdminListingFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const setAllFilters = useCallback((newFilters: AdminListingFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(0);
  }, []);

  const banListing = async (id: string) => {
    try {
      await adminListingService.banListing(id);
      await fetchListings();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al banear el anuncio.');
    }
  };

  const unbanListing = async (id: string) => {
    try {
      await adminListingService.unbanListing(id);
      await fetchListings();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al desbanear el anuncio.');
    }
  };

  const hardDeleteListing = async (id: string) => {
    try {
      await adminListingService.hardDeleteListing(id);
      if (activeListing?.id === id) {
        setActiveListing(null);
      }
      await fetchListings();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar físicamente el anuncio.');
    }
  };

  const recoverListing = async (id: string) => {
    try {
      const recovered = await adminListingService.recoverListing(id);
      await fetchListings();
      return recovered;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al recuperar el anuncio.');
    }
  };

  return {
    listings: listingsPage?.content || [],
    pageInfo: listingsPage,
    filters,
    page,
    size,
    isLoading,
    error,
    activeListing,
    setActiveListing,
    setPage,
    setSize,
    setFilter,
    setAllFilters,
    resetFilters,
    banListing,
    unbanListing,
    hardDeleteListing,
    recoverListing,
    refetch: fetchListings,
  };
};
