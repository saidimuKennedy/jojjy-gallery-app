import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Ticket } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import BackLink from "@/components/ui/BackLink";
import TicketCheckout, {
  type TicketCheckoutTarget,
} from "@/components/events/TicketCheckout";
import { CATALOG_CURRENCY } from "@/lib/currency";
import { HERO_LABEL } from "@/lib/music/hero-styles";

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
    description: string | null;
    refundPolicy: string | null;
    price: number;
    quantity: number;
    quantitySold: number;
    quantityReserved: number;
    salesStart: string | null;
    salesEnd: string | null;
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

function venueParts(venue: string): { name: string; rest: string } {
  const [name, ...rest] = venue.split(",");
  return { name: name.trim(), rest: rest.join(",").trim() };
}

function ticketPerks(name: string): string[] {
  // Neutral, non-committal inclusions only: specific fulfillment benefits
  // (meet & greet, signed items, priority entry) must come from CRM-managed
  // data when that tooling exists — never hardcoded here.
  void name;
  return ["Access to the evening", "Exhibition viewing"];
}

type TicketSaleStatus = "upcoming" | "open" | "closed" | "sold_out";

function ticketSaleStatus(tt: EventDetail["ticketTypes"][number]): TicketSaleStatus {
  const left = Math.max(0, tt.quantity - tt.quantitySold - tt.quantityReserved);
  if (left === 0) return "sold_out";
  const now = Date.now();
  if (tt.salesStart && now < new Date(tt.salesStart).getTime()) {
    return "upcoming";
  }
  if (tt.salesEnd && now > new Date(tt.salesEnd).getTime()) {
    return "closed";
  }
  return "open";
}

