import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import {
  ArrowRight,
  Bell,
  BellOff,
  MoreHorizontal,
  Music2,
  Palette,
  Ticket,
  Users,
} from "lucide-react";
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
  collection: {
    id: number;
    slug: string;
    title: string;
    coverImage?: string | null;
    releaseType?: string;
  }[];
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

const TABS = ["Overview", "Music", "Events", "Membership"] as const;
type Tab = (typeof TABS)[number];

const ITEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RELEASE: Music2,
  TICKET: Ticket,
  MEMBERSHIP_PASS: Users,
  ARTWORK: Palette,
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function prettyType(t?: string): string {
  if (!t) return "Release";
  const s = t.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Small "…" menu for row actions. */
function RowMenu({
  items,
}: {
  items: { label: string; href?: string; onClick?: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center text-neutral-300 hover:text-white"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 border border-neutral-800 bg-black py-1 shadow-lg"
        >
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                className="block px-4 py-2 text-sm text-neutral-200 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-white/10"
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-medium tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-1 font-archive-body text-sm text-neutral-300">
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}

const sectionLink =
  "inline-flex items-center gap-2 font-archive-body text-sm font-medium text-white hover:underline underline-offset-4";
const panel = "border border-neutral-800 bg-[#0a0a0a]";
const outlineButton =
  "inline-flex min-h-[2.75rem] items-center gap-2 border border-white/80 px-5 py-2 font-archive-body text-sm font-medium text-white transition-colors hover:bg-white hover:text-black";


export default function AccountPage() {
  const { data: session, status: authStatus } = useSession();
  const [followBusy, setFollowBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("Overview");
  const [showAllPurchases, setShowAllPurchases] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-[#000]">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-400">
          Loading
        </p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <>
        <Navbar variant="transparent" />
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#000] p-8 text-center text-white">
          <h1 className="font-display text-3xl font-normal text-white mb-4">
            Account
          </h1>
          <p className="text-sm font-light text-neutral-400 mb-8">
            Sign in to view your wishlist, follow status, and purchases.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/account")}`}
            className="border border-white px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-white hover:bg-white hover:text-neutral-950"
          >
            Sign in
          </Link>
        </div>
        <Footer tone="dark" />
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

  const displayName = session.user.username || session.user.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const following = !!followData?.following;
  const show = (t: Tab) => tab === "Overview" || tab === t;
  const visiblePurchases = showAllPurchases
    ? purchases ?? []
    : (purchases ?? []).slice(0, 3);
  const membershipActive = !!library?.studioMembership?.active;

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <Head>
        <title>Account — Njenga Ngugi</title>
      </Head>
      <Navbar variant="transparent" />

      <main className="mx-auto max-w-3xl px-6 pb-20 pt-28 md:pt-32">
        {/* Profile */}
        <header className="flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
          <div
            aria-hidden="true"
            className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 font-display text-6xl font-medium text-white"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
              Account
            </p>
            <h1 className="mt-3 truncate font-display text-5xl font-medium tracking-tight text-white">
              {displayName}
            </h1>
            {session.user.email && session.user.email !== displayName && (
              <p className="mt-3 truncate font-display text-xl text-neutral-300">
                {session.user.email}
              </p>
            )}
          </div>
        </header>

        {/* Follow */}
        <section className="mt-12 flex flex-col gap-5 border-y border-neutral-800 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
              Follow the artist
            </p>
            <p className="mt-3 font-display text-xl text-neutral-200">
              Get updates on new work, exhibitions, and studio news.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={followBusy}
            className={`${outlineButton} shrink-0 disabled:opacity-50`}
          >
            {following ? (
              <BellOff className="h-4 w-4" aria-hidden />
            ) : (
              <Bell className="h-4 w-4" aria-hidden />
            )}
            {followBusy ? "…" : following ? "Unfollow" : "Follow"}
          </button>
        </section>

        {/* Tabs */}
        <div
          role="tablist"
          className="mt-2 flex gap-8 border-b border-neutral-800"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 py-4 font-display text-lg transition-colors ${
                tab === t
                  ? "border-white font-medium text-white"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="divide-y divide-neutral-800">
          {/* Wishlist */}
          {tab === "Overview" && (
            <section className="py-10">
              <SectionHeader
                title="Wishlist"
                subtitle="Works you've saved."
                action={
                  <Link href="/portfolio" className={sectionLink}>
                    Browse portfolio <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                }
              />
              <div className="mt-6 space-y-3">
                {!wishlist || wishlist.length === 0 ? (
                  <p className={`${panel} p-6 font-archive-body text-sm text-neutral-300`}>
                    No saved artworks yet.
                  </p>
                ) : (
                  wishlist.map((item) => (
                    <div key={item.id} className={`${panel} flex items-center gap-5 pr-3`}>
                      <Link
                        href={`/artworks/${item.artwork.id}`}
                        className="relative h-20 w-24 shrink-0 overflow-hidden bg-neutral-900"
                      >
                        <OptimizedImage
                          src={item.artwork.imageUrl}
                          alt={item.artwork.title}
                          fill
                          preset="thumb"
                          sizes="96px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/artworks/${item.artwork.id}`}
                          className="block truncate font-display text-xl font-medium text-white hover:underline underline-offset-4"
                        >
                          {item.artwork.title}
                        </Link>
                        <p className="mt-1 font-archive-body text-sm text-neutral-300">
                          Artwork
                          {item.artwork.year ? ` · ${item.artwork.year}` : ""}
                        </p>
                      </div>
                      <RowMenu
                        items={[
                          { label: "View artwork", href: `/artworks/${item.artwork.id}` },
                          {
                            label: "Remove",
                            onClick: () => handleRemoveWishlist(item.artworkId),
                          },
                        ]}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Purchase history */}
          {tab === "Overview" && (
            <section className="py-10">
              <SectionHeader
                title="Purchase history"
                subtitle="Your past purchases across music, art and events."
                action={
                  (purchases?.length ?? 0) > 3 ? (
                    <button
                      type="button"
                      onClick={() => setShowAllPurchases((v) => !v)}
                      className={sectionLink}
                    >
                      {showAllPurchases ? "Show less" : "View all"}{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  ) : undefined
                }
              />
              <div className="mt-6 space-y-3">
                {!purchases || purchases.length === 0 ? (
                  <p className={`${panel} p-6 font-archive-body text-sm text-neutral-300`}>
                    No purchases yet.
                  </p>
                ) : (
                  visiblePurchases.map((tx) => {
                    const Icon = ITEM_ICONS[tx.itemTypes[0]] ?? Palette;
                    const title =
                      tx.items.length > 0
                        ? tx.items
                            .map(
                              (i) =>
                                `${i.label}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`
                            )
                            .join("; ")
                        : tx.itemTypes.join(", ");
                    return (
                      <div key={tx.id} className={`${panel} flex items-center gap-5 pr-3`}>
                        <Link
                          href={`/account/orders/${tx.id}`}
                          className="flex h-20 w-24 shrink-0 items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900"
                          aria-hidden="true"
                          tabIndex={-1}
                        >
                          <Icon className="h-6 w-6 text-neutral-300" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/account/orders/${tx.id}`}
                            className="block truncate font-display text-xl font-medium text-white hover:underline underline-offset-4"
                          >
                            {title}
                          </Link>
                          <p className="mt-1 font-archive-body text-sm text-neutral-300">
                            {formatDay(tx.timestamp)}
                            {tx.fulfilledAt ? " · Fulfilled" : ""}
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-display text-lg text-white">
                          {tx.currency} {tx.amount.toLocaleString()}
                        </p>
                        <RowMenu
                          items={[
                            { label: "View order", href: `/account/orders/${tx.id}` },
                          ]}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* Tickets */}
          {show("Events") && (
            <section className="py-10">
              <SectionHeader
                title="Tickets"
                subtitle="Your upcoming and past event tickets."
                action={
                  <Link href="/events" className={sectionLink}>
                    Browse events <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                }
              />
              <div className="mt-6">
                {!tickets || tickets.length === 0 ? (
                  <div className={`${panel} flex flex-col items-center px-6 py-10 text-center`}>
                    <Ticket className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
                    <p className="mt-4 font-display text-xl font-medium text-white">
                      No tickets yet
                    </p>
                    <p className="mt-1 font-archive-body text-sm text-neutral-300">
                      When you book an event, your tickets will appear here.
                    </p>
                    <Link href="/events" className={`${outlineButton} mt-6`}>
                      Browse events
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.slice(0, 3).map((t) => (
                      <Link
                        key={t.id}
                        href={`/events/${t.event.slug}`}
                        className={`${panel} flex items-center justify-between gap-4 p-5 hover:border-neutral-600`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-display text-xl font-medium text-white">
                            {t.event.title}
                          </p>
                          <p className="mt-1 font-archive-body text-sm text-neutral-300">
                            {t.ticketType}
                          </p>
                        </div>
                        <span className="whitespace-nowrap font-mono text-sm tracking-widest text-neutral-300">
                          {t.code}
                        </span>
                      </Link>
                    ))}
                    <Link href="/account/tickets" className={`${sectionLink} pt-2`}>
                      Open ticket wallet <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Music & membership */}
          {(show("Music") || show("Membership")) && (
            <section className="py-10">
              <SectionHeader
                title="Music & Membership"
                subtitle="Your music access and memberships."
              />
              <div className="mt-6 space-y-3">
                {show("Membership") && membershipActive && (
                  <div className={`${panel} flex items-center gap-5 p-5`}>
                    <Users className="h-6 w-6 shrink-0 text-neutral-300" strokeWidth={1.25} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl font-medium text-white">
                        Studio Pass
                        {library?.studioMembership.isFounding ? " · Founding" : ""}
                      </p>
                      <p className="mt-1 font-archive-body text-sm text-neutral-300">
                        Active
                        {library?.studioMembership.expiresAt
                          ? ` · until ${formatDay(library.studioMembership.expiresAt)}`
                          : ""}
                      </p>
                    </div>
                    <Link href="/music/studio" className={outlineButton}>
                      Open Studio <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                )}
                {show("Membership") && !membershipActive && tab === "Membership" && (
                  <div className={`${panel} p-6`}>
                    <p className="font-archive-body text-sm text-neutral-300">
                      No active Studio Pass.
                    </p>
                    <Link href="/music/studio" className={`${outlineButton} mt-4`}>
                      Join the Studio
                    </Link>
                  </div>
                )}
                {show("Music") &&
                  (library?.collection ?? []).slice(0, 5).map((r) => (
                    <div key={r.id} className={`${panel} flex items-center gap-5 pr-5`}>
                      <Link
                        href={`/music/${r.slug}`}
                        className="relative h-20 w-24 shrink-0 overflow-hidden bg-neutral-900"
                      >
                        {r.coverImage && (
                          <OptimizedImage
                            src={r.coverImage}
                            alt={r.title}
                            fill
                            preset="thumb"
                            sizes="96px"
                            className="object-cover"
                          />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/music/${r.slug}`}
                          className="block truncate font-display text-xl font-medium text-white hover:underline underline-offset-4"
                        >
                          {r.title}
                        </Link>
                        <p className="mt-1 font-archive-body text-sm text-neutral-300">
                          Owned · {prettyType(r.releaseType)}
                        </p>
                      </div>
                      <Link href="/music/library" className={outlineButton}>
                        Open in Library <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  ))}
                {show("Music") &&
                  !(library?.collection.length) &&
                  (tab === "Music" || !membershipActive) && (
                    <p className={`${panel} p-6 font-archive-body text-sm text-neutral-300`}>
                      Nothing in your library yet.{" "}
                      <Link href="/music" className="underline underline-offset-4 hover:text-white">
                        Browse music
                      </Link>
                    </p>
                  )}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer tone="dark" />
    </div>
  );
}
