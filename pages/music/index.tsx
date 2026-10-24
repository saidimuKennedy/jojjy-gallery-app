import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { ArrowRight, Play } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import TextAction from "@/components/ui/TextAction";
import { useLibrary } from "@/components/music/LibrarySidebar";
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
  preview?: boolean;
};

const PREVIEW_COVERS = {
  waterEchoes: "/images/water-echoes-preview.svg",
  dawn: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg",
  sunshine: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932044/sunshine_pboqqo.jpg",
  crossing: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932036/The_Crossing_kbdkjg.jpg",
  tug: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932010/Tug_of_war_to9ieg.jpg",
  untitled: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932000/Untitled_xdhljj.jpg",
  walk: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931992/walk_on_water_ekduli.jpg",
  cycles: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931901/cycles_k4yv0p.jpg",
};

function previewRelease(
  id: number,
  title: string,
  releaseType: string,
  accessMode: string,
  coverImage: string
): ReleaseCard {
  return {
    id,
    slug: `preview-${id}`,
    title,
    coverImage,
    artistName: "Njenga Ngugi",
    releaseType,
    releaseDate: "2024-01-01",
    accessMode,
    price: null,
    currency: "USD",
    locked: accessMode === "MEMBERS_ONLY",
    tracks: [],
    preview: true,
  };
}