function ticketSaleLabel(
  tt: EventDetail["ticketTypes"][number],
  status: TicketSaleStatus
): string {
  if (status === "sold_out") return "Sold out";
  if (status === "closed") return "Ticket sales closed";
  if (status === "upcoming" && tt.salesStart) {
    return `On sale from ${formatDay(tt.salesStart)}`;
  }
  return "";
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
  const [ticketQty, setTicketQty] = useState<Record<number, number>>({});
  const [checkoutTarget, setCheckoutTarget] =
    useState<TicketCheckoutTarget | null>(null);

  const { data: event, error, isLoading, mutate } = useSWR(
    eventSlug ? `/api/events/${eventSlug}` : null,
    fetcher
  );

  const capacity = useMemo(() => {
    if (!event?.ticketTypes.length) return null;
    const total = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
    const sold = event.ticketTypes.reduce((s, t) => s + t.quantitySold, 0);
    const reserved = event.ticketTypes.reduce(
      (s, t) => s + t.quantityReserved,
      0
    );
    return {
      total,
      sold,
      remaining: Math.max(0, total - sold - reserved),
    };
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

  const openTicketCheckout = (tt: EventDetail["ticketTypes"][number]) => {
    if (!event) return;
    const remaining = Math.max(
      0,
      tt.quantity - tt.quantitySold - tt.quantityReserved
    );
    if (remaining <= 0) return;
    setCheckoutTarget({
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: event.title,
      venue: event.venue,
      startsAt: event.startsAt,
      currency: CATALOG_CURRENCY,
      ticketTypeId: tt.id,
      ticketTypeName: tt.name,
      price: tt.price,
      refundPolicy: tt.refundPolicy,
      remaining,
    });
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
        <p className="font-display text-sm tracking-[0.2em] uppercase text-neutral-500">
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
          <h1 className="font-display text-3xl font-normal text-neutral-900 mb-4">
            Event not found
          </h1>
          <BackLink href="/events" className="mt-2">
            Back to Events
          </BackLink>
        </div>
        <Footer />
      </>
    );
  }
  const isCompleted = event.status === "COMPLETED";
  const isSoldOut = capacity != null && capacity.remaining === 0 && !isCompleted;
  const currency = CATALOG_CURRENCY;
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
        {/* Hero: image left, invitation right */}
        <section className="relative isolate overflow-hidden bg-black text-white">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[320px] md:min-h-[min(62svh,640px)]">
              {event.imageUrl ? (
                <OptimizedImage
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  preset="hero"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black" />
              <Link
                href="/events"
                className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 font-archive-body text-sm text-white hover:underline md:left-10"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to events
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-center px-6 py-12 md:px-12 md:py-16 lg:pr-20"
            >
              <p className={`${HERO_LABEL} text-white/70`}>
                {isCompleted
                  ? "Past event"
                  : isSoldOut
                    ? "Sold out"
                    : "Registration open"}
              </p>
              <h1 className="mt-5 font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
                {event.title}
              </h1>
              {event.description && (
                <p className="mt-6 max-w-lg font-display text-xl font-normal leading-[1.55] text-white/90 line-clamp-4">
                  {event.description}
                </p>
              )}

              <dl className="mt-8 space-y-6 border-t border-white/15 pt-8">
                <div className="flex gap-4">
                  <Calendar className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.25} aria-hidden />
                  <div>
                    <dt className="sr-only">Date</dt>
                    <dd className="font-archive-body text-base font-medium">
                      {formatDay(event.startsAt)}
                    </dd>
                    <dd className="mt-1 font-archive-body text-sm text-white/70">
                      {event.openingHours ||
                        `${formatTime(event.startsAt)}${
                          event.artistTalkAt
                            ? ` · Talk ${formatTime(event.artistTalkAt)}`
                            : ""
                        }`}
                    </dd>
                  </div>
                </div>
                {event.venue && (
                  <div className="flex gap-4">
                    <MapPin className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.25} aria-hidden />
                    <div>
                      <dt className="sr-only">Venue</dt>
                      <dd className="font-archive-body text-base font-medium">
                        {venueParts(event.venue).name}
                      </dd>
                      {venueParts(event.venue).rest && (
                        <dd className="mt-1 font-archive-body text-sm text-white/70">
                          {venueParts(event.venue).rest}
                        </dd>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <Ticket className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.25} aria-hidden />
                  <div>
                    <dt className="sr-only">Tickets</dt>
                    <dd className="font-archive-body text-base font-medium">
                      {isSoldOut
                        ? "Sold out"
                        : capacity
                          ? "Limited tickets"
                          : "RSVP"}
                    </dd>
                    <dd className="mt-1 font-archive-body text-sm text-white/70">
                      {isCompleted
                        ? "This event has passed"
                        : capacity && capacity.remaining > 0 && capacity.remaining <= 40
                          ? `${capacity.remaining} seats remaining`
                          : "Reserve your place below"}
                    </dd>
                  </div>
                </div>
              </dl>
            </motion.div>
          </div>
        </section>

        {/* About the event */}
        {event.description &&
          (event.description.length > 200 || atmosphere.length > 0) && (
            <section className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
              <div
                className={`grid items-center gap-10 md:gap-16 ${
                  atmosphere.length > 0 ? "md:grid-cols-[1fr_1.35fr]" : ""
                }`}
              >
                <div className="max-w-md">
                  <p className={`${HERO_LABEL} text-neutral-600`}>
                    About the event
                  </p>
                  <h2 className="mt-4 font-display text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 md:text-5xl">
                    Art, conversation and community
                  </h2>
                  <div className="mt-6 space-y-4 font-archive-body text-base leading-[1.7] text-neutral-700">
                    {event.description.split(/\n{2,}/).map((para) => (
                      <p key={para}>{para}</p>
                    ))}
                  </div>
                </div>
                {atmosphere[0] && (
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <OptimizedImage
                      src={atmosphere[0].url}
                      alt={atmosphere[0].description || ""}
                      fill
                      preset="card"
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

        {/* Chapter: Tickets + RSVP */}
        {!isCompleted && (
          <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16">
            <div className="mx-auto max-w-2xl">
              <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500 mb-4">
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
                    const left = Math.max(
                      0,
                      tt.quantity - tt.quantitySold - tt.quantityReserved
                    );
                    const saleStatus = ticketSaleStatus(tt);
                    const saleLabel = ticketSaleLabel(tt, saleStatus);
                    const canBuy = saleStatus === "open";
                    return (
                      <div
                        key={tt.id}
                        className="border-t border-neutral-200 py-10 first:border-t-0 first:pt-0"
                      >
                        <h3 className="font-display text-2xl md:text-[1.75rem] font-normal tracking-tight text-neutral-900">
                          {tt.name}
                        </h3>
                        {tt.description && (
                          <p className="mt-3 font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-600">
                            {tt.description}
                          </p>
                        )}
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
                        <p className="mt-6 font-display text-xl font-normal text-neutral-900">
                          {currency} {tt.price.toLocaleString()}
                        </p>
                        {saleLabel && (
                          <p className="mt-2 font-archive-body text-sm text-neutral-500">
                            {saleLabel}
                          </p>
                        )}
                        {left > 0 && left <= 15 && saleStatus === "open" && (
                          <p className="mt-2 font-archive-body text-sm text-neutral-500">
                            {left} left
                          </p>
                        )}
                        {saleStatus === "open" && (
                          <div className="mt-4 flex items-center gap-3">
                            <span className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">
                              Qty
                            </span>
                            <div className="inline-flex items-stretch border border-neutral-300 bg-white">
                              <button
                                type="button"
                                aria-label={`Fewer ${tt.name} tickets`}
                                onClick={() =>
                                  setTicketQty((q) => ({
                                    ...q,
                                    [tt.id]: Math.max(1, (q[tt.id] ?? 1) - 1),
                                  }))
                                }
                                disabled={(ticketQty[tt.id] ?? 1) <= 1}
                                className="flex w-9 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                              >
                                −
                              </button>
                              <span
                                aria-live="polite"
                                className="w-10 border-x border-neutral-300 py-1 text-center text-sm text-neutral-900"
                              >
                                {ticketQty[tt.id] ?? 1}
                              </span>
                              <button
                                type="button"
                                aria-label={`More ${tt.name} tickets`}
                                onClick={() =>
                                  setTicketQty((q) => ({
                                    ...q,
                                    [tt.id]: Math.min(
                                      left,
                                      (q[tt.id] ?? 1) + 1
                                    ),
                                  }))
                                }
                                disabled={(ticketQty[tt.id] ?? 1) >= left}
                                className="flex w-9 items-center justify-center text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-display text-base font-normal text-neutral-900">
                              {currency}{" "}
                              {(tt.price * (ticketQty[tt.id] ?? 1)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openTicketCheckout(tt)}
                          disabled={!canBuy}
                          className="mt-6 border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {saleStatus === "open"
                            ? tt.price > 0
                              ? "Buy ticket"
                              : "Get free ticket"
                            : saleStatus === "sold_out"
                              ? "Sold out"
                              : saleStatus === "upcoming"
                                ? "Not on sale yet"
                                : "Sales closed"}
                        </button>
                        {saleStatus === "open" && tt.price > 0 && (
                          <p className="mt-3 text-xs font-light text-neutral-600">
                            Charged in KES via Paystack — exact amount shown
                            before you authorize.
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
                  <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
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

        {/* Moments */}
        {atmosphere.length > 1 && (
          <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
            <p className={`${HERO_LABEL} text-neutral-600`}>
              {isCompleted ? "From the evening" : "Atmosphere"}
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-neutral-900">
              {isCompleted ? "Moments from the studio" : "A glimpse of the evening"}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-[1.25fr_1.05fr_0.7fr] md:grid-rows-2 md:gap-4">
              {atmosphere.map((file, i) => {
                const layout =
                  i === 0
                    ? "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto md:min-h-[380px]"
                    : i === 1
                      ? "aspect-[3/4] md:row-span-2 md:aspect-auto"
                      : "aspect-[4/3]";
                return (
                  <div
                    key={file.id}
                    className={`relative overflow-hidden bg-neutral-100 ${layout}`}
                  >
                    <OptimizedImage
                      src={file.url}
                      alt={file.description || ""}
                      fill
                      preset="card"
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Directions */}
        {event.venue && (
          <section className="border-t border-neutral-200">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_1.4fr] md:gap-16 md:px-10">
              <div>
                <p className={`${HERO_LABEL} text-neutral-600`}>Directions</p>
                <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-neutral-900">
                  {/studio/i.test(event.venue) ? "Find the studio" : "Find the venue"}
                </h2>
                {event.directions && (
                  <p className="mt-4 whitespace-pre-line font-archive-body text-base leading-[1.7] text-neutral-700">
                    {event.directions}
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-[3rem] items-center gap-2 border border-neutral-900 bg-neutral-900 px-6 py-3 font-archive-body text-sm font-medium text-white transition-colors hover:bg-white hover:text-neutral-900"
                >
                  Open in Google Maps
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <div className="relative h-[260px] overflow-hidden bg-neutral-100">
                <iframe
                  title={`Map of ${event.venue}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(event.venue)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0 grayscale"
                />
              </div>
            </div>
          </section>
        )}

        {/* Chapter: What to expect — end on anticipation */}
        {!isCompleted && (
          <section className="border-t border-neutral-100 bg-neutral-950 px-5 py-24 md:px-10 md:py-32 lg:px-16 text-neutral-50">
            <div className="mx-auto max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-normal tracking-tight mb-14">
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
              <p className="mt-16 font-display text-xl md:text-2xl font-normal leading-snug text-neutral-300 max-w-md">
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
              <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500 mb-12">
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
      {checkoutTarget && (
        <TicketCheckout
          target={checkoutTarget}
          initialQuantity={ticketQty[checkoutTarget.ticketTypeId] ?? 1}
          onClose={() => setCheckoutTarget(null)}
        />
      )}
      <Footer />
    </div>
  );
}
