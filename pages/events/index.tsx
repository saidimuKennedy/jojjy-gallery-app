import React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

interface TicketTypeSummary {
  quantity: number;
  quantitySold: number;
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load events");
  }
  return body.data as EventListItem[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function eventStatusLabel(event: EventListItem): {
  label: string;
  detail?: string;
} {
  if (event.status === "COMPLETED") {
    return { label: "Past" };
  }
  const tickets = event.ticketTypes ?? [];
  if (tickets.length > 0) {
    const remaining = tickets.reduce(
      (s, t) => s + Math.max(0, t.quantity - t.quantitySold),
      0
    );
    if (remaining === 0) return { label: "Sold out" };
    if (remaining <= 24) {
      return { label: "Registration open", detail: `${remaining} seats remaining` };
    }
  }
  return { label: "Upcoming" };
}

export default function EventsIndexPage() {
  const { data: events, error, isLoading } = useSWR("/api/events", fetcher);

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

      <main className="px-5 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center mb-20 md:mb-28"
        >
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-neutral-900 tracking-tight">
            Events
          </h1>
          <p className="mt-8 font-archive-body text-lg md:text-[1.125rem] font-normal leading-[1.7] text-neutral-600 max-w-lg mx-auto">
            Openings, talks, and evenings in the room with the work — fleeting
            by design.
          </p>
        </motion.div>

        {isLoading && (
          <p className="text-center font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
            Loading
          </p>
        )}
        {error && (
          <p className="text-center font-archive-body text-base text-neutral-600">
            Could not load events.
          </p>
        )}
        {events && events.length === 0 && (
          <p className="text-center font-archive-body text-base text-neutral-500">
            No published events yet.
          </p>
        )}

        {events && events.length > 0 && (
          <ul className="mx-auto max-w-4xl space-y-0">
            {events.map((event, index) => {
              const status = eventStatusLabel(event);
              const imageLeft = index % 2 === 0;
              return (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="group grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 border-t border-neutral-100 py-14 md:py-20 items-center"
                  >
                    <div
                      className={`md:col-span-5 ${
                        imageLeft ? "md:order-1" : "md:order-2"
                      }`}
                    >
                      {event.imageUrl ? (
                        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                          <img
                            src={event.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-neutral-100" />
                      )}
                    </div>
                    <div
                      className={`md:col-span-7 ${
                        imageLeft ? "md:order-2" : "md:order-1"
                      }`}
                    >
                      <p className="font-archive-body text-[0.7rem] font-medium uppercase tracking-[0.28em] text-neutral-500 mb-4">
                        {status.label}
                        {status.detail ? ` · ${status.detail}` : ""}
                        {" · "}
                        {formatDate(event.startsAt)}
                      </p>
                      <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-light tracking-tight text-neutral-900 leading-[1.1] transition-colors group-hover:text-neutral-600">
                        {event.title}
                      </h2>
                      {event.venue && (
                        <p className="mt-5 font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-500">
                          {event.venue}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-5 font-archive-body text-[1.0625rem] md:text-lg leading-[1.7] text-neutral-600 line-clamp-3 max-w-xl">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
