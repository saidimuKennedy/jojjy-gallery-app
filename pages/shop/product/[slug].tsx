import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { formatUsdPrice } from "@/lib/utils";

const DELIVERY_OPTIONS = [
  { value: "LOCAL_PICKUP", label: "Local pickup" },
  { value: "NAIROBI_DELIVERY", label: "Nairobi delivery" },
  { value: "KENYA_SHIPPING", label: "Kenya shipping" },
  { value: "INTERNATIONAL_SHIPPING", label: "International shipping" },
] as const;

type Variant = {
  id: number;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  isAvailable: boolean;
  variants: Variant[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load product");
  }
  return body.data as Product;
};

function variantLabel(variant: Variant): string {
  const parts = [variant.size, variant.color].filter(Boolean);
  return parts.length ? parts.join(" · ") : variant.sku;
}

export default function ShopProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const productSlug = typeof slug === "string" ? slug : undefined;
  const { data: session, status: authStatus } = useSession();

  const { data: product, error, isLoading } = useSWR(
    productSlug ? `/api/products/${productSlug}` : null,
    fetcher
  );

  const availableVariants = useMemo(
    () => product?.variants.filter((v) => v.stock > 0) ?? [],
    [product]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] =
    useState<(typeof DELIVERY_OPTIONS)[number]["value"]>("LOCAL_PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const selectedVariant =
    availableVariants.find((v) => v.id === selectedVariantId) ??
    availableVariants[0];

  const needsAddress = deliveryMethod !== "LOCAL_PICKUP";

  const handleCheckout = async () => {
    if (!selectedVariant) {
      toast.error("This item is out of stock");
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
          items: [{ productVariantId: selectedVariant.id, quantity }],
          deliveryMethod,
          deliveryAddress: needsAddress ? deliveryAddress.trim() : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Checkout failed");
        return;
      }
      if (body.data?.authorizationUrl) {
        window.location.href = body.data.authorizationUrl as string;
        return;
      }
      toast.success(body.message || "Order created.");
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

  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
          <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
            Product not found
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
        <title>{product.name} — Studio Shop</title>
        <meta
          name="description"
          content={product.description || product.name}
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
            {product.imageUrl ? (
              <OptimizedImage
                src={product.imageUrl}
                alt={product.name}
                fill
                preset="hero"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain bg-white"
              />
            ) : (
              <div className="flex items-center justify-center h-full font-display text-xs uppercase tracking-[0.28em] text-neutral-300">
                {product.name}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-neutral-900 tracking-tight mb-4">
              {product.name}
            </h1>
            {product.category && (
              <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-400 mb-4">
                {product.category}
              </p>
            )}
            {product.description && (
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-8 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {availableVariants.length === 0 ? (
              <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
                Out of stock
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block font-display text-xs uppercase tracking-[0.24em] text-neutral-400 mb-2">
                    Variant
                  </label>
                  <select
                    value={selectedVariant?.id ?? ""}
                    onChange={(e) =>
                      setSelectedVariantId(Number(e.target.value))
                    }
                    className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900"
                  >
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {variantLabel(v)} — {formatUsdPrice(v.price)} (
                        {v.stock} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-display text-xs uppercase tracking-[0.24em] text-neutral-400 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedVariant?.stock ?? 1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (Number.isNaN(val)) {
                        setQuantity(1);
                        return;
                      }
                      setQuantity(Math.min(Math.max(val, 1), selectedVariant?.stock ?? 1));
                    }}
                    className="w-24 border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900"
                  />
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
                  {selectedVariant
                    ? formatUsdPrice(selectedVariant.price * quantity)
                    : ""}
                  {selectedVariant && quantity > 1 && (
                    <span className="ml-2 text-xs font-light text-neutral-400">
                      ({formatUsdPrice(selectedVariant.price)} each)
                    </span>
                  )}
                </p>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutBusy || !selectedVariant}
                  className="w-full border border-neutral-900 bg-neutral-900 py-4 font-display text-xs uppercase tracking-[0.28em] text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {checkoutBusy
                    ? "Redirecting to payment…"
                    : "Proceed to payment"}
                </button>
                <p className="text-xs font-light text-neutral-400">
                  Secure checkout via Paystack. You&apos;ll return here after payment.
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
