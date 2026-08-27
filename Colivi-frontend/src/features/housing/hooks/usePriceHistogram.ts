import { useEffect, useState } from 'react';
import type { AccommodationListingResponse } from '../types/listing.types';

export interface PriceHistogramFilters {
  minPrice?: number;
  maxPrice?: number;
}

export interface UsePriceHistogramResult {
  globalMaxPrice: number;
  globalHistogramData: number[];
  setGlobalMaxPrice: React.Dispatch<React.SetStateAction<number>>;
  setGlobalHistogramData: React.Dispatch<React.SetStateAction<number[]>>;
}

const DEFAULT_MAX_PRICE = 2000;
const NUM_BUCKETS = 20;

/**
 * Custom hook that computes the global maximum price and price distribution histogram buckets
 * based on available listings and active filter state.
 *
 * Adheres to Single Responsibility Principle (SRP) by encapsulating price calculation logic
 * outside orchestration components.
 */
export const usePriceHistogram = (
  listings: AccommodationListingResponse[] | undefined,
  filters: PriceHistogramFilters
): UsePriceHistogramResult => {
  const [globalMaxPrice, setGlobalMaxPrice] = useState<number>(DEFAULT_MAX_PRICE);
  const [globalHistogramData, setGlobalHistogramData] = useState<number[]>([]);

  useEffect(() => {
    if (!listings || listings.length === 0) return;

    const prices = listings
      .map((l) => Number(l.pricePerMonth) || 0)
      .filter((p) => p > 0);

    if (prices.length === 0) return;

    const currentMax = Math.max(...prices);
    const roundedMax = Math.ceil(currentMax / 10) * 10;
    const isPriceFiltered = filters.minPrice !== undefined || filters.maxPrice !== undefined;

    setGlobalMaxPrice((prev) => {
      if (!isPriceFiltered || prev === DEFAULT_MAX_PRICE) {
        return roundedMax;
      }
      return Math.max(prev, roundedMax);
    });

    if (!isPriceFiltered) {
      const step = roundedMax / NUM_BUCKETS;
      const buckets = new Array(NUM_BUCKETS).fill(0);

      listings.forEach((l) => {
        const price = Number(l.pricePerMonth) || 0;
        const idx = Math.min(Math.floor(price / (step || 1)), NUM_BUCKETS - 1);
        if (idx >= 0 && idx < NUM_BUCKETS) {
          buckets[idx]++;
        }
      });

      setGlobalHistogramData(buckets);
    }
  }, [listings, filters.minPrice, filters.maxPrice]);

  return {
    globalMaxPrice,
    globalHistogramData,
    setGlobalMaxPrice,
    setGlobalHistogramData,
  };
};

export default usePriceHistogram;
