import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Artwork } from "@/types/api";

interface WishlistEntry {
  id: string;
  artworkId: number;
  createdAt: string;
  artwork: Artwork;
}

interface TransactionRow {
  id: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
  itemTypes: string[];
  fulfilledAt: string | null;
  items: { itemType: string; quantity: number; label: string }[];
}

interface WalletTicketPreview {
  id: string;
  code: string;
  ticketType: string;
  event: { title: string; slug: string };
}

interface LibraryPreview {
  collection: { id: number; slug: string; title: string }[];
  studioMembership: {
    active: boolean;
    expiresAt?: string;
    startedAt?: string;
    isFounding?: boolean;
  };
}

const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Request failed");
  }
  return body.data;
};

export default function AccountPage() {
  const { data: session, status: authStatus } = useSession();
  const [followBusy, setFollowBusy] = useState(false);

  const loggedIn = !!session?.user;

  const { data: wishlist, mutate: mutateWishlist } = useSWR<WishlistEntry[]>(
    loggedIn ? "/api/wishlist" : null,
    jsonFetcher
  );

  const { data: followData, mutate: mutateFollow } = useSWR<{
    following: boolean;
  }>(loggedIn ? "/api/subscribe/follow" : null, jsonFetcher);

  const { data: purchases } = useSWR<TransactionRow[]>(
    loggedIn ? "/api/account/purchases" : null,
    jsonFetcher
  );

  const { data: tickets } = useSWR<WalletTicketPreview[]>(
    loggedIn ? "/api/account/tickets" : null,
    jsonFetcher
  );

  const { data: library } = useSWR<LibraryPreview>(
    loggedIn ? "/api/music/library" : null,
    jsonFetcher
  );

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
          Loading
        </p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
          <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
            Account
          </h1>
          <p className="text-sm font-light text-neutral-500 mb-8">
            Sign in to view your wishlist, follow status, and purchases.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/account")}`}
            className="border border-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
          >
            Sign in
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const handleFollowToggle = async () => {
    setFollowBusy(true);
    try {
      const following = followData?.following;
      const res = await fetch("/api/subscribe/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: following ? undefined : JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not update follow");
        return;
      }
      toast.success(following ? "Unfollowed" : "You're following the artist");
      await mutateFollow();
    } catch {
      toast.error("Could not update follow");
    } finally {
      setFollowBusy(false);
    }
  };

  const handleRemoveWishlist = async (artworkId: number) => {
    try {
      const res = await fetch(`/api/wishlist/${artworkId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not remove");
        return;
      }
      await mutateWishlist();
    } catch {
      toast.error("Could not remove");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Account — Njenga Ngugi</title>
      </Head>
      <Navbar />

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        <h1 className="font-display text-4xl font-light text-neutral-900 tracking-tight mb-2">
          Account
        </h1>
        <p className="text-sm font-light text-neutral-500 mb-14">
          {session.user.username || session.user.email}
        </p>

        {/* Follow */}
        <section className="mb-16 border-b border-neutral-200 pb-12">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
            Follow the artist
          </p>
          <p className="text-sm font-light text-neutral-600 mb-6 max-w-md">
            Get updates on new work, exhibitions, and studio news.
          </p>
          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={followBusy}
            className="border border-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.24em] text-neutral-900 hover:bg-neutral-900 hover:text-white disabled:opacity-50"
          >
            {followBusy
              ? "…"
              : followData?.following
                ? "Unfollow"
                : "Follow"}
          </button>
        </section>

        {/* Wishlist */}
        <section className="mb-16 border-b border-neutral-200 pb-12">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6">
            Wishlist
          </p>
          {!wishlist || wishlist.length === 0 ? (
            <p className="text-sm font-light text-neutral-500">
              No saved artworks yet.{" "}
              <Link href="/portfolio" className="underline-offset-4 hover:underline">
                Browse the portfolio
              </Link>
            </p>
          ) : (
            <ul className="space-y-6">
              {wishlist.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 items-start"
                >
                  <Link
                    href={`/artworks/${item.artwork.id}`}
                    className="relative w-20 h-20 bg-neutral-100 shrink-0 overflow-hidden"
                  >
                    <OptimizedImage
                      src={item.artwork.imageUrl}
                      alt={item.artwork.title}
                      fill
                      preset="thumb"
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/artworks/${item.artwork.id}`}
                      className="font-display text-lg font-light text-neutral-900 hover:text-neutral-600"
                    >
                      {item.artwork.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveWishlist(item.artworkId)}
                      className="mt-2 block py-1 font-display text-[0.7rem] uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-800"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Purchases */}
        <section className="mb-16 border-b border-neutral-200 pb-12">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6">
            Purchase history
          </p>
          {!purchases || purchases.length === 0 ? (
            <p className="text-sm font-light text-neutral-500">
              No purchases yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {purchases.map((tx) => (
                <li
                  key={tx.id}
                  className="border-b border-neutral-100 pb-3"
                >
                  <Link
                    href={`/account/orders/${tx.id}`}
                    className="flex justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-light text-neutral-900 group-hover:underline underline-offset-4">
                        {tx.items.length > 0
                          ? tx.items
                              .map(
                                (i) =>
                                  `${i.label}${
                                    i.quantity > 1 ? ` × ${i.quantity}` : ""
                                  }`
                              )
                              .join("; ")
                          : tx.itemTypes.join(", ")}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(tx.timestamp).toLocaleDateString()} ·{" "}
                        {tx.status}
                        {tx.fulfilledAt ? " · fulfilled" : ""}
                      </p>
                    </div>
                    <p className="text-sm font-light text-neutral-700 whitespace-nowrap">
                      {tx.currency} {tx.amount.toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tickets */}
        <section className="mb-16 border-b border-neutral-200 pb-12">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6">
            Tickets
          </p>
          {!tickets || tickets.length === 0 ? (
            <p className="text-sm font-light text-neutral-500">
              No tickets yet.{" "}
              <Link href="/events" className="underline-offset-4 hover:underline">
                Browse events
              </Link>
            </p>
          ) : (
            <div>
              <ul className="space-y-3 mb-6">
                {tickets.slice(0, 3).map((t) => (
                  <li
                    key={t.id}
                    className="flex justify-between gap-4 text-sm font-light"
                  >
                    <Link
                      href={`/events/${t.event.slug}`}
                      className="text-neutral-900 hover:underline underline-offset-4 truncate"
                    >
                      {t.event.title}
                    </Link>
                    <span className="font-mono tracking-widest text-neutral-700 whitespace-nowrap">
                      {t.code}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/account/tickets"
                className="font-display text-xs uppercase tracking-[0.24em] text-neutral-900 underline-offset-4 hover:underline"
              >
                Open ticket wallet →
              </Link>
            </div>
          )}
        </section>

        {/* Music & membership */}
        {(!!library?.collection.length ||
          !!library?.studioMembership.active) && (
          <section className="mb-16 border-b border-neutral-200 pb-12">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6">
              Music &amp; membership
            </p>
            {library.studioMembership.active && (
              <p className="text-sm font-light text-neutral-700 mb-4">
                Studio member
                {library.studioMembership.expiresAt
                  ? ` · until ${new Date(
                      library.studioMembership.expiresAt
                    ).toLocaleDateString()}`
                  : ""}
                {library.studioMembership.isFounding ? " · founding" : ""}
              </p>
            )}
            {library.collection.length > 0 && (
              <ul className="space-y-2 mb-6">
                {library.collection.slice(0, 5).map((r) => (
                  <li key={r.id} className="text-sm font-light">
                    <Link
                      href={`/music/${r.slug}`}
                      className="text-neutral-900 hover:underline underline-offset-4"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/music/library"
              className="font-display text-xs uppercase tracking-[0.24em] text-neutral-900 underline-offset-4 hover:underline"
            >
              Open your library →
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
