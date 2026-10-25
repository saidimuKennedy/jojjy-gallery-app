import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import { ArrowRight, MapPin } from "lucide-react";
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

interface TicketTypeSummary {
  quantity: number;
  quantitySold: number;
  quantityReserved: number;
}

interface EventListItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  venue: string | null;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  ticketTypes?: TicketTypeSummary[];
}

const TABS = ["All events", "Openings", "Talks", "Exhibitions", "Studio"] as const;
type Tab = (typeof TABS)[number];

const TAB_TAG: Record<Tab, string | null> = {
  "All events": null,
  Openings: "Opening",
  Talks: "Talk",
  Exhibitions: "Exhibition",
  Studio: "Studio",
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load events");
  }
  return body.data as EventListItem[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function seatNote(event: EventListItem): string | null {
  const tickets = event.ticketTypes ?? [];
  if (tickets.length === 0) return null;
  const remaining = tickets.reduce(
    (s, t) => s + Math.max(0, t.quantity - t.quantitySold - t.quantityReserved),
    0
  );
  if (remaining === 0) return "Sold out";
  return remaining <= 24 ? `${remaining} seats remaining` : null;
}

export default function EventsIndexPage() {
  const { data: events, error, isLoading } = useSWR("/api/events", fetcher);
  const [tab, setTab] = useState<Tab>("All events");
  const [showPast, setShowPast] = useState(false);

  const visible = useMemo(() => {
    const tag = TAB_TAG[tab];
    return (events ?? [])
      .filter((e) => (e.status === "COMPLETED") === showPast)
      .map((e) => ({ event: e, tags: deriveTags(e.title, e.description) }))
      .filter(({ tags }) => !tag || tags.includes(tag));
  }, [events, tab, showPast]);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Events — Njenga Ngugi</title>
        <meta
          name="description"
          content="Exhibitions, openings, and gatherings — evenings you won't want to miss."
        />
      </Head>
      <Navbar />

      <main className="pb-24">
        <section className="relative isolate overflow-hidden bg-black">
          <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[62%]">
            <OptimizedImage
              src="/images/studio/events-hero.jpg"
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
              <p className={`${HERO_LABEL} text-white/80`}>Events</p>
              <h1 className={`mt-5 ${HERO_COMPACT_TITLE} text-white`}>
                In the room with the work
              </h1>
              <p className={`mt-5 max-w-md ${HERO_BODY} text-white/90`}>
                Openings, talks, and evenings that bring the art, music, and
                community together.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <a
                  href="#events"
                  className="inline-flex min-h-[3rem] items-center border border-white bg-white px-7 py-3 font-archive-body text-sm font-medium text-neutral-900 transition-colors hover:bg-transparent hover:text-white"
                >
                  Upcoming events
                </a>
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-2 font-archive-body text-sm font-medium text-white underline-offset-4 hover:underline"
                >
                  Stay updated
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section
          id="events"
          className="mx-auto max-w-5xl scroll-mt-20 px-6 md:px-10"
        >
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
            <button
              type="button"
              onClick={() => setShowPast((p) => !p)}
              className="inline-flex items-center gap-2 font-archive-body text-sm text-neutral-700 hover:text-neutral-900"
            >
              {showPast ? "Upcoming events" : "Past events"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          {isLoading && (
            <p className="py-16 text-center font-archive-body text-sm text-neutral-500">
              Loading
            </p>
          )}
          {error && (
            <p className="py-16 text-center font-archive-body text-base text-neutral-600">
              Could not load events.
            </p>
          )}
          {events && visible.length === 0 && (
            <p className="py-16 text-center font-archive-body text-base text-neutral-500">
              {showPast ? "No past events." : "No upcoming events here yet."}
            </p>
          )}

          {visible.length > 0 && (
            <ul className="divide-y divide-neutral-200">
              {visible.map(({ event, tags }) => {
                const note = seatNote(event);
                return (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.slug}`}
                      className="group grid items-center gap-6 py-8 md:grid-cols-[minmax(0,300px)_1fr_auto] md:gap-10"
                    >
                      <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
                        {event.imageUrl && (
                          <OptimizedImage
                            src={event.imageUrl}
                            alt=""
                            fill
                            preset="card"
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-archive-body text-xs font-medium uppercase tracking-[0.14em] text-neutral-600">
                          {formatDate(event.startsAt)}
                          {note ? ` · ${note}` : ""}
                        </p>
                        <h2 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight text-neutral-900 md:text-[2rem]">
                          {event.title}
                        </h2>
                        {event.venue && (
                          <p className="mt-3 flex items-center gap-2 font-archive-body text-sm text-neutral-700">
                            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                            {event.venue}
                          </p>
                        )}
                        {event.description && (
                          <p className="mt-3 max-w-xl font-archive-body text-base leading-[1.65] text-neutral-700 line-clamp-3">
                            {event.description}
                          </p>
                        )}
                        {tags.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {tags.map((t) => (
                              <li
                                key={t}
                                className="bg-neutral-100 px-2.5 py-1 font-archive-body text-xs uppercase tracking-[0.1em] text-neutral-700"
                              >
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <ArrowRight
                        className="hidden h-5 w-5 text-neutral-900 transition-transform group-hover:translate-x-1 md:block"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
