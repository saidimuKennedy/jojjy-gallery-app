import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Info, Search } from "lucide-react";
import { useRouter } from "next/router";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import EventTicket from "@/components/events/EventTicket";
import { CATALOG_CURRENCY } from "@/lib/currency";
import { resolveCallbackReference } from "@/lib/paystack-callback";

interface RetrievedTicket {
  id: string;
  price: number;
  entryLabel: string | null;
  isPremium: boolean;
  code: string;
  ticketType: string;
  holderName: string | null;
  status: string;
  checkedInAt: string | null;
}

interface RetrievedEvent {
  event: {
    id: number;
    title: string;
    slug: string;
    venue: string | null;
    startsAt: string;
    endsAt: string | null;
    imageUrl: string | null;
    timezone: string;
    category: string | null;
    tagline: string | null;
    status: string;
  };
  tickets: RetrievedTicket[];
}

export default function RetrieveTicketsPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<RetrievedEvent[] | null>(null);
  const [orderShort, setOrderShort] = useState<string | null>(null);
  const [purchasedAt, setPurchasedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const token = typeof router.query.token === "string" ? router.query.token : "";
    const callback = resolveCallbackReference(router.query);
    const ref =
      callback.reference ??
      (typeof router.query.ref === "string" ? router.query.ref : "");
    const qEmail = typeof router.query.email === "string" ? router.query.email : "";
    if (token) {
      void lookup({ token });
    } else if (ref && qEmail) {
      setReference(ref);
      setEmail(qEmail);
      void lookup({ reference: ref, email: qEmail });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const lookup = async (payload: {
    reference?: string;
    email?: string;
    token?: string;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message || "We could not find those tickets.");
        setEvents(null);
        return;
      }
      setEvents(body.data.events as RetrievedEvent[]);
      setOrderShort(body.data.orderShort ?? null);
      setPurchasedAt(body.data.purchasedAt ?? null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !email.trim()) {
      setError("Enter your order reference and the email used at checkout.");
      return;
    }
    void lookup({ reference: reference.trim(), email: email.trim() });
  };

  const ticketCount =
    events?.reduce((n, g) => n + g.tickets.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Retrieve your tickets — Jojjy Gallery</title>
      </Head>
      <Navbar variant="transparent" />
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-28 md:pt-32">
        <p className="font-archive-body text-sm font-semibold uppercase tracking-[0.24em] text-[#6fcf8a]">
          Tickets
        </p>
        <h1 className="mt-4 font-display text-5xl font-medium tracking-tight md:text-6xl">
          Retrieve your tickets
        </h1>
        <p className="mt-5 max-w-xl font-archive-body text-lg leading-[1.7] text-neutral-200">
          Enter your order reference and the email you used at checkout. We
          never list tickets by name or email alone.
        </p>

        <form onSubmit={onSubmit} className="mt-10">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="font-archive-body text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                Order reference
              </span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-2 min-h-[3rem] w-full rounded-md border border-neutral-700 bg-neutral-950 px-4 font-archive-body text-base text-white placeholder:text-neutral-500 focus:border-[#6fcf8a] focus:outline-none"
                placeholder="e.g. jojjy_abc123 or order id"
              />
            </label>
            <label className="block">
              <span className="font-archive-body text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 min-h-[3rem] w-full rounded-md border border-neutral-700 bg-neutral-950 px-4 font-archive-body text-base text-white placeholder:text-neutral-500 focus:border-[#6fcf8a] focus:outline-none"
                placeholder="you@example.com"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-3 rounded-md border border-white bg-white px-8 font-archive-body text-base font-semibold text-neutral-900 transition-colors hover:bg-transparent hover:text-white disabled:opacity-50 sm:w-[22rem]"
          >
            <Search className="h-5 w-5" aria-hidden />
            {busy ? "Finding…" : "Find Tickets"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-6 font-archive-body text-base text-red-300">
            {error}
          </p>
        )}

        {events && events.length > 0 && (
          <section className="mt-14" aria-live="polite">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-medium tracking-tight">
                Your tickets
              </h2>
              <p className="font-archive-body text-base text-neutral-200">
                {ticketCount} {ticketCount === 1 ? "ticket" : "tickets"} found
              </p>
            </div>
            <ul className="mt-8 space-y-10">
              {events.flatMap((group) =>
                group.tickets.map((t) => (
                  <li key={t.id ?? t.code}>
                    <EventTicket
                      eventTitle={group.event.title}
                      eventImageUrl={group.event.imageUrl}
                      startsAt={group.event.startsAt}
                      endsAt={group.event.endsAt}
                      venue={group.event.venue}
                      ticketType={t.ticketType}
                      price={t.price}
                      currency={CATALOG_CURRENCY}
                      entryLabel={t.entryLabel}
                      premium={t.isPremium}
                      category={group.event.category}
                      tagline={group.event.tagline}
                      timezone={group.event.timezone}
                      downloadable
                      attendeeName={t.holderName}
                      code={t.code}
                      orderRef={orderShort}
                      purchasedAt={purchasedAt}
                      status={t.status}
                      checkedInAt={t.checkedInAt}
                    />
                  </li>
                ))
              )}
            </ul>
            <p className="mt-10 flex items-center gap-3 border-t border-neutral-800 pt-6 font-archive-body text-sm text-neutral-200">
              <Info className="h-5 w-5 shrink-0" aria-hidden />
              This is your official ticket. Keep it safe and ready for entry.
            </p>
          </section>
        )}
      </main>
      <Footer tone="dark" />
    </div>
  );
}
