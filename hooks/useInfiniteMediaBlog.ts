import useSWRInfinite from "swr/infinite";
import { APIResponse, MediaBlogEntryWithRelations } from "@/types/api";

export const ARCHIVE_PAGE_SIZE = 12;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch data");
  }
  return res.json() as Promise<APIResponse<MediaBlogEntryWithRelations[]>>;
};

export function useInfiniteMediaBlog(initialData?: {
  entries: MediaBlogEntryWithRelations[];
  total: number;
}) {
  const getKey = (
    pageIndex: number,
    previousPageData: APIResponse<MediaBlogEntryWithRelations[]> | null
  ) => {
    if (previousPageData && previousPageData.data.length === 0) return null;
    return `/api/media-blog?limit=${ARCHIVE_PAGE_SIZE}&page=${pageIndex + 1}&include=minimal`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<APIResponse<MediaBlogEntryWithRelations[]>>(getKey, fetcher, {
      revalidateFirstPage: false,
      fallbackData: initialData
        ? [
            {
              success: true,
              data: initialData.entries,
              total: initialData.total,
            },
          ]
        : undefined,
    });

  const entries = data ? data.flatMap((page) => page.data) : [];
  const total = data?.[0]?.total ?? initialData?.total ?? 0;
  const hasMore = entries.length < total;

  return {
    entries,
    total,
    error,
    isLoading: isLoading && !data,
    isValidating,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}
