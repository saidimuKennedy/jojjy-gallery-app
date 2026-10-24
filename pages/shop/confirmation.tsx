import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import TextAction from "@/components/ui/TextAction";
import { resolveCallbackReference } from "@/lib/paystack-callback";

type OrderTicket = {
  id: string;
  code: string;
  ticketType: { name: string };
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
    artwork: { title: string } | null;
    ticketType: { name: string; event: { title: string } } | null;
    productVariant: { product: { name: string }; sku: string } | null;
    release: { title: string; slug: string } | null;
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

  const isPaid = order?.status === "PAID";
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
      <main className="container mx-auto max-w-2xl px-4 pb-16 pt-24 md:pb-24 md:pt-28">
        {loading ? (
          <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-400">
            Confirming payment…
          </p>
        ) : error ? (
          <div>
            <h1 className="font-display text-3xl font-normal text-white mb-4">
              Payment not confirmed
            </h1>
            <p className="text-sm font-light text-neutral-400 mb-8">{error}</p>
            <div className="flex flex-wrap gap-6">
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="border border-white px-8 py-4 font-display text-xs uppercase tracking-[0.28em] text-white transition-colors hover:bg-white hover:text-neutral-950"
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
            <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500 mb-4">
              {isPaid ? "Thank you" : "Order status"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-normal text-white mb-6">
              {isPaid ? "Payment confirmed" : "Payment pending"}
            </h1>
            <p className="text-sm font-light text-neutral-400 mb-10">
              Order{" "}
              <span className="font-mono text-neutral-200">{order.id.slice(0, 8)}</span>
              {" · "}
              {order.currency}{" "}
              {order.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
              {" · "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>

            {order.chargeAmount != null && order.chargeCurrency && (
              <p className="text-sm font-light text-neutral-400 mb-10 -mt-6">
                Charged {order.chargeCurrency}{" "}
                {order.chargeAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                via Paystack
              </p>
            )}

            {order.deliveryMethod && (
              <div className="mb-10 -mt-2 border border-neutral-800 bg-neutral-950 px-5 py-5">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-400 mb-3">
                  {order.deliveryMethod === "LOCAL_PICKUP"
                    ? "Collection"
                    : "Delivery"}
                </p>
                <dl className="space-y-1.5 text-sm font-light text-neutral-200">
                  {order.customerName && (
                    <div className="flex gap-2">
                      <dt className="text-neutral-500">Name:</dt>
                      <dd>{order.customerName}</dd>
                    </div>
                  )}
                  {order.phoneNumber && (
                    <div className="flex gap-2">
                      <dt className="text-neutral-500">Phone:</dt>
                      <dd>{order.phoneNumber}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="text-neutral-500">Method:</dt>
                    <dd>
                      {DELIVERY_LABELS[order.deliveryMethod] ??
                        order.deliveryMethod}
                    </dd>
                  </div>
                  {order.deliveryAddress && (
                    <div className="flex gap-2">
                      <dt className="text-neutral-500">Where:</dt>
                      <dd>{order.deliveryAddress}</dd>
                    </div>
                  )}
                  {order.packaging && (
                    <div className="flex gap-2">
                      <dt className="text-neutral-500">Packaging:</dt>
                      <dd className="capitalize">
                        {order.packaging.toLowerCase().replace(/_/g, " ")}
                      </dd>
                    </div>
                  )}
                  {order.deliveryNotes && (
                    <div className="flex gap-2">
                      <dt className="text-neutral-500">Notes:</dt>
                      <dd>{order.deliveryNotes}</dd>
                    </div>
                  )}
                </dl>
                {isPaid ? (
                  <p className="mt-4 text-xs font-light leading-relaxed text-neutral-400">
                    {order.deliveryMethod === "LOCAL_PICKUP"
                      ? "Paid. We will contact you to arrange collection."
                      : "Paid. We will contact you about delivery — nothing has shipped yet."}
                  </p>
                ) : (
                  <p className="mt-4 text-xs font-light leading-relaxed text-neutral-400">
                    Complete payment to confirm this order.
                  </p>
                )}
                {order.fulfilledAt && (
                  <p className="mt-2 text-xs font-light leading-relaxed text-neutral-400">
                    Fulfilled on{" "}
                    {new Date(order.fulfilledAt).toLocaleDateString()}.
                  </p>
                )}
              </div>
            )}

            <ul className="space-y-4 border-t border-neutral-800 pt-8 mb-8">
              {order.items.map((item) => {
                let label = item.itemType;
                if (item.artwork) label = item.artwork.title;
                if (item.ticketType) {
                  label = `${item.ticketType.name} — ${item.ticketType.event.title}`;
                }
                if (item.productVariant) {
                  label = `${item.productVariant.product.name} (${item.productVariant.sku})`;
                }
                if (item.release) {
                  label = item.release.title;
                }
                if (item.membershipPlan) {
                  label = item.membershipPlan.name;
                }
                return (
                  <li
                    key={`${item.itemType}-${label}`}
                    className="flex justify-between text-sm font-light text-neutral-200"
                  >
                    <span>
                      {label} × {item.quantity}
                    </span>
                    <span>
                      {order.currency}{" "}
                      {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>

            {order.tickets.length > 0 && (
              <div className="mb-10 border-t border-neutral-800 pt-8">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4">
                  Your ticket codes
                </p>
                <ul className="space-y-2">
                  {order.tickets.map((t) => (
                    <li
                      key={t.id}
                      className="font-mono text-lg tracking-widest text-white"
                    >
                      {t.code}
                      <span className="ml-3 font-sans text-xs text-neutral-400">
                        {t.ticketType.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs font-light text-neutral-500">
                  A confirmation email has been sent if email is configured.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-6">
              {isPaid && (
                <TextAction href={`/account/orders/${order.id}`} tone="dark">
                  View order
                </TextAction>
              )}
              {musicRelease && isPaid && (
                <TextAction href={`/music/${musicRelease.slug}`} tone="dark">
                  Listen now
                </TextAction>
              )}
              {hasMusicItem && isPaid && (
                <TextAction href="/music/library" tone="dark">
                  Your library
                </TextAction>
              )}
              <TextAction href="/account" tone="dark">
                View account
              </TextAction>
              {hasMusicItem ? (
                <BackLink href="/music" tone="dark">
                  Back to Music
                </BackLink>
              ) : (
                <TextAction href="/shop" tone="dark">
                  Continue browsing
                </TextAction>
              )}
            </div>
          </div>
        ) : null}
      </main>
      <Footer tone="dark" />
    </div>
  );
}
