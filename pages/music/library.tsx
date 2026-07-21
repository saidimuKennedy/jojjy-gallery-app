import React from "react";
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";

type LibItem = {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  librarySource?: string;
};

type LibraryPayload = {
  collection: LibItem[];
  studioAccess: LibItem[];
  studioMembership: {
    active: boolean;
    expiresAt?: string;
    startedAt?: string;
    isFounding?: boolean;
  };
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load library");
  }
  return body.data as LibraryPayload;
};

function ReleaseRow({ r }: { r: LibItem }) {
  return (
    <li>
      <Link
        href={`/music/${r.slug}`}
        className="flex items-center gap-4 hover:opacity-80"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-neutral-100">
          {r.coverImage ? (
            <OptimizedImage
              src={r.coverImage}
              alt={r.title}
              fill
              preset="thumb"
              sizes="64px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div>
          <p className="font-display text-lg">{r.title}</p>
        </div>
      </Link>
    </li>
  );
}

export default function MusicLibraryPage() {
  const { status } = useSession();
  const { data, error, isLoading } = useSWR(
    status === "authenticated" ? "/api/music/library" : null,
    fetcher
  );

  const membership = data?.studioMembership;
  const sinceLabel =
    membership?.active && membership.startedAt
      ? new Date(membership.startedAt).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Your Collection — Music</title>
      </Head>
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
        <Link
          href="/music"
          className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-800"
        >
          ← Music
        </Link>
        <h1 className="mt-8 font-display text-4xl font-light text-neutral-900 md:text-5xl">
          Your Collection
        </h1>

        {membership?.active && (
          <p className="mt-4 text-sm text-neutral-600">
            ✓ Studio Member
            {membership.isFounding ? " · Founding Member" : ""}
            {sinceLabel ? ` · since ${sinceLabel}` : ""}
          </p>
        )}

        {status === "unauthenticated" && (
          <p className="mt-10 text-neutral-600">
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to see your collection.
          </p>
        )}

        {isLoading && <p className="mt-10 text-neutral-400">Loading…</p>}
        {error && (
          <p className="mt-10 text-red-600">{(error as Error).message}</p>
        )}

        {data && (
          <>
            <section className="mt-14">
              <h2 className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
                Purchased forever
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Unlocks you own — always in your collection.
              </p>
              <ul className="mt-6 space-y-4">
                {data.collection.map((r) => (
                  <ReleaseRow key={`c-${r.id}`} r={r} />
                ))}
              </ul>
              {data.collection.length === 0 && (
                <p className="mt-6 text-neutral-500">
                  Nothing purchased yet —{" "}
                  <Link href="/music" className="underline">
                    browse Music
                  </Link>{" "}
                  to unlock a release.
                </p>
              )}
            </section>

            <section className="mt-16 border-t border-neutral-100 pt-12">
              <h2 className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
                Studio access
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Available while you&apos;re a Studio member.
              </p>
              <ul className="mt-6 space-y-4">
                {data.studioAccess.map((r) => (
                  <ReleaseRow key={`s-${r.id}`} r={r} />
                ))}
              </ul>
              {data.studioAccess.length === 0 && !membership?.active && (
                <p className="mt-6 text-neutral-500">
                  Studio releases appear here when you{" "}
                  <Link href="/music/studio" className="underline">
                    join the Studio
                  </Link>
                  .
                </p>
              )}
              {data.studioAccess.length === 0 && membership?.active && (
                <p className="mt-6 text-neutral-500">
                  No member-only releases published yet.
                </p>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
