import React from "react";
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

type LibItem = {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  librarySource?: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load library");
  }
  return body.data as LibItem[];
};

export default function MusicLibraryPage() {
  const { status } = useSession();
  const { data, error, isLoading } = useSWR(
    status === "authenticated" ? "/api/music/library" : null,
    fetcher
  );

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Library — Music</title>
      </Head>
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
        <h1 className="font-display text-4xl font-light text-neutral-900">
          Library
        </h1>
        <p className="mt-3 text-neutral-500">
          Purchased unlocks and current member releases.
        </p>

        {status === "unauthenticated" && (
          <p className="mt-10 text-neutral-600">
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to see your library.
          </p>
        )}

        {isLoading && <p className="mt-10 text-neutral-400">Loading…</p>}
        {error && (
          <p className="mt-10 text-red-600">{(error as Error).message}</p>
        )}

        <ul className="mt-10 space-y-4">
          {(data || []).map((r) => (
            <li key={r.id}>
              <Link
                href={`/music/${r.slug}`}
                className="flex items-center gap-4 hover:opacity-80"
              >
                <div className="h-16 w-16 shrink-0 bg-neutral-100">
                  {r.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-display text-lg">{r.title}</p>
                  <p className="text-xs uppercase tracking-widest text-neutral-400">
                    {r.librarySource || "Access"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {data?.length === 0 && (
          <p className="mt-10 text-neutral-500">Nothing in your library yet.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
