import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface EventDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  venue: string | null;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  directions: string | null;
  openingHours: string | null;
  artistTalkAt: string | null;
  ticketTypes: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    quantitySold: number;
  }[];
  mediaFiles: {
    id: number;
    url: string;
    type: string;
    description: string | null;
    thumbnailUrl: string | null;
  }[];
  pressMentions: {
    id: number;
    title: string;
    url: string;
    publication: string | null;
    publishedAt: string | null;
  }[];
  userHasRsvp: boolean;
  userRsvpStatus: string | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load event");
  }
  return body.data as EventDetail;
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function venueShort(venue: string | null): string {
  if (!venue) return "";
  const parts = venue.split(",");
  return (parts[parts.length - 1] || parts[0] || venue).trim();
}

function ticketPerks(name: string): string[] {
  const n = name.toLowerCase();
  if (n.includes("patron") || n.includes("vip")) {
    return [
      "Priority entry",
      "Artist meet & greet",
      "Signed exhibition card",
    ];
  }
  return ["Access to the evening", "Exhibition viewing"];
}

function buildGoogleCalendarUrl(event: EventDetail): string {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + 3 * 3600_000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || "",
    location: event.venue || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcs(event: EventDetail): string {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + 3 * 3600_000);
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-|Njenga Ngugi|Events|EN",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@jojjygallery`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : "",
    event.venue ? `LOCATION:${escape(event.venue)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

const EXPECTATIONS = [
  "Artist introduction",
  "Guided walk through new works",
  "Conversation with the artist",
  "Opportunity to purchase originals",
  "Drinks and conversation",
];

export default function EventDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const eventSlug = typeof slug === "string" ? slug : undefined;
  const { data: session, status: authStatus } = useSession();
  const [rsvpBusy, setRsvpBusy] = useState(false);

  const { data: event, error, isLoading, mutate } = useSWR(
    eventSlug ? `/api/events/${eventSlug}` : null,
    fetcher
  );

  const capacity = useMemo(() => {
    if (!event?.ticketTypes.length) return null;
    const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
    const sold = event.ticketTypes.reduce((s, t) => s + t.quantitySold, 0);
    return { total, sold, remaining: Math.max(0, total - sold) };
  }, [event]);

  const handleRsvp = async () => {
    if (!event) return;
    if (authStatus === "loading") return;
    if (!session?.user) {
      toast.error("Sign in to reserve your place");
      router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setRsvpBusy(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "GOING" }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not reserve your place");
        return;
      }
      toast.success("You're on the list");
      await mutate();
    } catch {
      toast.error("Could not reserve your place");
    } finally {
      setRsvpBusy(false);
    }
  };

  const handleCancelRsvp = async () => {
    if (!event) return;
    setRsvpBusy(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/rsvp`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not cancel");
        return;
      }
      toast.success("Reservation cancelled");
      await mutate();
    } catch {
      toast.error("Could not cancel");
    } finally {
      setRsvpBusy(false);
    }
  };

  const downloadIcs = () => {
    if (!event) return;
    const blob = new Blob([buildIcs(event)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="font-display text-sm tracking-[0.28em] uppercase text-neutral-400">
          Loading
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
          <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
            Event not found
          </h1>
          <Link
            href="/events"
            className="font-display text-xs uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 hover:underline"
          >
            Back to events
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const isCompleted = event.status === "COMPLETED";
  const isSoldOut = capacity != null && capacity.remaining === 0 && !isCompleted;
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";
  const atmosphere = event.mediaFiles.filter((f) => f.type === "IMAGE");

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Head>
        <title>{event.title} — Njenga Ngugi Events</title>
        <meta
          name="description"
          content={event.description || event.title}
        />
      </Head>
      <Navbar />

      <main>
        {/* Chapter: invitation */}
        <section className="px-5 pt-10 pb-12 md:px-10 md:pt-16 lg:px-16 lg:pb-16">
          <Link
            href="/events"
            className="mb-12 inline-block font-display text-xs uppercase tracking-[0.28em] text-neutral-400 transition-colors hover:text-neutral-800"
          >
            ← Events
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl"
          >
            <p className="font-archive-body text-[0.7rem] font-medium uppercase tracking-[0.32em] text-neutral-500 mb-8">
              {isCompleted
                ? "Past"
                : isSoldOut
                  ? "Sold out"
                  : "Registration open"}
              {capacity && !isCompleted && capacity.remaining > 0 && capacity.remaining <= 30
                ? ` · ${capacity.remaining} seats remaining`
                : !isCompleted && capacity
                  ? " · Limited capacity"
                  : ""}
            </p>

            <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[4.5rem] font-light leading-[1.05] tracking-tight text-neutral-900 max-w-4xl">
              {event.title}
            </h1>
          </motion.div>
        </section>

        {/* Chapter: cinematic image */}
        {event.imageUrl && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.15 }}
            className="relative w-full"
          >
            <div className="relative h-[55vh] min-h-[320px] max-h-[720px] w-full overflow-hidden bg-neutral-100 md:h-[70vh]">
              <OptimizedImage
                src={event.imageUrl}
                alt=""
                fill
                preset="hero"
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </motion.section>
        )}

        {/* Chapter: description */}
        {event.description && (
          <section className="px-5 py-20 md:px-10 md:py-28 lg:px-16">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-2xl font-archive-body text-lg md:text-[1.125rem] font-normal leading-[1.7] text-neutral-700"
            >
              {event.description}
            </motion.p>
          </section>
        )}

        {/* Chapter: Event facts */}
        <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16">
          <div className="mx-auto max-w-2xl">
            <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-12">
              Event
            </p>
            <dl className="space-y-10">
              <div>
                <dt className="sr-only">Date</dt>
                <dd className="font-display text-[1.35rem] md:text-[1.5rem] font-light tracking-tight text-neutral-900">
                  {formatDay(event.startsAt)}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Time</dt>
                <dd className="font-archive-body text-[1.0625rem] md:text-[1.125rem] font-normal text-neutral-700 leading-[1.7]">
                  {event.openingHours || formatTime(event.startsAt)}
                </dd>
              </div>
              {event.venue && (
                <div>
                  <dt className="sr-only">Venue</dt>
                  <dd className="font-archive-body text-[1.0625rem] md:text-[1.125rem] font-normal text-neutral-700 leading-[1.7]">
                    {venueShort(event.venue)}
                    <span className="block mt-1 text-neutral-500 text-base">
                      {event.venue}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* Chapter: Experience */}
        {!isCompleted && (
          <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16 bg-neutral-50">
            <div className="mx-auto max-w-2xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-12">
                Experience
              </p>
              <ul className="space-y-6">
                {event.artistTalkAt && (
                  <li className="font-archive-body text-[1.0625rem] md:text-[1.125rem] leading-[1.7] text-neutral-800">
                    Artist talk
                    <span className="block text-neutral-500 text-base mt-1">
                      {formatTime(event.artistTalkAt)}
                    </span>
                  </li>
                )}
                <li className="font-archive-body text-[1.0625rem] md:text-[1.125rem] leading-[1.7] text-neutral-800">
                  Opening reception
                </li>
                <li className="font-archive-body text-[1.0625rem] md:text-[1.125rem] leading-[1.7] text-neutral-800">
                  Collectors meet &amp; greet
                </li>
                <li className="font-archive-body text-[1.0625rem] md:text-[1.125rem] leading-[1.7] text-neutral-800">
                  Refreshments
                </li>
              </ul>
            </div>
          </section>
        )}

        {/* Atmosphere — living community */}
        {atmosphere.length > 0 && (
          <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16">
            <div className="mx-auto max-w-5xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-12">
                {isCompleted ? "From the evening" : "Atmosphere"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {atmosphere.map((file, i) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: i * 0.06 }}
                    className={`relative overflow-hidden bg-neutral-100 ${
                      i === 0 ? "sm:col-span-2 aspect-[16/10]" : "aspect-[4/3]"
                    }`}
                  >
                    <OptimizedImage
                      src={file.url}
                      alt={file.description || ""}
                      fill
                      preset="card"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {event.directions && (
          <section className="border-t border-neutral-100 px-5 py-16 md:px-10 md:py-20 lg:px-16">
            <div className="mx-auto max-w-2xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-6">
                Directions
              </p>
              <p className="font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-600 whitespace-pre-line">
                {event.directions}
              </p>
            </div>
          </section>
        )}

        {/* Chapter: Tickets + RSVP */}
        {!isCompleted && (
          <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16">
            <div className="mx-auto max-w-2xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-4">
                Tickets
              </p>
              {capacity && capacity.remaining > 0 && capacity.remaining <= 40 && (
                <p className="font-archive-body text-base text-neutral-500 mb-12">
                  {capacity.remaining} seats remaining
                </p>
              )}
              {isSoldOut && (
                <p className="font-archive-body text-base text-neutral-500 mb-12">
                  This evening is sold out.
                </p>
              )}

              {event.ticketTypes.length > 0 && (
                <div className="mb-16">
                  {event.ticketTypes.map((tt) => {
                    const left = Math.max(0, tt.quantity - tt.quantitySold);
                    return (
                      <div
                        key={tt.id}
                        className="border-t border-neutral-200 py-10 first:border-t-0 first:pt-0"
                      >
                        <h3 className="font-display text-2xl md:text-[1.75rem] font-light tracking-tight text-neutral-900">
                          {tt.name}
                        </h3>
                        <ul className="mt-5 space-y-2">
                          {ticketPerks(tt.name).map((perk) => (
                            <li
                              key={perk}
                              className="font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-600"
                            >
                              {perk}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-6 font-display text-xl font-light text-neutral-900">
                          {currency} {tt.price.toLocaleString()}
                        </p>
                        {left > 0 && left <= 15 && (
                          <p className="mt-2 font-archive-body text-sm text-neutral-500">
                            {left} left
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <div className="border-t border-neutral-200" />
                </div>
              )}

              <div className="space-y-6">
                {event.userHasRsvp ? (
                  <>
                    <p className="font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-700">
                      You&apos;re reserved for this evening.
                    </p>
                    <button
                      type="button"
                      onClick={handleCancelRsvp}
                      disabled={rsvpBusy}
                      className="border border-neutral-300 bg-white px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
                    >
                      {rsvpBusy ? "…" : "Cancel reservation"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleRsvp}
                    disabled={rsvpBusy || isSoldOut}
                    className="w-full sm:w-auto border border-neutral-900 bg-neutral-900 px-10 py-5 font-display text-xs uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {rsvpBusy
                      ? "…"
                      : isSoldOut
                        ? "Sold out"
                        : "Reserve your place"}
                  </button>
                )}

                <div className="pt-4">
                  <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 mb-4">
                    Add to calendar
                  </p>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    <button
                      type="button"
                      onClick={downloadIcs}
                      className="font-archive-body text-base text-neutral-700 underline-offset-4 hover:underline"
                    >
                      Apple / Outlook (.ics)
                    </button>
                    <a
                      href={buildGoogleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-archive-body text-base text-neutral-700 underline-offset-4 hover:underline"
                    >
                      Google Calendar
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Chapter: What to expect — end on anticipation */}
        {!isCompleted && (
          <section className="border-t border-neutral-100 bg-neutral-950 px-5 py-24 md:px-10 md:py-32 lg:px-16 text-neutral-50">
            <div className="mx-auto max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-light tracking-tight mb-14">
                What to expect
              </h2>
              <ul className="space-y-7">
                {EXPECTATIONS.map((item) => (
                  <li
                    key={item}
                    className="font-archive-body text-lg md:text-[1.125rem] font-normal leading-[1.7] text-neutral-200 border-b border-neutral-800 pb-7 last:border-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-16 font-display text-xl md:text-2xl font-light leading-snug text-neutral-300 max-w-md">
                An evening in the room with the work — and the people who care
                about it.
              </p>
            </div>
          </section>
        )}

        {/* Post-event press */}
        {isCompleted && event.pressMentions.length > 0 && (
          <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16">
            <div className="mx-auto max-w-2xl">
              <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-12">
                Press
              </p>
              <ul className="space-y-8">
                {event.pressMentions.map((pm) => (
                  <li key={pm.id}>
                    <a
                      href={pm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-archive-body text-lg leading-[1.7] text-neutral-800 underline-offset-4 hover:underline"
                    >
                      {pm.title}
                    </a>
                    {(pm.publication || pm.publishedAt) && (
                      <p className="mt-2 font-archive-body text-base text-neutral-500">
                        {[
                          pm.publication,
                          pm.publishedAt
                            ? new Date(pm.publishedAt).toLocaleDateString()
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
