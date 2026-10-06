import React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import type { GetStaticProps } from "next";
import useSWR from "swr";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { getArtworks } from "@/lib/data/artworks";
import { formatUsdPrice } from "@/lib/utils";
import { ArtworkWithRelations } from "@/types/api";

type ProductVariant = {
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
  variants: ProductVariant[];
};

const artworkFetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load artworks");
  }
  return body.data as ArtworkWithRelations[];
};

const productFetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load products");
  }
  return body.data as Product[];
};

function productPriceRange(product: Product): string {
  const prices = product.variants.map((v) => v.price).sort((a, b) => a - b);
  if (prices.length === 0) return "";
  const min = formatUsdPrice(prices[0]);
  const max = formatUsdPrice(prices[prices.length - 1]);
  return prices.length > 1 && prices[0] !== prices[prices.length - 1]
    ? `${min} – ${max}`
    : min;
}

export default function ShopIndexPage({
  initialArtworks,
}: {
  initialArtworks: ArtworkWithRelations[];
}) {
  const { data: artworks, error, isLoading } = useSWR(
    "/api/artworks?status=AVAILABLE&isAvailable=true&limit=all&include=minimal",
    artworkFetcher,
    { fallbackData: initialArtworks }
  );
  const { data: products } = useSWR("/api/products", productFetcher);
  const forSale =
    artworks?.filter(
      (a) => a.isAvailable && a.status === "AVAILABLE" && (a.price ?? 0) > 0
    ) ?? [];
  const availableProducts =
    products?.filter((p) => p.variants.length > 0) ?? [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Shop — Njenga Ngugi</title>
        <meta
          name="description"
          content="Acquire original works from Njenga Ngugi"
        />
      </Head>
      <Navbar />

      <main className="container mx-auto px-4 py-12 md:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-light text-neutral-900 text-center mb-4 tracking-tight"
        >
          Shop
        </motion.h1>
        <p className="text-center text-sm font-light text-neutral-500 mb-14 max-w-lg mx-auto">
          Original works, apparel, and objects currently offered for purchase.
        </p>

        {isLoading && (
          <p className="text-center font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
            Loading
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-neutral-600">
            Could not load artworks.
          </p>
        )}
        {!isLoading && forSale.length === 0 && availableProducts.length === 0 && (
          <p className="text-center text-sm font-light text-neutral-500">
            No works available for purchase right now.
          </p>
        )}

        {forSale.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {forSale.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/shop/${artwork.id}`}
                className="group block"
              >
                <div className="relative aspect-square bg-neutral-100 overflow-hidden mb-4">
                  <OptimizedImage
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    preset="card"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h2 className="font-display text-lg font-light text-neutral-900">
                  {artwork.title}
                </h2>
                {artwork.medium && (
                  <p className="text-xs font-light text-neutral-400 mt-1">
                    {artwork.medium}
                  </p>
                )}
                <p className="mt-2 text-sm font-light text-neutral-600">
                  {formatUsdPrice(artwork.price!)}
                </p>
              </Link>
            ))}
          </div>
        )}

        {availableProducts.length > 0 && (
          <div className="max-w-5xl mx-auto mt-20 md:mt-28">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-light text-neutral-900 tracking-tight">
                Merch
              </h2>
              <span className="text-xs font-light uppercase tracking-[0.24em] text-neutral-400">
                Apparel &amp; objects
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
              {availableProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/product/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-square bg-neutral-100 overflow-hidden mb-4">
                    {product.imageUrl ? (
                      <OptimizedImage
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        preset="card"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full font-display text-xs uppercase tracking-[0.28em] text-neutral-300">
                        {product.name}
                      </div>
                    )}
                  </div>
                  <h2 className="font-display text-lg font-light text-neutral-900">
                    {product.name}
                  </h2>
                  {product.category && (
                    <p className="text-xs font-light text-neutral-400 mt-1">
                      {product.category}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-light text-neutral-600">
                    {productPriceRange(product)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export const getStaticProps: GetStaticProps<{
  initialArtworks: ArtworkWithRelations[];
}> = async () => {
  const { artworks } = await getArtworks({
    status: "AVAILABLE",
    isAvailable: true,
    limit: "all",
    minimal: true,
  });

  const forSale = artworks.filter(
    (a) => a.isAvailable && a.status === "AVAILABLE" && (a.price ?? 0) > 0
  );

  return {
    props: {
      initialArtworks: JSON.parse(JSON.stringify(forSale)) as ArtworkWithRelations[],
    },
    revalidate: 120,
  };
};
