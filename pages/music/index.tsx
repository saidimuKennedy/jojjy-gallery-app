import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import { Play } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import TextAction from "@/components/ui/TextAction";
import { formatDisplayPrice } from "@/lib/currency";

type ReleaseCard = {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  artistName: string;
  releaseType: string;
  releaseDate: string | null;
  accessMode: string;
  price: number | null;
  currency: string;
  locked: boolean;
  tracks: { id: number; title: string; trackNumber: number; duration: number | null }[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load music");
  }
  return body.data as ReleaseCard[];
};

const TYPE_ORDER = ["SINGLE", "EP", "ALBUM", "LIVE_SESSION", "ACOUSTIC_SESSION"];

function prettyType(t: string): string {
  return t
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function releaseYear(r: ReleaseCard): string | null {
  if (!r.releaseDate) return null;
  const d = new Date(r.releaseDate);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function priceLine(r: ReleaseCard): string {
  if (r.accessMode === "FREE") return "Free";
  if (r.accessMode === "MEMBERS_ONLY") return "Studio Pass";
  if (r.accessMode === "PAID") {
    return r.price != null
      ? `Unlock · ${formatDisplayPrice(r.price)}`
      : "Unlock";
  }
  return r.accessMode;
}

/** Honest preview state derived from actual data — no per-viewer quota here,
 *  so cards only promise what the catalogue guarantees. */
function previewPill(r: ReleaseCard): { label: string; tone: "live" | "muted" } | null {
  if (r.tracks.length === 0) return null;
  if (r.accessMode === "FREE") return { label: "Free streaming", tone: "muted" };
  if (r.accessMode === "MEMBERS_ONLY") return { label: "Studio Pass", tone: "muted" };
  return { label: "Preview available", tone: "live" };
}

export default function MusicIndexPage() {
  const { data: releases, error, isLoading } = useSWR(
    "/api/music/releases",
    fetcher
  );
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const presentTypes = TYPE_ORDER.filter((t) =>
    (releases || []).some((r) => r.releaseType === t)
  );
  const visible = (releases || []).filter(
    (r) => typeFilter === "ALL" || r.releaseType === typeFilter
  );

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Music — Jojjy Gallery</title>
        <meta
          name="description"
          content="Listen first here — releases from the studio, for supporters."
        />
      </Head>
      <Navbar />

      <main className="px-5 pt-10 pb-16 md:px-10 md:pt-14 lg:px-16 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 max-w-3xl text-center md:mb-14"
        >
          <h1 className="font-display text-5xl font-light tracking-tight text-neutral-900 md:text-6xl lg:text-7xl">
            Music
          </h1>
          <p className="mx-auto mt-4 max-w-lg font-archive-body text-lg font-normal leading-[1.7] text-neutral-600 md:text-[1.125rem]">
            New releases and music from Jenga.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <TextAction href="/music/library">Your collection</TextAction>
            <TextAction href="/music/studio">
              Step inside the Studio
            </TextAction>
          </div>
        </motion.div>

        {presentTypes.length > 0 && (
          <div
            role="tablist"
            aria-label="Filter releases by type"
            className="mx-auto mb-8 flex max-w-5xl flex-wrap gap-x-6 gap-y-2"
          >
            {["ALL", ...presentTypes].map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTypeFilter(t)}
                  className={`border-b-2 pb-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 ${
                    active
                      ? "border-neutral-900 font-medium text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {t === "ALL" ? "All" : prettyType(t) + "s"}
                </button>
              );
            })}
          </div>
        )}

        {isLoading && (
          <p className="text-center font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
            Loading
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-red-600">
            {(error as Error).message}
          </p>
        )}

        <div className="mx-auto grid max-w-5xl gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => {
            const year = releaseYear(r);
            const pill = previewPill(r);
            const playable = r.tracks.length > 0;
            return (
              <div key={r.id} className="border border-neutral-200 bg-white">
                <div className="group relative aspect-square overflow-hidden bg-neutral-100">
                  <Link
                    href={`/music/${r.slug}`}
                    aria-label={`${r.title} — open release`}
                    className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                  >
                    {r.coverImage ? (
                      <OptimizedImage
                        src={r.coverImage}
                        alt={r.title}
                        fill
                        preset="card"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : null}
                  </Link>
                  {playable && (
                    <Link
                      href={`/music/${r.slug}?autoplay=1`}
                      aria-label={`Play ${r.title}`}
                      className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/90 text-white transition hover:bg-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                    >
                      <Play
                        className="h-5 w-5 fill-current"
                        aria-hidden="true"
                      />
                    </Link>
                  )}
                </div>
                <div className="p-4">
                  <Link
                    href={`/music/${r.slug}`}
                    className="font-display text-xl text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                  >
                    {r.title}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-600">
                    {r.artistName}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {prettyType(r.releaseType)}
                    {year ? ` · ${year}` : ""}
                  </p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">
                    {priceLine(r)}
                  </p>
                  {pill && (
                    <p className="mt-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs ${
                          pill.tone === "live"
                            ? "bg-green-50 text-green-800"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {pill.label}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {releases?.length === 0 && !isLoading && (
          <p className="text-center text-neutral-500">No releases yet.</p>
        )}
        {(releases || []).length > 0 && visible.length === 0 && !isLoading && (
          <p className="text-center text-neutral-500">
            No {prettyType(typeFilter).toLowerCase()}s yet.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
