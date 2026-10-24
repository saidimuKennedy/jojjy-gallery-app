import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import { Play } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import TextAction from "@/components/ui/TextAction";
import {
  useMusicPlayer,
  type PlayerRelease,
} from "@/components/music/MusicPlayer";

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
  tracks: {
    id: number;
    title: string;
    trackNumber: number;
    duration: number | null;
  }[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load music");
  }
  return body.data as ReleaseCard[];
};

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

function toPlayerRelease(r: ReleaseCard): PlayerRelease {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    artistName: r.artistName,
    coverImage: r.coverImage,
    tracks: r.tracks,
  };
}

export default function MusicIndexPage() {
  const { data: releases, error, isLoading } = useSWR(
    "/api/music/releases",
    fetcher
  );
  const player = useMusicPlayer();
  const { setTone } = player;

  useEffect(() => {
    setTone("light");
  }, [setTone]);

  const catalogue = useMemo(() => releases ?? [], [releases]);
  const latest = useMemo(
    () => catalogue.filter((r) => r.accessMode !== "MEMBERS_ONLY"),
    [catalogue]
  );
  const studioReleases = useMemo(
    () => catalogue.filter((r) => r.accessMode === "MEMBERS_ONLY"),
    [catalogue]
  );
  const heroRelease = latest[0] ?? catalogue[0] ?? null;

  const playRelease = (r: ReleaseCard) => {
    if (r.tracks.length === 0) return;
    void player.play({ release: toPlayerRelease(r) }).then((outcome) => {
      if (!outcome.ok && outcome.message) {
        // Surfaced in the player bar; nothing else to do here.
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Music — Jojjy Gallery</title>
        <meta
          name="description"
          content="Stories in sound — releases from the studio, for listeners."
        />
      </Head>
      <Navbar />

      <main className="pb-28">
        {/* Hero */}
        <section className="border-b border-neutral-200">
          <div className="mx-auto grid max-w-7xl items-stretch gap-0 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col justify-center px-6 py-14 md:px-10 md:py-20"
            >
              <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-500">
                Music
              </p>
              <h1 className="mt-5 font-display text-5xl font-light leading-[1.05] tracking-tight text-neutral-900 md:text-6xl lg:text-7xl">
                Stories in sound.
              </h1>
              <p className="mt-5 max-w-md font-archive-body text-lg leading-[1.7] text-neutral-600">
                Explore releases, listen, and take the journey deeper.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!heroRelease || heroRelease.tracks.length === 0}
                  onClick={() => heroRelease && playRelease(heroRelease)}
                  className="inline-flex min-h-12 items-center gap-2 border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Play latest
                </button>
                <TextAction href="#latest">Explore all releases</TextAction>
              </div>
            </motion.div>
            <div className="relative min-h-[280px] bg-neutral-100 md:min-h-[460px]">
              {heroRelease?.coverImage ? (
                <OptimizedImage
                  src={heroRelease.coverImage}
                  alt=""
                  fill
                  preset="full"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>
        </section>

        {isLoading && (
          <p className="mx-auto max-w-7xl px-6 py-16 font-display text-xs uppercase tracking-[0.2em] text-neutral-500 md:px-10">
            Loading
          </p>
        )}
        {error && (
          <p className="mx-auto max-w-7xl px-6 py-16 text-sm text-red-600 md:px-10">
            {(error as Error).message}
          </p>
        )}

        {!isLoading && !error && catalogue.length === 0 && (
          <p className="mx-auto max-w-7xl px-6 py-16 text-neutral-500 md:px-10">
            No releases yet.
          </p>
        )}

        {/* Latest releases */}
        {latest.length > 0 && (
          <section
            id="latest"
            className="mx-auto max-w-7xl scroll-mt-20 px-6 pt-14 md:px-10 md:pt-20"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-light tracking-tight text-neutral-900 md:text-4xl">
                  Latest releases
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  New music, fresh stories, and evolving sounds.
                </p>
              </div>
              <TextAction href="#latest">View all</TextAction>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {latest.map((r) => (
                <ReleaseTile key={r.id} release={r} onPlay={playRelease} />
              ))}
            </div>
          </section>
        )}

        {/* Studio releases */}
        {studioReleases.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pt-16 pb-4 md:px-10 md:pt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-light tracking-tight text-neutral-900 md:text-4xl">
                  Studio releases
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Exclusive releases for Studio Pass members.
                </p>
              </div>
              <TextAction href="/music/studio">
                Learn about Studio Pass
              </TextAction>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {studioReleases.map((r) => (
                <ReleaseTile key={r.id} release={r} onPlay={playRelease} studio />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-neutral-200 pt-8">
            <TextAction href="/music/studio">Step inside the Studio</TextAction>
            <TextAction href="/music/library">Your library</TextAction>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ReleaseTile({
  release,
  onPlay,
  studio = false,
}: {
  release: ReleaseCard;
  onPlay: (r: ReleaseCard) => void;
  studio?: boolean;
}) {
  const playable = release.tracks.length > 0;
  const year = releaseYear(release);
  return (
    <div>
      <div className="group relative aspect-square overflow-hidden bg-neutral-100">
        <Link
          href={`/music/${release.slug}`}
          aria-label={`${release.title} — open release`}
          className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {release.coverImage ? (
            <OptimizedImage
              src={release.coverImage}
              alt={release.title}
              fill
              preset="card"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          ) : null}
        </Link>
        {studio && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 bg-black/70 px-2.5 py-1 text-xs text-white">
            Studio Access
          </span>
        )}
        {playable && (
          <button
            type="button"
            onClick={() => onPlay(release)}
            aria-label={`Play ${release.title}`}
            className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/90 text-white transition hover:bg-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden="true" />
          </button>
        )}
      </div>
      <Link
        href={`/music/${release.slug}`}
        className="mt-3 block truncate font-display text-lg text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        {release.title}
      </Link>
      <p className="mt-0.5 text-sm text-neutral-500">
        {prettyType(release.releaseType)}
        {year ? ` · ${year}` : ""}
      </p>
      <p className="mt-0.5 text-sm text-neutral-600">{release.artistName}</p>
    </div>
  );
}
