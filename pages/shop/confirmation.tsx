import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Check, UserRound } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import TextAction from "@/components/ui/TextAction";
import OptimizedImage from "@/components/ui/OptimizedImage";
import EventTicket from "@/components/events/EventTicket";
import { CATALOG_CURRENCY } from "@/lib/currency";
import { resolveCallbackReference } from "@/lib/paystack-callback";

type OrderTicket = {
  id: string;
  code: string;
  status: string;
  holderName: string | null;
  checkedInAt: string | null;
  ticketType: {
    name: string;
    price: number;
    entryLabel: string | null;
    isPremium: boolean;
    event: {
      title: string;
      startsAt: string;
      endsAt: string | null;
      venue: string | null;
      imageUrl: string | null;
      timezone: string;
      category: string | null;
      tagline: string | null;
    };
  };
};

const DELIVERY_LABELS: Record<string, string> = {
  LOCAL_PICKUP: "Local pickup",
  NAIROBI_DELIVERY: "Nairobi delivery",
  KENYA_SHIPPING: "Kenya shipping",
  INTERNATIONAL_SHIPPING: "International shipping",
};

type OrderData = {
  id: string;
  status: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  paystackRef: string | null;
  chargeAmount: number | null;
  chargeCurrency: string | null;
  customerName: string | null;
  phoneNumber: string | null;
  deliveryNotes: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  packaging: string | null;
  items: Array<{
    itemType: string;
    quantity: number;
    unitPrice: number;
    artwork: { title: string; imageUrl?: string | null } | null;
    ticketType: { name: string; event: { title: string } } | null;
    productVariant: {
      product: { name: string; imageUrl?: string | null };
      sku: string;
      size?: string | null;
      color?: string | null;
    } | null;
    release: { title: string; slug: string; coverImage?: string | null } | null;
    membershipPlan: { name: string } | null;
  }>;
  tickets: OrderTicket[];
};

