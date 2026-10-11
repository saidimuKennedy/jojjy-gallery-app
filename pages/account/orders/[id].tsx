import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import TextAction from "@/components/ui/TextAction";

interface OrderItemView {
  id: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  artwork: { id: number; title: string; imageUrl: string } | null;
  ticketType: {
    id: number;
    name: string;
    event: { title: string; slug: string; startsAt: string };
  } | null;
  productVariant: { sku: string; product: { name: string } } | null;
  release: { id: number; title: string; slug: string } | null;
  membershipPlan: { id: number; name: string } | null;
}

interface OrderView {
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
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  packaging: string | null;
  createdAt: string;
  items: OrderItemView[];
  tickets: { id: string; code: string; ticketType: { name: string } }[];
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Could not load order");
  }
  return body.data as OrderView;
};

function itemLabel(item: OrderItemView): string {
  if (item.artwork) return item.artwork.title;
  if (item.ticketType)
    return `${item.ticketType.name} — ${item.ticketType.event.title}`;
  if (item.productVariant)
    return `${item.productVariant.product.name} (${item.productVariant.sku})`;
  if (item.release) return item.release.title;
  if (item.membershipPlan) return item.membershipPlan.name;
  return item.itemType;
}

function itemHref(item: OrderItemView): string | null {
  if (item.artwork) return `/artworks/${item.artwork.id}`;
  if (item.ticketType) return `/events/${item.ticketType.event.slug}`;
  if (item.release) return `/music/${item.release.slug}`;
  return null;
}

export default function AccountOrderPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { id } = router.query;
  const orderId = typeof id === "string" ? id : undefined;

  const { data: order, error, isLoading } = useSWR(
    orderId ? `/api/orders/${orderId}` : null,
    fetcher
  );

  if (authStatus === "loading" || isLoading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
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
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Order — Account</title>
      </Head>
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-2xl">
        <BackLink href="/account" className="mb-10">
          Back to Account
        </BackLink>

        {error || !order ? (
          <div>
            <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
              Order not found
            </h1>
            <p className="text-sm font-light text-neutral-600">
              {error?.message ||
                "This order does not exist or belongs to another account."}
            </p>
          </div>
        ) : (
          <div>
            <p className="font-display text-xs uppercase tracking-[0.22em] text-neutral-500 mb-4">
              Order {order.id.slice(0, 8)} ·{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-light text-neutral-900 mb-6">
              {order.status === "PAID"
                ? "Payment confirmed"
                : order.status === "PENDING"
                  ? "Payment pending"
                  : `Order ${order.status.toLowerCase()}`}
            </h1>

            <ul className="space-y-4 border-t border-neutral-200 pt-8 mb-8">
              {order.items.map((item) => {
                const href = itemHref(item);
                return (
                  <li
                    key={item.id}
                    className="flex justify-between gap-4 text-sm font-light text-neutral-700"
                  >
                    <span>
                      {href ? (
                        <Link
                          href={href}
                          className="underline-offset-4 hover:underline text-neutral-900"
                        >
                          {itemLabel(item)}
                        </Link>
                      ) : (
                        itemLabel(item)
                      )}{" "}
                      × {item.quantity}
                    </span>
                    <span className="whitespace-nowrap">
                      {order.currency}{" "}
                      {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>

            <dl className="border-t border-neutral-200 pt-6 mb-8 space-y-2 text-sm font-light">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Total ({order.currency})</dt>
                <dd className="font-display text-xl font-light text-neutral-900">
                  {order.currency}{" "}
                  {order.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </dd>
              </div>
              {order.chargeAmount != null && order.chargeCurrency && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Charged via Paystack</dt>
                  <dd>
                    {order.chargeCurrency}{" "}
                    {order.chargeAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">Payment</dt>
                <dd>{order.status}</dd>
              </div>
              {order.fulfilledAt && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Fulfilled</dt>
                  <dd>
                    {new Date(order.fulfilledAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {order.deliveryMethod && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Fulfilment</dt>
                  <dd>
                    {order.deliveryMethod === "LOCAL_PICKUP"
                      ? "Collection"
                      : "Delivery"}
                    {order.deliveryAddress
                      ? ` · ${order.deliveryAddress}`
                      : ""}
                  </dd>
                </div>
              )}
            </dl>

            {order.tickets.length > 0 && (
              <div className="mb-10 border-t border-neutral-200 pt-8">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
                  Your tickets
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
                <p className="mt-4">
                  <TextAction href="/account/tickets">
                    Open ticket wallet
                  </TextAction>
                </p>
              </div>
            )}

            {order.items.some(
              (i) => i.itemType === "RELEASE" || i.itemType === "MEMBERSHIP_PASS"
            ) && (
              <p className="mb-10">
                <TextAction href="/music/library">
                  Open your music library
                </TextAction>
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
