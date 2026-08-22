const STORAGE_KEY = 'colivi_recent_search';

export interface RecentSearch {
  city?: string;
  maxPrice?: number;
  accommodationType?: string;
}

/**
 * Persists the most recent search parameters in localStorage.
 * Only non-empty values are stored.
 */
export const saveRecentSearch = (search: RecentSearch): void => {
  const sanitized: RecentSearch = {};

  if (search.city && search.city.trim() !== '') {
    sanitized.city = search.city.trim();
  }
  if (search.maxPrice !== undefined && search.maxPrice > 0) {
    sanitized.maxPrice = search.maxPrice;
  }
  if (search.accommodationType && search.accommodationType.trim() !== '') {
    sanitized.accommodationType = search.accommodationType.trim();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
};

/**
 * Retrieves the most recent search parameters from localStorage.
 * Returns null if nothing has been stored or if parsing fails.
 */
export const getRecentSearch = (): RecentSearch | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RecentSearch;
  } catch {
    return null;
  }
};

/**
 * Removes the recent search data from localStorage.
 */
export const clearRecentSearch = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