export default function ShopConfirmationPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { reference, mismatch } = resolveCallbackReference(router.query);
  const [retryCount, setRetryCount] = useState(0);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    if (mismatch) {
      setError(
        "We could not match this payment to an order. Your payment may still have completed."
      );
      setLoading(false);
      return;
    }
    if (!reference) {
      setError(
        "We could not find a payment reference. Your payment may still have completed."
      );
      setLoading(false);
      return;
    }
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(router.asPath)}`
      );
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body.message || "Could not confirm payment");
          setLoading(false);
          return;
        }
        setOrder(body.data as OrderData);
      } catch {
        if (!cancelled) setError("Could not confirm payment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, reference, mismatch, authStatus, retryCount]);

  const isRefunded =
    order?.paymentStatus === "REFUNDED" || order?.status === "REFUNDED";
  const isPartiallyRefunded = order?.paymentStatus === "PARTIALLY_REFUNDED";
  const isPaid =
    order?.status === "PAID" && !isRefunded && !isPartiallyRefunded;
  const musicRelease = order?.items.find((i) => i.release)?.release ?? null;
  const hasMusicItem = order?.items.some(
    (i) => i.itemType === "RELEASE" || i.itemType === "MEMBERSHIP_PASS"
  );

  return (
    <div className="min-h-screen bg-[#000] text-white">
      <Head>
        <title>Order confirmation — Jojjy Gallery</title>
      </Head>
      <Navbar variant="transparent" />
      <main className="container mx-auto max-w-5xl px-5 pb-16 pt-24 md:pb-24 md:pt-28">
        {loading ? (
          <p className="font-archive-body text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Confirming payment…
          </p>
        ) : error ? (
          <div>
            <h1 className="font-display text-3xl font-normal text-white mb-4">
              Payment not confirmed
            </h1>
            <p className="text-sm font-normal text-neutral-400 mb-8">{error}</p>
            <div className="flex flex-wrap gap-6">
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="border border-white px-8 py-4 font-archive-body text-sm font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-neutral-950"
              >
                Try again
              </button>
              <TextAction href="/account" tone="dark">
                View orders
              </TextAction>
            </div>
            <div className="mt-8">
              <BackLink href="/shop" tone="dark">
                Back to Shop
              </BackLink>
            </div>
          </div>
        ) : order ? (
          <div>
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                  isPaid
                    ? "border-[#8fbf8f] text-[#8fbf8f]"
                    : "border-neutral-500 text-neutral-300"
                }`}
              >
                <Check className="h-9 w-9" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-8 font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-300">
                {isRefunded
                  ? "Refunded"
                  : isPartiallyRefunded
                    ? "Partially refunded"
                    : isPaid
                      ? "Thank you"
                      : "Order status"}
              </p>
              <h1 className="mt-4 font-display text-5xl font-medium tracking-tight text-white md:text-6xl">
                {isRefunded
                  ? "Payment refunded"
                  : isPartiallyRefunded
                    ? "Payment partially refunded"
                    : isPaid
                      ? "Payment confirmed"
                      : "Payment pending"}
              </h1>
              <p className="mt-4 max-w-md font-archive-body text-base leading-relaxed text-neutral-200">
                {isPaid
                  ? "Your order has been received and your payment was successful."
                  : "We'll update this page as soon as the payment clears."}
              </p>
            </div>

            <dl className="mt-10 grid grid-cols-1 divide-y divide-neutral-800 border border-neutral-800 bg-[#0b0d0b] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-5 text-center">
                <dt className="font-archive-body text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                  Order number
                </dt>
                <dd className="mt-2 font-display text-2xl font-medium text-white">
                  {order.id.slice(0, 8)}
                </dd>
              </div>
              <div className="px-6 py-5 text-center">
                <dt className="font-archive-body text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                  Date
                </dt>
                <dd className="mt-2 font-display text-2xl font-medium text-white">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="px-6 py-5 text-center">
                <dt className="font-archive-body text-xs font-semibold uppercase tracking-[0.2em] text-neutral-300">
                  Total paid
                </dt>
                <dd className="mt-2 font-display text-2xl font-medium text-white">
                  {order.chargeAmount != null && order.chargeCurrency
                    ? order.chargeCurrency
                    : order.currency}{" "}
                  {(order.chargeAmount ?? order.amount).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}
                </dd>
                {order.chargeAmount != null && order.chargeCurrency && (
                  <p className="mt-1 font-archive-body text-xs text-neutral-300">
                    via Paystack
                  </p>
                )}
              </div>
            </dl>

            <section className="mt-12">
              <h2 className="font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-300">
                Order details
              </h2>
              <ul className="mt-5 divide-y divide-neutral-800">
                {order.items.map((item) => {
                  let label: string = item.itemType;
                  let sub: string | null = null;
                  let meta: string[] = [];
                  let image: string | null = null;
                  if (item.artwork) {
                    label = item.artwork.title;
                    image = item.artwork.imageUrl ?? null;
                  }
                  if (item.ticketType) {
                    label = `${item.ticketType.name} — ${item.ticketType.event.title}`;
                  }
                  if (item.productVariant) {
                    label = item.productVariant.product.name;
                    sub = item.productVariant.sku;
                    image = item.productVariant.product.imageUrl ?? null;
                    if (item.productVariant.size)
                      meta.push(`Size: ${item.productVariant.size}`);
                    if (item.productVariant.color)
                      meta.push(`Colour: ${item.productVariant.color}`);
                  }
                  if (item.release) {
                    label = item.release.title;
                    image = item.release.coverImage ?? null;
                  }
                  if (item.membershipPlan) {
                    label = item.membershipPlan.name;
                  }
                  meta.push(`Quantity: ${item.quantity}`);
                  return (
                    <li
                      key={`${item.itemType}-${label}-${sub ?? ""}`}
                      className="flex gap-6 py-6"
                    >
                      <div className="relative h-36 w-40 shrink-0 overflow-hidden bg-neutral-900 sm:h-40 sm:w-44">
                        {image && (
                          <OptimizedImage
                            src={image}
                            alt={label}
                            fill
                            preset="card"
                            sizes="176px"
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-display text-2xl font-medium text-white">
                            {label}
                          </p>
                          {sub && (
                            <p className="mt-1 break-all font-archive-body text-sm text-neutral-300">
                              {sub}
                            </p>
                          )}
                          <p className="mt-5 font-archive-body text-sm text-neutral-200">
                            {meta.join("  |  ")}
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-display text-xl font-medium text-white">
                          {order.currency}{" "}
                          {(item.unitPrice * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {order.deliveryMethod && (
              <section className="mt-6 border-t border-neutral-800 pt-8">
                <h2 className="font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-300">
                  {order.deliveryMethod === "LOCAL_PICKUP"
                    ? "Collection"
                    : "Delivery"}
                </h2>
                <div className="mt-5 border border-neutral-800 bg-[#0b0b0b] p-6">
                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-neutral-900">
                      <UserRound className="h-6 w-6 text-neutral-200" strokeWidth={1.25} aria-hidden />
                    </div>
                    <dl className="space-y-1.5 font-archive-body text-sm text-neutral-300">
                      {order.customerName && (
                        <dd className="text-base font-medium text-white">
                          {order.customerName}
                        </dd>
                      )}
                      {order.phoneNumber && (
                        <div>
                          <dt className="inline">Phone: </dt>
                          <dd className="inline text-neutral-100">{order.phoneNumber}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="inline">Method: </dt>
                        <dd className="inline font-medium text-white">
                          {DELIVERY_LABELS[order.deliveryMethod] ??
                            order.deliveryMethod}
                        </dd>
                      </div>
                      {order.deliveryAddress && (
                        <div>
                          <dt className="inline">Where: </dt>
                          <dd className="inline text-neutral-100">{order.deliveryAddress}</dd>
                        </div>
                      )}
                      {order.packaging && (
                        <div>
                          <dt className="inline">Packaging: </dt>
                          <dd className="inline capitalize text-neutral-100">
                            {order.packaging.toLowerCase().replace(/_/g, " ")}
                          </dd>
                        </div>
                      )}
                      {order.deliveryNotes && (
                        <div>
                          <dt className="inline">Notes: </dt>
                          <dd className="inline text-neutral-100">{order.deliveryNotes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <p className="mt-5 font-archive-body text-sm text-neutral-200">
                    {isPaid
                      ? order.deliveryMethod === "LOCAL_PICKUP"
                        ? "We will contact you to arrange collection."
                        : "We will contact you about delivery — nothing has shipped yet."
                      : "Complete payment to confirm this order."}
                  </p>
                  {order.fulfilledAt && (
                    <p className="mt-2 font-archive-body text-sm text-neutral-300">
                      Fulfilled on{" "}
                      {new Date(order.fulfilledAt).toLocaleDateString()}.
                    </p>
                  )}
                </div>
              </section>
            )}

            {order.tickets.length > 0 && (
              <section className="mt-8 border-t border-neutral-800 pt-8">
                <h2 className="font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-300">
                  Your tickets
                </h2>
                <ul className="mt-6 space-y-8">
                  {order.tickets.map((t) => (
                    <li key={t.id}>
                      <EventTicket
                        eventTitle={t.ticketType.event.title}
                        eventImageUrl={t.ticketType.event.imageUrl}
                        startsAt={t.ticketType.event.startsAt}
                        endsAt={t.ticketType.event.endsAt}
                        venue={t.ticketType.event.venue}
                        ticketType={t.ticketType.name}
                        price={t.ticketType.price}
                        currency={CATALOG_CURRENCY}
                        entryLabel={t.ticketType.entryLabel}
                        premium={t.ticketType.isPremium}
                        category={t.ticketType.event.category}
                        tagline={t.ticketType.event.tagline}
                        timezone={t.ticketType.event.timezone}
                        downloadable
                        attendeeName={t.holderName || order.customerName}
                        code={t.code}
                        orderRef={order.id.slice(0, 8)}
                        purchasedAt={order.createdAt}
                        status={t.status}
                        checkedInAt={t.checkedInAt}
                      />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-archive-body text-sm text-neutral-300">
                  A confirmation email has been sent if email is configured.
                </p>
              </section>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {isPaid && (
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex min-h-[3.25rem] items-center justify-center gap-2 border border-[#8fbf8f] bg-[#8fbf8f] px-5 font-display text-lg font-medium text-black transition-colors hover:bg-transparent hover:text-[#8fbf8f]"
                >
                  View order <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
              {musicRelease && isPaid && (
                <Link
                  href={`/music/${musicRelease.slug}`}
                  className="flex min-h-[3.25rem] items-center justify-center gap-2 border border-neutral-600 px-5 font-display text-lg font-medium text-white transition-colors hover:border-white"
                >
                  Listen now <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
              {hasMusicItem && isPaid && (
                <Link
                  href="/music/library"
                  className="flex min-h-[3.25rem] items-center justify-center gap-2 border border-neutral-600 px-5 font-display text-lg font-medium text-white transition-colors hover:border-white"
                >
                  Your library <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
              <Link
                href="/account"
                className="flex min-h-[3.25rem] items-center justify-center gap-2 border border-neutral-600 px-5 font-display text-lg font-medium text-white transition-colors hover:border-white"
              >
                View account <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={hasMusicItem ? "/music" : "/shop"}
                className="flex min-h-[3.25rem] items-center justify-center gap-2 border border-neutral-600 px-5 font-display text-lg font-medium text-white transition-colors hover:border-white"
              >
                {hasMusicItem ? "Back to Music" : "Continue browsing"}{" "}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
      </main>
      <Footer tone="dark" />
    </div>
  );
}
