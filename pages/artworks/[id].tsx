import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useArtwork } from "@/hooks/useArtWorks";
import Navbar from "@/components/ui/Navbar";
import AddToCartButton from "@/components/Art/AddToCartButton";

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function formatCurrency(amount: number, symbol: string): string {
  const code =
    symbol === "$" || symbol === "USD"
      ? "USD"
      : symbol === "KSh" || symbol === "KES"
        ? "KES"
        : symbol.replace(/\s/g, "").toUpperCase() || "USD";
  return `${code} ${amount.toLocaleString()}`;
}

export default function ArtworkDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const artworkId = typeof id === "string" ? id : undefined;
  const { artwork, isLoading, error } = useArtwork(artworkId);
  const defaultCurrency = process.env.NEXT_PUBLIC_CURRENCY || "USD";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="font-display text-sm tracking-[0.28em] uppercase text-neutral-400">
          Loading
        </p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <h1 className="font-display text-3xl font-light text-neutral-900 mb-4">
          Artwork Not Found
        </h1>
        <p className="text-neutral-500 mb-10 font-light">
          This work could not be found.
        </p>
        <Link
          href="/portfolio"
          className="font-display text-[0.7rem] uppercase tracking-[0.28em] text-neutral-900 underline-offset-4 hover:underline"
        >
          Back to portfolio
        </Link>
      </div>
    );
  }

  const metaLines = [
    artwork.year != null ? String(artwork.year) : null,
    artwork.medium,
    artwork.dimensions
      ? artwork.dimensions.replace(/x/gi, " × ").replace(/\s+/g, " ").trim()
      : null,
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-white"
    >
      <Head>
        <title>{artwork.title} — Njenga Ngugi</title>
        <meta
          name="description"
          content={
            artwork.description ||
            `${artwork.title} by Njenga Ngugi.`
          }
        />
      </Head>

      <Navbar />

      <section className="px-5 pt-8 pb-20 md:px-10 md:pt-10 lg:px-16 lg:pb-28">
        <Link
          href="/portfolio"
          className="mb-10 inline-block font-display text-xs uppercase tracking-[0.28em] text-neutral-400 transition-colors duration-500 hover:text-neutral-800 md:mb-14"
        >
          ← Explore more artworks
        </Link>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
          {/* Artwork — dominant */}
          <motion.div
            variants={contentVariants}
            className="lg:col-span-7 xl:col-span-8"
          >
            <div className="relative w-full overflow-hidden bg-neutral-100">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="h-[70vh] w-full object-contain object-center md:h-[75vh] lg:h-[80vh]"
              />
            </div>
          </motion.div>

          {/* Catalogue info */}
          <motion.div
            variants={contentVariants}
            className="flex flex-col lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:pt-2"
          >
            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl font-light leading-[1.05] tracking-tight text-neutral-900 md:text-5xl"
            >
              {artwork.title}
            </motion.h1>

            {metaLines.length > 0 && (
              <motion.p
                variants={itemVariants}
                className="mt-4 font-display text-sm font-light tracking-wide text-neutral-500 md:text-base"
              >
                {metaLines.join(" · ")}
              </motion.p>
            )}

            <motion.dl
              variants={itemVariants}
              className="mt-12 space-y-7 border-t border-neutral-100 pt-10"
            >
              {artwork.artist && (
                <div>
                  <dt className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                    Artist
                  </dt>
                  <dd className="mt-2 text-sm font-light text-neutral-800">
                    {artwork.artist}
                  </dd>
                </div>
              )}

              {artwork.series && (
                <div>
                  <dt className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                    Series
                  </dt>
                  <dd className="mt-2 text-sm font-light text-neutral-800">
                    <Link
                      href={`/portfolio/${artwork.series.slug}`}
                      className="underline-offset-4 transition-colors hover:text-neutral-500 hover:underline"
                    >
                      {artwork.series.name}
                    </Link>
                  </dd>
                </div>
              )}

              {artwork.medium && (
                <div>
                  <dt className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                    Medium
                  </dt>
                  <dd className="mt-2 text-sm font-light text-neutral-800">
                    {artwork.medium}
                  </dd>
                </div>
              )}

              {artwork.dimensions && (
                <div>
                  <dt className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                    Dimensions
                  </dt>
                  <dd className="mt-2 text-sm font-light text-neutral-800">
                    {artwork.dimensions
                      .replace(/x/gi, " × ")
                      .replace(/\s+/g, " ")
                      .trim()}
                  </dd>
                </div>
              )}

              <div>
                <dt className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                  Availability
                </dt>
                <dd className="mt-2 space-y-1.5 text-sm font-light text-neutral-800">
                  <p>
                    {artwork.isAvailable
                      ? "Original Artwork"
                      : "No longer available"}
                  </p>
                  {artwork.isAvailable && (
                    <>
                      <p className="text-neutral-500">Signed</p>
                      <p className="text-neutral-500">Certificate Included</p>
                    </>
                  )}
                </dd>
              </div>
            </motion.dl>

            <motion.div variants={itemVariants} className="mt-14">
              {artwork.isAvailable ? (
                <>
                  {artwork.price != null && (
                    <div className="mb-8">
                      <p className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                        {artwork.price === 0 ? "Inquiry" : "Available"}
                      </p>
                      <p className="mt-2 font-display text-xl font-light tracking-wide text-neutral-900 md:text-2xl">
                        {artwork.price === 0
                          ? "Price on Request"
                          : formatCurrency(artwork.price, defaultCurrency)}
                      </p>
                    </div>
                  )}
                  {artwork.price != null && artwork.price > 0 && (
                    <AddToCartButton artwork={artwork} variant="acquire" />
                  )}
                </>
              ) : (
                <p className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                  Currently unavailable
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Artist voice — emotional layer below the fold */}
      {artwork.description && (
        <section className="border-t border-neutral-100 px-5 py-20 md:px-10 md:py-28 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl"
          >
            <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
              From the artist
            </p>
            <blockquote className="mt-8 font-display text-2xl font-light leading-[1.55] tracking-tight text-neutral-800 md:text-3xl">
              {artwork.description}
            </blockquote>
            <p className="mt-10 text-sm font-light text-neutral-400">
              — {artwork.artist || "Njenga Ngugi"}
              {artwork.year ? `, ${artwork.year}` : ""}
            </p>
          </motion.div>
        </section>
      )}
    </motion.div>
  );
}
