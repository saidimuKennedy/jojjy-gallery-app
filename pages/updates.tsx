import React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

type AnnouncementItem = {
  id: number;
  title: string;
  body: string;
  publishedAt: string;
  event: { id: number; title: string; slug: string } | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load updates");
  }
  return body.data as AnnouncementItem[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function UpdatesPage() {
  const { data: updates, error, isLoading } = useSWR(
    "/api/announcements",
    fetcher
  );

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Updates — Njenga Ngugi</title>
        <meta
          name="description"
          content="Notes from the studio — exhibitions, releases, and gatherings."
        />
      </Head>
      <Navbar />

      <main className="px-5 pb-24 pt-14 md:px-10 md:pt-20 lg:px-16 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-20 max-w-3xl text-center md:mb-28"
        >
          <h1 className="font-display text-5xl font-light tracking-tight text-neutral-900 md:text-6xl lg:text-7xl">
            Updates
          </h1>
          <p className="mx-auto mt-8 max-w-lg font-archive-body text-lg font-normal leading-[1.7] text-neutral-600 md:text-[1.125rem]">
            Notes from the studio — exhibitions, releases, and gatherings.
          </p>
        </motion.div>

        {isLoading && (
          <p className="text-center font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
            Loading
          </p>
        )}
        {error && (
          <p className="text-center font-archive-body text-base text-neutral-600">
            Could not load updates.
          </p>
        )}
        {updates && updates.length === 0 && (
          <div className="mx-auto max-w-lg text-center">
            <p className="font-archive-body text-base text-neutral-500">
              No updates yet. Stay close for the next note from the studio.
            </p>
            <Link
              href="/subscribe"
              className="mt-8 inline-block border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-neutral-900"
            >
              Subscribe
            </Link>
          </div>
        )}

        {updates && updates.length > 0 && (
          <ul className="mx-auto max-w-2xl">
            {updates.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: Math.min(index * 0.06, 0.36),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="border-t border-neutral-100 py-12 md:py-14"
              >
                <p className="font-archive-body text-[0.7rem] font-medium uppercase tracking-[0.28em] text-neutral-500">
                  {formatDate(item.publishedAt)}
                </p>
                <h2 className="mt-4 font-display text-3xl font-light tracking-tight text-neutral-900 md:text-4xl">
                  {item.title}
                </h2>
                <p className="mt-5 whitespace-pre-wrap font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-600 md:text-lg">
                  {item.body}
                </p>
                {item.event && (
                  <Link
                    href={`/events/${item.event.slug}`}
                    className="mt-6 inline-block font-display text-xs uppercase tracking-[0.22em] text-neutral-700 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline"
                  >
                    {item.event.title}
                  </Link>
                )}
              </motion.li>
            ))}
          </ul>
        )}

        {updates && updates.length > 0 && (
          <div className="mx-auto mt-16 max-w-2xl border-t border-neutral-100 pt-14 text-center md:mt-24 md:pt-20">
            <p className="font-display text-2xl font-light tracking-tight text-neutral-900 md:text-3xl">
              Stay close to the work
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-neutral-600">
              Occasional notes on new artworks, music releases, exhibitions, and
              studio news.
            </p>
            <Link
              href="/subscribe"
              className="mt-8 inline-block border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-neutral-900"
            >
              Subscribe
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
