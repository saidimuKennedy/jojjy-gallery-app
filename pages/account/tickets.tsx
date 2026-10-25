import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import EventTicket from "@/components/events/EventTicket";
import { CATALOG_CURRENCY } from "@/lib/currency";

interface WalletTicket {
  id: string;
  code: string;
  status: string;
  holderName: string | null;
  checkedInAt: string | null;
  createdAt: string;
  purchasedAt: string;
  ticketType: string;
  price: number;
  entryLabel: string | null;
  isPremium: boolean;
  event: {
    title: string;
    slug: string;
    startsAt: string;
    endsAt: string | null;
    venue: string | null;
    imageUrl: string | null;
    timezone: string;
    category: string | null;
    tagline: string | null;
    status: string;
  };
  orderId: string;
  orderStatus: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Could not load tickets");
  }
  return body.data as WalletTicket[];
};

export default function TicketWalletPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { data: tickets, error, isLoading } = useSWR(
    authStatus === "authenticated" ? "/api/account/tickets" : null,
    fetcher
  );

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000]">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-400">
          Loading
        </p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    router.replace(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <Head>
        <title>Tickets — Account</title>
      </Head>
      <Navbar variant="transparent" />
      <main className="container mx-auto max-w-6xl px-6 pb-16 pt-24 md:pb-20 md:pt-28">
        <BackLink href="/account" tone="dark" className="mb-10">
          Back to Account
        </BackLink>
        <h1 className="font-display text-4xl font-normal tracking-tight text-white mb-2">
          Tickets
        </h1>
        <p className="text-sm font-light text-neutral-400 mb-14">
          Every ticket you own, with its entry code.
        </p>

        {error ? (
          <p role="alert" className="text-sm font-light text-red-400">
            Could not load tickets. {error.message}
          </p>
        ) : !tickets || tickets.length === 0 ? (
          <p className="text-sm font-light text-neutral-400">
            No tickets yet.{" "}
            <Link href="/events" className="underline underline-offset-4 hover:text-white">
              Browse events
            </Link>
          </p>
        ) : (
          <ul className="space-y-10">
            {tickets.map((t) => (
              <li key={t.id}>
                <EventTicket
                  eventTitle={t.event.title}
                  eventImageUrl={t.event.imageUrl}
                  startsAt={t.event.startsAt}
                  endsAt={t.event.endsAt}
                  venue={t.event.venue}
                  ticketType={t.ticketType}
                  price={t.price}
                  currency={CATALOG_CURRENCY}
                  entryLabel={t.entryLabel}
                  premium={t.isPremium}
                  category={t.event.category}
                  tagline={t.event.tagline}
                  timezone={t.event.timezone}
                  downloadable
                  attendeeName={t.holderName}
                  code={t.code}
                  orderRef={t.orderId.slice(0, 8)}
                  purchasedAt={t.purchasedAt}
                  status={
                    t.orderStatus !== "PAID" && t.status === "VALID"
                      ? "CANCELLED"
                      : t.status
                  }
                  checkedInAt={t.checkedInAt}
                />
                <Link
                  href={`/events/${t.event.slug}`}
                  className="mt-3 inline-block font-archive-body text-sm text-neutral-200 underline-offset-4 hover:underline"
                >
                  View event
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer tone="dark" />
    </div>
  );
}
