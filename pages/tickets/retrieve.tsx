import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import QRCode from "qrcode";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

interface RetrievedTicket {
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
    status: string;
  };
  tickets: RetrievedTicket[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TicketCard({ ticket }: { ticket: RetrievedTicket }) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(ticket.code, { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [ticket.code]);

  const invalid = ticket.status === "REFUNDED" || ticket.status === "CANCELLED";
  return (
    <div className="flex flex-col items-center gap-4 border border-neutral-200 p-6 sm:flex-row sm:items-start">
      <div className="flex h-[220px] w-[220px] items-center justify-center bg-neutral-50">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR code for ticket ${ticket.code}`} width={220} height={220} />
        ) : (
          <span className="text-xs text-neutral-400">Loading QR…</span>
        )}
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500">
          {ticket.ticketType}
        </p>
        <p className="mt-2 font-display text-lg font-light text-neutral-900">
          {ticket.holderName || "Guest"}
        </p>
        <p className="mt-3 font-mono text-sm tracking-widest text-neutral-700">
          {ticket.code}
        </p>
        <p className="mt-3 font-archive-body text-sm">
          {invalid ? (
            <span className="text-red-600">
              {ticket.status === "REFUNDED" ? "Refunded" : "Cancelled"} — not
              valid for entry
            </span>
          ) : ticket.checkedInAt ? (
            <span className="text-neutral-500">
              Checked in {formatDateTime(ticket.checkedInAt)}
            </span>
          ) : (
            <span className="text-green-700">Valid for entry</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function RetrieveTicketsPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<RetrievedEvent[] | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const token = typeof router.query.token === "string" ? router.query.token : "";
    const ref = typeof router.query.ref === "string" ? router.query.ref : "";
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

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Head>
        <title>Retrieve your tickets — Jojjy Gallery</title>
      </Head>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500">
          Tickets
        </p>
        <h1 className="mt-4 font-display text-3xl font-light tracking-tight md:text-4xl">
          Retrieve your tickets
        </h1>
        <p className="mt-4 font-archive-body text-[1.0625rem] leading-[1.7] text-neutral-600">
          Enter your order reference and the email you used at checkout. We
          never list tickets by name or email alone.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">
              Order reference
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              placeholder="e.g. jojjy_abc123 or order id"
            />
          </label>
          <label className="block">
            <span className="font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-40"
          >
            {busy ? "…" : "Find tickets"}
          </button>
        </form>

        {error && (
          <p className="mt-6 font-archive-body text-sm text-red-600">{error}</p>
        )}

        {events && events.length > 0 && (
          <div className="mt-12 space-y-12">
            {events.map((group) => (
              <section key={group.event.id}>
                <h2 className="font-display text-2xl font-light tracking-tight">
                  {group.event.title}
                </h2>
                <p className="mt-1 font-archive-body text-sm text-neutral-500">
                  {formatDateTime(group.event.startsAt)}
                  {group.event.venue ? ` · ${group.event.venue}` : ""}
                </p>
                <div className="mt-6 space-y-4">
                  {group.tickets.map((t) => (
                    <TicketCard key={t.code} ticket={t} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
