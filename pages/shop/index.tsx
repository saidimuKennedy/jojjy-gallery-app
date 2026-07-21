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
import { ArtworkWithRelations } from "@/types/api";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load artworks");
  }
  return body.data as ArtworkWithRelations[];
};

export default function ShopIndexPage({
  initialArtworks,
}: {
  initialArtworks: ArtworkWithRelations[];
}) {
  const { data: artworks, error, isLoading } = useSWR(
    "/api/artworks?status=AVAILABLE&isAvailable=true&limit=all&include=minimal",
    fetcher,
    { fallbackData: initialArtworks }
  );
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "USD";

  const forSale =
    artworks?.filter(
      (a) => a.isAvailable && a.status === "AVAILABLE" && (a.price ?? 0) > 0
    ) ?? [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Head>
        <title>Studio Shop — Njenga Ngugi</title>
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
          Studio Shop
        </motion.h1>
        <p className="text-center text-sm font-light text-neutral-500 mb-14 max-w-lg mx-auto">
          Original works available to acquire — catalogue on the artwork page,
          purchase here.
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
        {!isLoading && forSale.length === 0 && (
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
                  {currency} {artwork.price!.toLocaleString()}
                </p>
              </Link>
            ))}
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
