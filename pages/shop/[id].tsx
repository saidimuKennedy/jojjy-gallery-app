import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import BackLink from "@/components/ui/BackLink";
import TextAction from "@/components/ui/TextAction";
import Select from "@/components/ui/Select";
import {
  CustomerDetails,
  DeliveryMethodSelect,
  FulfilmentSelector,
  OrderSummary,
  PaymentAction,
  ProductImage,
  type CustomerDetailsValue,
  type DeliveryMethodValue,
  type FulfilmentChoice,
} from "@/components/shop/checkout";
import { formatUsdPrice } from "@/lib/utils";
import { ArtworkWithRelations } from "@/types/api";

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

  const [fulfilment, setFulfilment] = useState<FulfilmentChoice>("COLLECTION");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethodValue>("NAIROBI_DELIVERY");
  const [packaging, setPackaging] =
    useState<(typeof PACKAGING_OPTIONS)[number]["value"]>("ROLLED");
  const [customer, setCustomer] = useState<CustomerDetailsValue>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const needsAddress = fulfilment === "DELIVERY";
  const effectiveMethod: DeliveryMethodValue =
    fulfilment === "COLLECTION" ? "LOCAL_PICKUP" : deliveryMethod;

  useEffect(() => {
    const username = session?.user?.username;
    if (username) {
      setCustomer((c) => (c.name ? c : { ...c, name: username }));
    }
  }, [session?.user?.username]);
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
    if (needsAddress && !customer.address.trim()) {
      toast.error("Enter a delivery location");
      return;
    }

    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ artworkId: artwork.id, quantity: 1 }],
          deliveryMethod: effectiveMethod,
          packaging,
          deliveryAddress:
            needsAddress && customer.address.trim()
              ? customer.address.trim()
              : null,
          customerName: customer.name.trim() || null,
          phoneNumber: customer.phone.trim() || null,
          deliveryNotes: customer.notes.trim() || null,
          paymentProvider: "PAYSTACK",
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

  if (error || !artwork) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
          <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
            Artwork not found
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
        <title>{artwork.title} — Shop</title>
        <meta
          name="description"
          content={artwork.description || artwork.title}
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
            src={artwork.imageUrl}
            alt={artwork.title}
            name={artwork.title}
            kind="Original artwork"
          />

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-neutral-900 tracking-tight mb-4">
              {artwork.title}
            </h1>
            <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-500 mb-4">
              Original artwork
              {artwork.medium ? ` · ${artwork.medium}` : ""}
            </p>
            {artwork.description && (
              <p className="text-sm font-light text-neutral-600 leading-relaxed mb-8 whitespace-pre-line">
                {artwork.description}
              </p>
            )}

            <p className="mb-8">
              <TextAction href={`/artworks/${artwork.id}`}>
                View catalogue page
              </TextAction>
            </p>

            {!canPurchase ? (
              <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
                Not available for purchase
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="art-packaging" className="block font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
                    Packaging
                  </label>
                  <Select
                    id="art-packaging"
                    label="Packaging"
                    options={PACKAGING_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    value={packaging}
                    onChange={(v) =>
                      setPackaging(
                        v as (typeof PACKAGING_OPTIONS)[number]["value"]
                      )
                    }
                  />
                </div>

                <FulfilmentSelector
                  value={fulfilment}
                  onChange={setFulfilment}
                />

                {needsAddress && (
                  <div>
                    <label htmlFor="art-delivery-method" className="block font-display text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      Delivery method
                    </label>
                    <DeliveryMethodSelect
                      id="art-delivery-method"
                      value={deliveryMethod}
                      onChange={setDeliveryMethod}
                    />
                  </div>
                )}

                <CustomerDetails
                  value={customer}
                  onChange={setCustomer}
                  needAddress={needsAddress}
                  idPrefix="art"
                />

                <OrderSummary
                  lines={[
                    {
                      label: artwork.title,
                      detail: "Original · quantity 1",
                      amount: formatUsdPrice(artwork.price!),
                    },
                  ]}
                  total={formatUsdPrice(artwork.price!)}
                  currency="USD"
                />

                <PaymentAction
                  busy={checkoutBusy}
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
