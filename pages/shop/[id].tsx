import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ArtworkWithRelations } from "@/types/api";

const DELIVERY_OPTIONS = [
  { value: "LOCAL_PICKUP", label: "Local pickup" },
  { value: "NAIROBI_DELIVERY", label: "Nairobi delivery" },
  { value: "KENYA_SHIPPING", label: "Kenya shipping" },
  { value: "INTERNATIONAL_SHIPPING", label: "International shipping" },
] as const;

const PACKAGING_OPTIONS = [
  { value: "ROLLED", label: "Rolled" },
  { value: "FRAMED", label: "Framed" },
] as const;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load artwork");
  }
  return body.data as ArtworkWithRelations;
};

export default function ShopArtworkPage() {
  const router = useRouter();
  const { id } = router.query;
  const artworkId = typeof id === "string" ? id : undefined;
  const { data: session, status: authStatus } = useSession();

  const { data: artwork, error, isLoading } = useSWR(
    artworkId ? `/api/artworks/${artworkId}` : null,
    fetcher
  );

  const [deliveryMethod, setDeliveryMethod] =
    useState<(typeof DELIVERY_OPTIONS)[number]["value"]>("LOCAL_PICKUP");
  const [packaging, setPackaging] =
    useState<(typeof PACKAGING_OPTIONS)[number]["value"]>("ROLLED");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";
  const needsAddress = deliveryMethod !== "LOCAL_PICKUP";
  const canPurchase =
    !!artwork &&
    artwork.isAvailable &&
    artwork.status === "AVAILABLE" &&
    (artwork.price ?? 0) > 0;

  const handleCheckout = async () => {
    if (!artwork || !canPurchase) {
      toast.error("This work is not available for purchase");
      return;
    }
    if (authStatus === "loading") return;
    if (!session?.user) {
      toast.error("Sign in to checkout");
      router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (needsAddress && !deliveryAddress.trim()) {
      toast.error("Enter a delivery address");
      return;
    }

    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ artworkId: artwork.id, quantity: 1 }],
          deliveryMethod,
          packaging,
          deliveryAddress: needsAddress ? deliveryAddress.trim() : null,
          paymentProvider: "PAYSTACK",
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Checkout failed");
        return;
      }
      toast.success(body.message || "Order created — payment coming soon.");
    } catch {
      toast.error("Checkout failed");
    } finally {
      setCheckoutBusy(false);
    }
  };

  if (isLoading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
          Loading
        </p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
          <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
            Artwork not found
          </h1>
          <Link
            href="/shop"
            className="font-display text-xs uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 hover:underline"
          >
            Back to shop
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>{artwork.title} — Studio Shop</title>
        <meta
          name="description"
          content={artwork.description || artwork.title}
        />
      </Head>
      <Navbar />

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <Link
          href="/shop"
          className="mb-10 inline-block font-display text-xs uppercase tracking-[0.28em] text-neutral-400 hover:text-neutral-800"
        >
          ← Studio Shop
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
        >
          <div className="relative aspect-square bg-neutral-100 overflow-hidden">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-contain bg-white"
            />
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-neutral-900 tracking-tight mb-4">
              {artwork.title}
            </h1>
            <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-400 mb-4">
              Original artwork
              {artwork.medium ? ` · ${artwork.medium}` : ""}
            </p>
            {artwork.description && (
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-8 whitespace-pre-line">
                {artwork.description}
              </p>
            )}

            <p className="mb-8">
              <Link
                href={`/artworks/${artwork.id}`}
                className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
              >
                View catalogue page →
              </Link>
            </p>

            {!canPurchase ? (
              <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
                Not available for purchase
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block font-display text-xs uppercase tracking-[0.24em] text-neutral-400 mb-2">
                    Packaging
                  </label>
                  <select
                    value={packaging}
                    onChange={(e) =>
                      setPackaging(
                        e.target.value as (typeof PACKAGING_OPTIONS)[number]["value"]
                      )
                    }
                    className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900"
                  >
                    {PACKAGING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-display text-xs uppercase tracking-[0.24em] text-neutral-400 mb-2">
                    Delivery
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) =>
                      setDeliveryMethod(
                        e.target.value as (typeof DELIVERY_OPTIONS)[number]["value"]
                      )
                    }
                    className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900"
                  >
                    {DELIVERY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {needsAddress && (
                  <div>
                    <label className="block font-display text-xs uppercase tracking-[0.24em] text-neutral-400 mb-2">
                      Delivery address
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900"
                      placeholder="Street, city, country…"
                    />
                  </div>
                )}

                <p className="font-display text-xl font-light text-neutral-900">
                  {currency} {artwork.price!.toLocaleString()}
                </p>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutBusy}
                  className="w-full border border-neutral-900 bg-neutral-900 py-4 font-display text-xs uppercase tracking-[0.28em] text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {checkoutBusy ? "Placing order…" : "Place order"}
                </button>
                <p className="text-xs font-light text-neutral-400">
                  Creates a pending order. Online payment wiring comes next.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
