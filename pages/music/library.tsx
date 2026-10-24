import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Check, Play } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  useLibrary,
  type LibraryItem,
} from "@/components/music/LibrarySidebar";
import {
  useMusicPlayer,
  type PlayerRelease,
} from "@/components/music/MusicPlayer";

type Filter = "ALL" | "OWNED" | "STUDIO";

function prettyType(t: string): string {
  return t
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function itemYear(item: LibraryItem): string | null {
  if (!item.releaseDate) return null;
  const d = new Date(item.releaseDate);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function toPlayerRelease(item: LibraryItem): PlayerRelease {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    artistName: item.artistName,
    coverImage: item.coverImage,
    tracks: item.tracks,
  };
}

export default function MusicLibraryPage() {
  const { status } = useSession();
  const { data, error, isLoading } = useLibrary(status === "authenticated");
  const player = useMusicPlayer();
  const { setTone } = player;
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    setTone("dark");
  }, [setTone]);

  const collection = data?.collection ?? [];
  const studio = data?.studioAccess ?? [];
  const ownedIds = useMemo(() => new Set(collection.map((r) => r.id)), [collection]);
  const all = useMemo(
    () => [...collection, ...studio],
    [collection, studio]
  );
  const items =
    filter === "OWNED" ? collection : filter === "STUDIO" ? studio : all;

  const playItem = (item: LibraryItem) => {
    if (item.tracks.length === 0) return;
    void player.play({ release: toPlayerRelease(item) });
  };

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: all.length },
    { key: "OWNED", label: "Yours", count: collection.length },
    { key: "STUDIO", label: "Studio Access", count: studio.length },
  ];

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <Head>
        <title>Your Library — Music</title>
      </Head>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-28 pt-10 md:px-10 md:pt-14">
        <BackLink href="/music" tone="dark">
          Back to Music
        </BackLink>
        <h1 className="mt-8 font-display text-4xl font-light tracking-tight md:text-5xl">
          Your Library
        </h1>
        <p className="mt-2 text-neutral-400">Your music, in one place.</p>

        {status === "unauthenticated" && (
          <p className="mt-10 text-neutral-300">
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to see your library.
          </p>
        )}

        {isLoading && <p className="mt-10 text-neutral-400">Loading…</p>}
        {error && (
          <p role="alert" className="mt-10 text-red-400">
            {(error as Error).message}
          </p>
        )}

        {data && (
          <>
            <div
              role="tablist"
              aria-label="Filter music library"
              className="mt-10 flex flex-wrap gap-2"
            >
              {tabs.map((tab) => {
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(tab.key)}
                    className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      active
                        ? "bg-white font-medium text-neutral-950"
                        : "border border-neutral-700 text-neutral-300 hover:border-neutral-400"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-xs ${active ? "text-neutral-600" : "text-neutral-500"}`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {items.length > 0 ? (
              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => {
                  const owned = ownedIds.has(item.id);
                  const playable = item.tracks.length > 0;
                  const playing =
                    player.release?.id === item.id && player.isPlaying;
                  return (
                    <div key={`${item.librarySource ?? "x"}-${item.id}`}>
                      <div className="group relative aspect-square overflow-hidden bg-neutral-900">
                        <Link
                          href={`/music/${item.slug}`}
                          aria-label={`${item.title} — open release`}
                          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          {item.coverImage ? (
                            <OptimizedImage
                              src={item.coverImage}
                              alt={item.title}
                              fill
                              preset="card"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover transition duration-500 group-hover:opacity-90"
                            />
                          ) : null}
                        </Link>
                        {playable && (
                          <button
                            type="button"
                            onClick={() => playItem(item)}
                            aria-label={`${playing ? "Pause" : "Play"} ${item.title}`}
                            className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                          >
                            <Play
                              className="h-5 w-5 fill-current"
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>
                      <Link
                        href={`/music/${item.slug}`}
                        className="mt-3 block truncate text-sm font-medium text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 truncate text-sm text-neutral-400">
                        {item.artistName}
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-400">
                        {prettyType(item.releaseType)}
                        {itemYear(item) ? ` · ${itemYear(item)}` : ""}
                      </p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-neutral-300">
                        {owned ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Yours
                          </>
                        ) : (
                          "Studio Access"
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-10 border border-neutral-800 p-8 text-center">
                <p className="text-sm text-neutral-300">
                  {filter === "OWNED" && (
                    <>
                      Your library is waiting —{" "}
                      <Link href="/music" className="underline">
                        explore Music
                      </Link>{" "}
                      to make a release yours.
                    </>
                  )}
                  {filter === "STUDIO" && (
                    <>
                      Studio releases appear here when you{" "}
                      <Link href="/music/studio" className="underline">
                        join the Studio
                      </Link>
                      .
                    </>
                  )}
                  {filter === "ALL" && (
                    <>
                      Your library is waiting —{" "}
                      <Link href="/music" className="underline">
                        explore Music
                      </Link>
                      .
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer tone="dark" />
    </div>
  );
}
