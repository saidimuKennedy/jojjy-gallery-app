import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";

interface WalletTicket {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  ticketType: string;
  event: {
    title: string;
    slug: string;
    startsAt: string;
    endsAt: string | null;
    venue: string | null;
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
      <main className="container mx-auto max-w-2xl px-4 pb-16 pt-24 md:pb-20 md:pt-28">
        <BackLink href="/account" tone="dark" className="mb-10">
          Back to Account
        </BackLink>
        <h1 className="font-display text-4xl font-light tracking-tight text-white mb-2">
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
          <ul className="space-y-6">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="border border-neutral-800 bg-neutral-950 px-5 py-5"
              >
                <Link
                  href={`/events/${t.event.slug}`}
                  className="font-display text-xl font-light text-white hover:text-neutral-300"
                >
                  {t.event.title}
                </Link>
                <p className="mt-1 text-xs font-light text-neutral-400">
                  {new Date(t.event.startsAt).toLocaleDateString()}
                  {t.event.venue ? ` · ${t.event.venue}` : ""} ·{" "}
                  {t.ticketType}
                </p>
                <p className="mt-3 font-mono text-lg tracking-widest text-white">
                  {t.code}
                </p>
                <p className="mt-2 text-xs font-light text-neutral-400">
                  {t.status}
                  {t.orderStatus !== "PAID"
                    ? ` · order ${t.orderStatus.toLowerCase()}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer tone="dark" />
    </div>
  );
}
