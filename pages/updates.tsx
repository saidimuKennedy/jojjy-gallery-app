import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import toast from "react-hot-toast";
import { ArrowRight, Search } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { deriveTags } from "@/lib/content-tags";
import {
  HERO_BODY,
  HERO_COMPACT_MIN_HEIGHT,
  HERO_COMPACT_TITLE,
  HERO_LABEL,
} from "@/lib/music/hero-styles";

type AnnouncementItem = {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  event: { id: number; title: string; slug: string } | null;
};

const TABS = ["All", "Studio notes", "Releases", "Exhibitions", "Events"] as const;
type Tab = (typeof TABS)[number];

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load updates");
  }
  return body.data as AnnouncementItem[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function matchesTab(item: AnnouncementItem, tags: string[], tab: Tab): boolean {
  switch (tab) {
    case "All":
      return true;
    case "Studio notes":
      return tags.includes("Studio");
    case "Releases":
      return tags.includes("Release") || tags.includes("Music");
    case "Exhibitions":
      return tags.includes("Exhibition");
    case "Events":
      return item.event != null;
  }
}

export default function UpdatesPage() {
  const { data: updates, error, isLoading } = useSWR(
    "/api/announcements",
    fetcher
  );
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (updates ?? [])
      .map((item) => ({
        item,
        tags: [
          ...deriveTags(item.title, item.body),
          ...(item.event && !deriveTags(item.title, item.body).includes("Event")
            ? ["Event"]
            : []),
        ].slice(0, 3),
      }))
      .filter(({ item, tags }) => matchesTab(item, tags, tab))
      .filter(
        ({ item }) =>
          !q ||
          item.title.toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q)
      );
  }, [updates, tab, query]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not subscribe");
        return;
      }
      toast.success("You're on the list");
      setEmail("");
    } catch {
      toast.error("Could not subscribe");
    } finally {
      setSubscribing(false);
    }
  };

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

      <main className="pb-24">
        <section className="relative isolate overflow-hidden bg-black">
          <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[62%]">
            <OptimizedImage
              src="/images/studio/updates-hero.jpg"
              alt=""
              fill
              preset="full"
              priority
              sizes="(max-width: 768px) 100vw, 62vw"
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/55 to-black/30 md:bg-gradient-to-r md:from-black md:from-[34%] md:via-black/70 md:via-[48%] md:to-transparent md:to-[70%]" />
          <div
            className={`mx-auto flex max-w-[1600px] items-center ${HERO_COMPACT_MIN_HEIGHT}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="w-full px-6 py-14 md:w-[52%] md:px-12 lg:px-16"
            >
              <p className={`${HERO_LABEL} text-white/80`}>Updates</p>
              <h1 className={`mt-5 ${HERO_COMPACT_TITLE} text-white`}>
                Notes from the studio
              </h1>
              <p className={`mt-5 max-w-md ${HERO_BODY} text-white/90`}>
                Exhibitions, releases, and gatherings — occasional notes on
                what&apos;s happening in the studio and beyond.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Link
                  href="/subscribe"
                  className="inline-flex min-h-[3rem] items-center border border-white bg-white px-7 py-3 font-archive-body text-sm font-medium text-neutral-900 transition-colors hover:bg-transparent hover:text-white"
                >
                  Subscribe
                </Link>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-2 font-archive-body text-sm font-medium text-white underline-offset-4 hover:underline"
                >
                  Follow the journey
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200">
            <div role="tablist" className="flex flex-wrap gap-x-8">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 py-5 font-archive-body text-sm transition-colors ${
                    tab === t
                      ? "border-neutral-900 font-medium text-neutral-900"
                      : "border-transparent text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 font-archive-body text-sm text-neutral-700">
              <Search className="h-4 w-4" aria-hidden />
              <span className="sr-only">Search updates</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-28 bg-transparent placeholder:text-neutral-500 focus:outline-none"
              />
            </label>
          </div>

          {isLoading && (
            <p className="py-16 text-center font-archive-body text-sm text-neutral-500">
              Loading
            </p>
          )}
          {error && (
            <p className="py-16 text-center font-archive-body text-base text-neutral-600">
              Could not load updates.
            </p>
          )}
          {updates && visible.length === 0 && (
            <p className="py-16 text-center font-archive-body text-base text-neutral-500">
              {updates.length === 0
                ? "No updates yet. Stay close for the next note from the studio."
                : "Nothing matches that filter."}
            </p>
          )}

          {visible.length > 0 && (
            <ul className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2">
              {visible.map(({ item, tags }, index) => {
                const href = item.event ? `/events/${item.event.slug}` : null;
                const card = (
                  <>
                    {item.imageUrl && (
                      <div className="relative aspect-[3/1] overflow-hidden bg-neutral-100">
                        <OptimizedImage
                          src={item.imageUrl}
                          alt=""
                          fill
                          preset="card"
                          sizes="(max-width: 768px) 100vw, 480px"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <p className="mt-4 font-archive-body text-xs font-medium uppercase tracking-[0.14em] text-neutral-600">
                      {formatDate(item.publishedAt)}
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-neutral-900">
                      {item.title}
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap font-archive-body text-base leading-[1.65] text-neutral-700 line-clamp-3">
                      {item.body}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <ul className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <li
                            key={t}
                            className="bg-neutral-100 px-2.5 py-1 font-archive-body text-xs uppercase tracking-[0.1em] text-neutral-700"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                      {href && (
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-neutral-900 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      )}
                    </div>
                  </>
                );
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: Math.min(index * 0.05, 0.3),
                    }}
                  >
                    {href ? (
                      <Link href={href} className="group block">
                        {card}
                      </Link>
                    ) : (
                      <div className="group block">{card}</div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mx-auto mt-24 max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-900">
            Stay close to the work
          </h2>
          <p className="mx-auto mt-3 max-w-md font-archive-body text-sm leading-relaxed text-neutral-700">
            Occasional notes on new artworks, music releases, exhibitions, and
            studio news.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="updates-email">
              Your email address
            </label>
            <input
              id="updates-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="min-h-[3rem] flex-1 border border-neutral-300 bg-white px-4 font-archive-body text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="min-h-[3rem] border border-neutral-900 bg-neutral-900 px-7 font-archive-body text-sm font-medium text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
            >
              {subscribing ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
