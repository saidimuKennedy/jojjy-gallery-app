import useSWR, { Fetcher } from "swr";
import {
  ArtworksResponse,
  ArtworkResponse,
  APIError,
  ArtworkFilters,
  UseArtworksReturn,
  UseArtworkReturn,
  SeriesResponse,
  SeriesListResponse,
  UseSeriesReturn,
  UseSeriesListReturn,
} from "@/types/api";

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
  if (!data.success) {
    const error = new Error(data.message || "API request failed") as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }

  return data as ArtworkResponse;
};

const seriesListFetcher: Fetcher<SeriesListResponse, string> = async (
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
  if (!data.success) {
    const error = new Error(data.message || "API request failed") as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }
  return data as SeriesListResponse;
};

const seriesFetcher: Fetcher<SeriesResponse, string> = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(
      `HTTP ${response.status}: ${response.statusText}`
    ) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  if (!data.success) {
    const error = new Error(data.message || "API request failed") as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }
  return data as SeriesResponse;
};

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

export function useArtwork(id: string | number | undefined): UseArtworkReturn {
  const { data, error, mutate, isValidating } = useSWR<
    ArtworkResponse,
    APIError
  >(id ? `/api/artworks/${id}` : null, artworkFetcher, singleItemSWRConfig);
  return {
    artwork: data?.data,
    isLoading: !error && !data && id !== undefined,
    isValidating,
    error: error?.message,
    mutate,
  };
}

export function useSeriesList(): UseSeriesListReturn {
  const { data, error, mutate, isValidating } = useSWR<
    SeriesListResponse,
    APIError
  >("/api/series", seriesListFetcher, defaultSWRConfig);

  return {
    seriesList: data?.data || [],
    isLoading: !error && !data,
    isValidating,
    error: error?.message,
    mutate,
  };
}

export function useSeries(slug: string | undefined): UseSeriesReturn {
  const { data, error, mutate, isValidating } = useSWR<
    SeriesResponse,
    APIError
  >(slug ? `/api/series/${slug}` : null, seriesFetcher, singleItemSWRConfig);

  return {
    series: data?.data,
    isLoading: !error && !data && slug !== undefined,
    isValidating,
    error: error?.message,
    mutate,
  };
}

export function useArtworksByArtist(artist: string): UseArtworksReturn {
  return useArtworks({ artist });
}

export function useArtworkSearch(searchTerm: string): UseArtworksReturn {
  return useArtworks({ search: searchTerm });
}