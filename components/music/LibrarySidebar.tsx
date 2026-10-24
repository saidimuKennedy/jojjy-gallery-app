import React from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import OptimizedImage from "@/components/ui/OptimizedImage";

export type LibraryTrack = {
  id: number;
  title: string;
  trackNumber: number;
  duration: number | null;
};

export type LibraryItem = {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  artistName: string;
  releaseType: string;
  releaseDate: string | null;
  accessMode: string;
  librarySource?: string;
  tracks: LibraryTrack[];
};

export type LibraryPayload = {
  collection: LibraryItem[];
  studioAccess: LibraryItem[];
  studioMembership: {
    active: boolean;
    expiresAt?: string;
    startedAt?: string;
    isFounding?: boolean;
  };
};

export const LIBRARY_SWR_KEY = "/api/music/library";

export const libraryFetcher = async (url: string): Promise<LibraryPayload> => {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load library");
  }
  return body.data as LibraryPayload;
};

export function useLibrary(enabled: boolean) {
  return useSWR<LibraryPayload>(enabled ? LIBRARY_SWR_KEY : null, libraryFetcher);
}

type Filter = "ALL" | "OWNED" | "STUDIO";

/**
 * Personal Music shelf. Reuses the single canonical entitlement truth
 * (`/api/music/library`). Entries navigate to the canonical release page —
 * this is navigation, NOT a second release-detail implementation.
 */
export default function LibrarySidebar({
  tone = "dark",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const router = useRouter();
  const { status } = useSession();
  const { data, isLoading, error } = useLibrary(status === "authenticated");
  const [filter, setFilter] = React.useState<Filter>("ALL");

  const dark = tone === "dark";
  const collection = data?.collection ?? [];
  const studio = data?.studioAccess ?? [];
  const items =
    filter === "OWNED"
      ? collection
      : filter === "STUDIO"
        ? studio
        : [...collection, ...studio];
  const activeSlug =
    typeof router.query.slug === "string" ? router.query.slug : undefined;

  const text = dark ? "text-white" : "text-neutral-900";
  const secondary = dark ? "text-neutral-400" : "text-neutral-500";
  const border = dark ? "border-neutral-800" : "border-neutral-200";
  const ownedIds = new Set(collection.map((r) => r.id));

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: collection.length + studio.length },
    { key: "OWNED", label: "Yours", count: collection.length },
    { key: "STUDIO", label: "Studio Access", count: studio.length },
  ];

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className={`font-display text-2xl font-light tracking-tight ${text}`}>
          Your Library
        </h2>
      </div>

      <div
        role="tablist"
        aria-label="Filter your library"
        className="mb-4 flex flex-wrap gap-2"
      >
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(t.key)}
              className={`min-h-9 rounded-full px-3 py-1.5 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                dark
                  ? "focus-visible:outline-white"
                  : "focus-visible:outline-neutral-900"
              } ${
                active
                  ? dark
                    ? "bg-white font-medium text-neutral-950"
                    : "bg-neutral-900 font-medium text-white"
                  : dark
                    ? "border border-neutral-700 text-neutral-300 hover:border-neutral-400"
                    : "border border-neutral-300 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 ${active ? "opacity-70" : "opacity-60"}`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading && (
          <p className={`text-sm ${secondary}`}>Loading…</p>
        )}
        {error && (
          <p className={`text-sm ${dark ? "text-red-400" : "text-red-600"}`}>
            {(error as Error).message}
          </p>
        )}
        {!isLoading && !error && items.length === 0 && (
          <p className={`text-sm ${secondary}`}>
            {filter === "STUDIO"
              ? "No Studio releases yet."
              : "Your library is waiting."}
          </p>
        )}
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = activeSlug === item.slug;
            const owned = ownedIds.has(item.id);
            return (
              <li key={`${item.librarySource ?? "x"}-${item.id}`}>
                <Link
                  href={`/music/${item.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg p-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    dark
                      ? "focus-visible:outline-white"
                      : "focus-visible:outline-neutral-900"
                  } ${
                    isActive
                      ? dark
                        ? "bg-neutral-900"
                        : "bg-neutral-100"
                      : dark
                        ? "hover:bg-neutral-900/60"
                        : "hover:bg-neutral-50"
                  }`}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden bg-neutral-800">
                    {item.coverImage ? (
                      <OptimizedImage
                        src={item.coverImage}
                        alt=""
                        fill
                        preset="thumb"
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm ${isActive ? "font-medium" : ""} ${text}`}
                    >
                      {item.title}
                    </span>
                    <span className={`block truncate text-xs ${secondary}`}>
                      {item.artistName}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[0.65rem] uppercase tracking-[0.14em] ${secondary}`}
                  >
                    {owned ? "Yours" : "Studio"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`mt-4 border-t pt-4 ${border}`}>
        <Link
          href="/music/library"
          className={`text-xs uppercase tracking-[0.2em] underline-offset-4 hover:underline ${text}`}
        >
          Open full library →
        </Link>
      </div>
    </div>
  );
}
