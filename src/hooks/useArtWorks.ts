import useSWR, { Fetcher } from "swr";
import {
  ArtworksResponse,
  ArtworkResponse,
  APIError,
  ArtworkFilters,
  UseArtworksReturn,
  UseArtworkReturn,
} from "@/types/api";

// ============================================================================
// FETCHER FUNCTION
// ============================================================================
const artworksFetcher: Fetcher<ArtworksResponse, string> = async (
  url: string
) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    ) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data as ArtworksResponse;
};

const artworkFetcher: Fetcher<ArtworkResponse, string> = async (
  url: string
) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    ) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  // Check for API-level errors
  if (!data.success) {
    const error = new Error(data.message || "API request failed") as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }

  return data as ArtworkResponse;
};

// ============================================================================
// SWR CONFIGURATION
// ============================================================================
const defaultSWRConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

const singleItemSWRConfig = {
  ...defaultSWRConfig,
  revalidateOnFocus: false,
  revalidateIfStale: true,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch multiple artworks with filtering
 */
export function useArtworks(filters: ArtworkFilters = {}): UseArtworksReturn {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const url = `/api/artworks${queryString ? `?${queryString}` : ""}`;

  const { data, error, mutate, isValidating } = useSWR<
    ArtworksResponse,
    APIError
  >(url, artworksFetcher, defaultSWRConfig);

  return {
    artworks: data?.data || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isValidating,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook to fetch a single artwork by ID
 */
export function useArtwork(id: string | number | undefined): UseArtworkReturn {
  const { data, error, mutate, isValidating } = useSWR<
    ArtworkResponse,
    APIError // No change here, this is the error type
  >(id ? `/api/artworks/${id}` : null, artworkFetcher, singleItemSWRConfig);

  return {
    artwork: data?.data,
    isLoading: !error && !data && id !== undefined,
    isValidating,
    error: error?.message,
    mutate,
  };
}

/**
 * Hook to fetch featured artworks
 */
export function useFeaturedArtworks(): UseArtworksReturn {
  return useArtworks({ featured: true });
}

/**
 * Hook to fetch artworks by category
 */
export function useArtworksByCategory(category: string): UseArtworksReturn {
  return useArtworks({ category });
}

/**
 * Hook to fetch artworks by artist
 */
export function useArtworksByArtist(artist: string): UseArtworksReturn {
  return useArtworks({ artist });
}

/**
 * Hook to search artworks
 */
export function useArtworkSearch(searchTerm: string): UseArtworksReturn {
  return useArtworks({ search: searchTerm });
}
