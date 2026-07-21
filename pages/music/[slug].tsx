import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";

type Track = {
  id: number;
  title: string;
  trackNumber: number;
  duration: number | null;
};

type ReleaseDetail = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  artistName: string;
  releaseType: string;
  accessMode: string;
  price: number | null;
  currency: string;
  paidPlayLimit: number;
  tracks: Track[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const raw = await res.text();
  if (
    res.headers.get("x-vercel-mitigated") === "challenge" ||
    raw.trimStart().startsWith("<!")
  ) {
    throw new Error(
      "Blocked by Vercel Security Checkpoint. Disable Attack Mode for this project, then reload."
    );
  }
  let body: { success?: boolean; message?: string; data?: ReleaseDetail };
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to load release (${res.status}): non-JSON response`);
  }
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load release");
  }
  return body.data as ReleaseDetail;
};

export default function MusicReleasePage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const { data: session } = useSession();
  const { data: release, error, isLoading } = useSWR(
    slug ? `/api/music/releases/${slug}` : null,
    fetcher
  );

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [remainingTease, setRemainingTease] = useState<number | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const playTrack = async (trackId: number) => {
    if (!release) return;
    setBusy(true);
    setPlayError(null);
    try {
      const res = await fetch("/api/music/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId: release.id, trackId }),
      });
      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      if (
        res.headers.get("x-vercel-mitigated") === "challenge" ||
        (raw.trimStart().startsWith("<!") && !contentType.includes("application/json"))
      ) {
        throw new Error(
          "Playback blocked by Vercel Security Checkpoint. Disable Attack Mode (or WAF challenge rules) for this project, then retry."
        );
      }
      let json: {
        success?: boolean;
        message?: string;
        data?: { streamUrl: string; remainingTease?: number | null };
      };
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error(
          `Playback failed (${res.status}): server returned non-JSON`
        );
      }
      if (!res.ok) {
        throw new Error(json.message || "Playback denied");
      }
      if (!json.data?.streamUrl) {
        throw new Error("Playback denied");
      }
      setStreamUrl(json.data.streamUrl);
      setPlayingId(trackId);
      if (json.data.remainingTease != null) {
        setRemainingTease(json.data.remainingTease);
      }
    } catch (e) {
      setPlayError((e as Error).message);
      setStreamUrl(null);
      setPlayingId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>
          {release ? `${release.title} — Music` : "Music — Jojjy Gallery"}
        </title>
      </Head>
      <Navbar />

      <main className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
        <Link
          href="/music"
          className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-800"
        >
          ← Music
        </Link>

        {isLoading && (
          <p className="mt-12 text-neutral-400">Loading…</p>
        )}
        {error && (
          <p className="mt-12 text-red-600">{(error as Error).message}</p>
        )}

        {release && (
          <div className="mt-10 grid gap-10 md:grid-cols-[240px_1fr]">
            <div className="relative aspect-square bg-neutral-100">
              {release.coverImage ? (
                <OptimizedImage
                  src={release.coverImage}
                  alt={release.title}
                  fill
                  preset="card"
                  priority
                  sizes="240px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {release.releaseType.replace(/_/g, " ")} · {release.accessMode}
                {release.accessMode === "PAID" && release.price != null
                  ? ` · ${release.price} ${release.currency}`
                  : ""}
              </p>
              <h1 className="mt-3 font-display text-4xl font-light text-neutral-900 md:text-5xl">
                {release.title}
              </h1>
              <p className="mt-2 text-neutral-500">{release.artistName}</p>
              {release.description && (
                <p className="mt-6 leading-relaxed text-neutral-600">
                  {release.description}
                </p>
              )}

              {remainingTease != null && release.accessMode === "PAID" && (
                <p className="mt-4 text-sm text-neutral-500">
                  {remainingTease} of {release.paidPlayLimit} free plays left
                </p>
              )}

              {playError && (
                <p className="mt-4 text-sm text-red-600">{playError}</p>
              )}

              {release.accessMode === "PAID" && (
                <p className="mt-4 text-sm text-neutral-500">
                  After free plays, ask the studio for access (CRM grant) or
                  purchase when checkout is live.
                  {!session && " Sign in to keep unlocks in your library."}
                </p>
              )}
              {release.accessMode === "MEMBERS_ONLY" && (
                <p className="mt-4 text-sm text-neutral-500">
                  Studio Membership required for full playback.{" "}
                  <Link href="/music" className="underline">
                    See plans on Music home
                  </Link>{" "}
                  — staff can grant a pass in CRM for now.
                </p>
              )}

              {streamUrl && (
                <audio
                  key={streamUrl}
                  className="mt-6 w-full"
                  controls
                  autoPlay
                  src={streamUrl}
                />
              )}

              <ol className="mt-8 divide-y divide-neutral-100 border-t border-neutral-100">
                {release.tracks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-neutral-800">
                      <span className="mr-3 text-neutral-400">
                        {t.trackNumber}
                      </span>
                      {t.title}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => playTrack(t.id)}
                      className="text-xs uppercase tracking-[0.18em] text-neutral-600 hover:text-neutral-950 disabled:opacity-50"
                    >
                      {playingId === t.id ? "Playing" : "Play"}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
