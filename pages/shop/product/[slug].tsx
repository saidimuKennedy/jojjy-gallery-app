import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import Select from "@/components/ui/Select";
import {
  CustomerDetails,
  DeliveryMethodSelect,
  FulfilmentSelector,
  OrderSummary,
  PaymentAction,
  ProductImage,
  QuantitySelector,
  type CustomerDetailsValue,
  type DeliveryMethodValue,
  type FulfilmentChoice,
} from "@/components/shop/checkout";
import { formatUsdPrice } from "@/lib/utils";

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
  const [fulfilment, setFulfilment] = useState<FulfilmentChoice>("COLLECTION");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethodValue>("NAIROBI_DELIVERY");
  const [customer, setCustomer] = useState<CustomerDetailsValue>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const selectedVariant =
    availableVariants.find((v) => v.id === selectedVariantId) ??
    availableVariants[0];

  const needsAddress = fulfilment === "DELIVERY";
  const effectiveMethod: DeliveryMethodValue =
    fulfilment === "COLLECTION" ? "LOCAL_PICKUP" : deliveryMethod;

  // Prefill the fulfilment name from the signed-in account (editable).
  useEffect(() => {
    const username = session?.user?.username;
    if (username) {
      setCustomer((c) => (c.name ? c : { ...c, name: username }));
    }
  }, [session?.user?.username]);

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

    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productVariantId: selectedVariant.id, quantity }],
          deliveryMethod: effectiveMethod,
          deliveryAddress:
            needsAddress && customer.address.trim()
              ? customer.address.trim()
              : null,
          customerName: customer.name.trim() || null,
          phoneNumber: customer.phone.trim() || null,
          deliveryNotes: customer.notes.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setCheckoutError(body.message || "Checkout failed");
        return;
      }
      if (body.data?.authorizationUrl) {
        window.location.href = body.data.authorizationUrl as string;
        return;
      }
      toast.success(body.message || "Order created.");
    } catch {
      setCheckoutError("Checkout failed. Please try again.");
    } finally {
      setCheckoutBusy(false);
    }
  };

  if (isLoading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
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
          <BackLink href="/shop" className="mt-2">
            Back to Shop
          </BackLink>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>{product.name} — Shop</title>
        <meta
          name="description"
          content={product.description || product.name}
        />
      </Head>
      <Navbar />

      <main className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <BackLink href="/shop" className="mb-10">
          Back to Shop
        </BackLink>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            name={product.name}
            kind={product.category || "Merch"}
          />

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-neutral-900 tracking-tight mb-4">
              {product.name}
            </h1>
            {product.category && (
              <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-500 mb-4">
                {product.category}
              </p>
            )}
            {product.description && (
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-8 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {availableVariants.length === 0 ? (
              <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
                Out of stock
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="shop-variant" className="block font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
                    Variant
                  </label>
                  <Select
                    id="shop-variant"
                    label="Variant"
                    options={availableVariants.map((v) => ({
                      value: String(v.id),
                      label: `${variantLabel(v)} — ${formatUsdPrice(v.price)} (${v.stock} in stock)`,
                    }))}
                    value={selectedVariant ? String(selectedVariant.id) : ""}
                    onChange={(v) => {
                      setSelectedVariantId(Number(v));
                      setQuantity(1);
                    }}
                  />
                </div>

                <QuantitySelector
                  id="shop-quantity"
                  value={quantity}
                  max={selectedVariant?.stock ?? 1}
                  onChange={setQuantity}
                />

                <FulfilmentSelector
                  value={fulfilment}
                  onChange={setFulfilment}
                />

                {needsAddress && (
                  <div>
                    <label htmlFor="shop-delivery-method" className="block font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      Delivery method
                    </label>
                    <DeliveryMethodSelect
                      id="shop-delivery-method"
                      value={deliveryMethod}
                      onChange={setDeliveryMethod}
                    />
                  </div>
                )}

                <CustomerDetails
                  value={customer}
                  onChange={setCustomer}
                  needAddress={needsAddress}
                  idPrefix="shop"
                />

                {selectedVariant && (
                  <OrderSummary
                    lines={[
                      {
                        label: product.name,
                        detail: `${variantLabel(selectedVariant)} × ${quantity}`,
                        amount: formatUsdPrice(selectedVariant.price * quantity),
                      },
                    ]}
                    total={formatUsdPrice(selectedVariant.price * quantity)}
                    currency="USD"
                  />
                )}

                <PaymentAction
                  busy={checkoutBusy}
                  disabled={!selectedVariant}
                  onClick={handleCheckout}
                  label="Continue to payment"
                  error={checkoutError}
                />
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