const PREVIEW_RELEASES: ReleaseCard[] = [
  previewRelease(-1, "omen", "SINGLE", "FREE", PREVIEW_COVERS.dawn),
  previewRelease(-2, "Water Echoes", "EP", "FREE", PREVIEW_COVERS.waterEchoes),
  previewRelease(-3, "The Crossing", "SINGLE", "FREE", PREVIEW_COVERS.crossing),
  previewRelease(-4, "Rhythm na Soul", "ALBUM", "FREE", PREVIEW_COVERS.cycles),
  previewRelease(-5, "Sauti", "SINGLE", "FREE", PREVIEW_COVERS.sunshine),
  previewRelease(-6, "Midnight Letters", "EP", "FREE", PREVIEW_COVERS.untitled),
  previewRelease(-7, "Room to Breathe", "SINGLE", "MEMBERS_ONLY", PREVIEW_COVERS.tug),
  previewRelease(-8, "After Midnight", "EP", "MEMBERS_ONLY", PREVIEW_COVERS.sunshine),
  previewRelease(-9, "The Green Room", "ALBUM", "MEMBERS_ONLY", PREVIEW_COVERS.cycles),
  previewRelease(-10, "Quiet Hours", "SINGLE", "MEMBERS_ONLY", PREVIEW_COVERS.walk),
  previewRelease(-11, "First Light", "LIVE_SESSION", "MEMBERS_ONLY", PREVIEW_COVERS.dawn),
];

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

  // Anyone who owns a release or holds an active Studio Pass gets the black
  // listening environment, matching /music/[slug] and /music/library.
  const { status } = useSession();
  const { data: library } = useLibrary(status === "authenticated");
  const dark =
    !!library &&
    (library.collection.length > 0 || library.studioMembership != null);

  useEffect(() => {
    setTone(dark ? "dark" : "light");
  }, [dark, setTone]);

  // Editorial sample content is for local development only. Never let demo
  // releases appear in a deployed catalogue when the database is empty.
  const usingPreview =
    process.env.NODE_ENV === "development" &&
    !isLoading &&
    (!releases || releases.length === 0);
  const catalogue = useMemo(
    () => (usingPreview ? PREVIEW_RELEASES : releases ?? []),
    [releases, usingPreview]
  );
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
    <div
      className={
        dark
          ? "min-h-screen bg-black text-white [&_.text-neutral-900]:text-white [&_.text-neutral-800]:text-neutral-200 [&_.text-neutral-600]:text-neutral-300 [&_.text-neutral-500]:text-neutral-400 [&_.border-neutral-200]:border-neutral-800"
          : "min-h-screen bg-white"
      }
    >
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
        <section className="relative isolate overflow-hidden border-b border-neutral-200">
          <div className="absolute inset-0 -z-10 bg-neutral-900">
            <div className="absolute inset-y-0 right-0 w-full md:w-[72%]">
              <OptimizedImage
                src="/images/joj-artist.png"
                alt=""
                fill
                preset="full"
                priority
                sizes="(max-width: 768px) 100vw, 72vw"
                className="object-cover object-center"
              />
            </div>
            <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25 md:bg-gradient-to-r ${dark ? "md:from-black md:via-black/75" : "md:from-white md:via-white/75"} md:via-[35%] md:to-transparent md:to-[74%]`} />
          </div>
          <div className="mx-auto flex min-h-[440px] max-w-[1600px] items-center md:min-h-[min(82svh,820px)]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex w-full flex-col justify-center px-6 py-16 sm:w-[78%] md:w-[66%] md:px-10 md:py-20 lg:w-[62%]"
            >
              <p className={`font-display text-xs font-semibold uppercase tracking-[0.28em] text-white/80 ${dark ? "" : "md:text-neutral-700"}`}>
                Music
              </p>
              <h1 className={`mt-5 font-display text-5xl font-light leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl xl:text-9xl ${dark ? "" : "md:text-neutral-900"}`}>
                Stories in sound.
              </h1>
              <p className={`mt-5 max-w-md font-archive-body text-lg leading-[1.7] text-white/90 ${dark ? "" : "md:text-neutral-600"}`}>
                Explore releases, listen, and take the journey deeper.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!heroRelease || heroRelease.tracks.length === 0}
                  onClick={() => heroRelease && playRelease(heroRelease)}
                  className={`inline-flex min-h-12 items-center gap-2 border border-white bg-white px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-neutral-900 transition-colors hover:bg-transparent hover:text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${dark ? "" : "md:border-neutral-900 md:bg-neutral-900 md:text-white md:hover:bg-white md:hover:text-neutral-900 md:focus-visible:outline-neutral-900"}`}
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Play latest
                </button>
                <TextAction
                  href="#latest"
                  className={`min-h-12 rounded-md border border-white/60 bg-white/10 px-6 py-3 text-white no-underline hover:bg-white/20 hover:no-underline ${dark ? "" : "md:border-neutral-300 md:bg-white/70 md:text-neutral-900 md:hover:bg-white"}`}
                >
                  Explore all releases
                </TextAction>
              </div>
            </motion.div>
          </div>
        </section>

        {isLoading && (
          <p className="mx-auto max-w-[1600px] px-6 py-16 font-display text-xs uppercase tracking-[0.2em] text-neutral-500 md:px-10">
            Loading
          </p>
        )}
        {usingPreview && (
          <p
            role="status"
            className="mx-auto max-w-[1600px] px-6 pt-8 text-xs text-neutral-500 md:px-10"
          >
            {error
              ? "The catalogue is unavailable. Showing sample artwork and titles for preview."
              : "Sample artwork and titles shown for preview. These releases are not available to play or purchase."}
          </p>
        )}
        {!isLoading && !usingPreview && error && (
          <p role="status" className="mx-auto max-w-[1600px] px-6 pt-8 text-sm text-neutral-500 md:px-10">
            Music releases are temporarily unavailable. Please check back soon.
          </p>
        )}
        {!isLoading && !usingPreview && !error && catalogue.length === 0 && (
          <p className="mx-auto max-w-[1600px] px-6 py-16 text-sm text-neutral-500 md:px-10">
            No music releases are available yet.
          </p>
        )}

        {/* Latest releases */}
        {latest.length > 0 && (
          <section
            id="latest"
            className="mx-auto max-w-[1600px] scroll-mt-20 px-6 pt-14 md:px-10 md:pt-20"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
                  Latest releases
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  New music, fresh stories, and evolving sounds.
                </p>
              </div>
              <TextAction href="#latest" className="gap-2">
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TextAction>
            </div>

            <div className="music-release-carousel mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-5 lg:gap-5">
              {latest.map((r) => (
                <ReleaseTile key={r.id} release={r} onPlay={playRelease} />
              ))}
            </div>
          </section>
        )}

        {/* Studio releases */}
        {studioReleases.length > 0 && (
          <section className="mx-auto max-w-[1600px] px-6 pt-16 pb-4 md:px-10 md:pt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
                  Studio releases
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Exclusive releases for Studio Pass members.
                </p>
              </div>
              <TextAction href="/music/studio">
                Learn about Studio Pass
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TextAction>
            </div>

            <div className="music-release-carousel mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-5 lg:gap-5">
              {studioReleases.map((r) => (
                <ReleaseTile key={r.id} release={r} onPlay={playRelease} studio />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-neutral-200 pt-8">
            <TextAction href="/music/studio">Step inside the Studio</TextAction>
            <TextAction href="/music/library">Your library</TextAction>
          </div>
        </section>
      </main>

      <Footer tone={dark ? "dark" : "light"} />
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
  const showPlayButton = playable || Boolean(release.preview);
  const year = releaseYear(release);
  return (
    <div className="w-[72vw] max-w-[15rem] shrink-0 snap-start sm:w-[38vw] lg:w-[min(20vw,280px)] lg:max-w-none">
      <div className="group relative aspect-square overflow-hidden bg-neutral-100">
        {release.preview ? (
          <div className="block h-full w-full" aria-hidden="true">
            {release.coverImage ? (
              <OptimizedImage
                src={release.coverImage}
                alt=""
                fill
                preset="card"
                sizes="(max-width: 640px) 72vw, (max-width: 1024px) 38vw, 17vw"
                className="object-cover"
              />
            ) : null}
          </div>
        ) : (
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
        )}
        {studio && (
          <span
            className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate bg-black/75 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white"
          >
            Studio access
          </span>
        )}
        {showPlayButton && (
          <button
            type="button"
            onClick={() => onPlay(release)}
            disabled={!playable}
            aria-label={playable ? `Play ${release.title}` : `${release.title} preview only`}
            className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm transition hover:bg-neutral-100 disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
        )}
      </div>
      {release.preview ? (
        <p className="mt-3 truncate font-display text-lg text-neutral-900">
          {release.title}
        </p>
      ) : (
        <Link
          href={`/music/${release.slug}`}
          className="mt-3 block truncate font-display text-lg text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          {release.title}
        </Link>
      )}
      <p className="mt-0.5 text-sm text-neutral-500">
        {prettyType(release.releaseType)}
        {year ? ` · ${year}` : ""}
      </p>
      <p className="mt-0.5 text-sm text-neutral-600">{release.artistName}</p>
    </div>
  );
}
