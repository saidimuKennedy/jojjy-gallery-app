import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

type OrderTicket = {
  id: string;
  code: string;
  ticketType: { name: string };
};

type OrderData = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paystackRef: string | null;
  deliveryMethod: string | null;
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
  const reference =
    typeof router.query.reference === "string"
      ? router.query.reference
      : undefined;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !reference) return;
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
  }, [router.isReady, reference, authStatus, router]);

  const isPaid = order?.status === "PAID";
  const musicRelease = order?.items.find((i) => i.release)?.release ?? null;
  const hasMusicItem = order?.items.some(
    (i) => i.itemType === "RELEASE" || i.itemType === "MEMBERSHIP_PASS"
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Order confirmation — Jojjy Gallery</title>
      </Head>
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-16 md:py-24">
        {loading || !reference ? (
          <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
            Confirming payment…
          </p>
        ) : error ? (
          <div>
            <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
              Payment not confirmed
            </h1>
            <p className="text-sm font-light text-neutral-600 mb-8">{error}</p>
            <Link
              href="/shop"
              className="font-display text-xs uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 hover:underline"
            >
              Back to shop
            </Link>
          </div>
        ) : order ? (
          <div>
            <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400 mb-4">
              {isPaid ? "Thank you" : "Order status"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-light text-neutral-900 mb-6">
              {isPaid ? "Payment confirmed" : "Payment pending"}
            </h1>
            <p className="text-sm font-light text-neutral-600 mb-10">
              Order{" "}
              <span className="font-mono text-neutral-800">{order.id.slice(0, 8)}</span>
              {" · "}
              {order.currency}{" "}
              {order.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>

            <ul className="space-y-4 border-t border-neutral-200 pt-8 mb-8">
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
                    className="flex justify-between text-sm font-light text-neutral-700"
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
              <div className="mb-10 border-t border-neutral-200 pt-8">
                <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 mb-4">
                  Your ticket codes
                </p>
                <ul className="space-y-2">
                  {order.tickets.map((t) => (
                    <li
                      key={t.id}
                      className="font-mono text-lg tracking-widest text-neutral-900"
                    >
                      {t.code}
                      <span className="ml-3 font-sans text-xs text-neutral-500">
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
              {musicRelease && isPaid && (
                <Link
                  href={`/music/${musicRelease.slug}`}
                  className="font-display text-xs uppercase tracking-[0.28em] text-neutral-900 underline-offset-4 hover:underline"
                >
                  Listen now
                </Link>
              )}
              {hasMusicItem && isPaid && (
                <Link
                  href="/music/library"
                  className="font-display text-xs uppercase tracking-[0.28em] text-neutral-900 underline-offset-4 hover:underline"
                >
                  Your library
                </Link>
              )}
              <Link
                href="/account"
                className="font-display text-xs uppercase tracking-[0.28em] text-neutral-900 underline-offset-4 hover:underline"
              >
                View account
              </Link>
              <Link
                href={hasMusicItem ? "/music" : "/shop"}
                className="font-display text-xs uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 hover:underline"
              >
                {hasMusicItem ? "Back to music" : "Continue browsing"}
              </Link>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
