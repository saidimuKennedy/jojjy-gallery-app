import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useArtwork } from "@/hooks/useArtWorks";
import Navbar from "@/components/ui/Navbar";
import OptimizedImage from "@/components/ui/OptimizedImage";

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

const ARTWORK_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  ON_EXHIBITION: "On Exhibition",
  SOLD: "Sold",
  IN_PRIVATE_COLLECTION: "In Private Collection",
};

function buildWhatsAppInquiryLink(title: string): string | null {
  const number = process.env.NEXT_PUBLIC_ARTIST_WHATSAPP_NUMBER;
  if (!number) return null;
  const text = encodeURIComponent(`I'm interested in "${title}"`);
  return `https://wa.me/${number}?text=${text}`;
}

export default function ArtworkDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [onWishlist, setOnWishlist] = useState(false);

  const artworkId = typeof id === "string" ? id : undefined;
  const { artwork, isLoading, error } = useArtwork(artworkId);

  useEffect(() => {
    if (!artworkId || !session?.user) {
      setOnWishlist(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        const body = await res.json();
        if (!res.ok || !body.success || cancelled) return;
        const items = body.data as { artworkId: number }[];
        setOnWishlist(
          items.some((i) => String(i.artworkId) === String(artworkId))
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artworkId, session?.user]);

  const handleWishlistToggle = async () => {
    if (!artworkId) return;
    if (authStatus === "loading") return;
    if (!session?.user) {
      toast.error("Sign in to save artworks");
      router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setWishlistBusy(true);
    try {
      const res = await fetch(`/api/wishlist/${artworkId}`, {
        method: onWishlist ? "DELETE" : "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not update wishlist");
        return;
      }
      setOnWishlist(!onWishlist);
      toast.success(onWishlist ? "Removed from wishlist" : "Saved to wishlist");
    } catch {
      toast.error("Could not update wishlist");
    } finally {
      setWishlistBusy(false);
    }
  };

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

  const whatsappLink = buildWhatsAppInquiryLink(artwork.title);

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
            artwork.description || `${artwork.title} by Njenga Ngugi.`
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
          <motion.div
            variants={contentVariants}
            className="lg:col-span-7 xl:col-span-8"
          >
            <div className="relative h-[70vh] w-full overflow-hidden bg-neutral-100 md:h-[75vh] lg:h-[80vh]">
              <OptimizedImage
                src={artwork.imageUrl}
                alt={artwork.title}
                fill
                preset="hero"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-contain object-center"
              />
            </div>
          </motion.div>

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
                    {ARTWORK_STATUS_LABELS[artwork.status] ?? "Original Artwork"}
                  </p>
                  {artwork.status === "AVAILABLE" && (
                    <>
                      <p className="text-neutral-500">Signed</p>
                      <p className="text-neutral-500">Certificate Included</p>
                    </>
                  )}
                </dd>
              </div>
            </motion.dl>

            <motion.div variants={itemVariants} className="mt-14 space-y-4">
              {(artwork.price ?? 0) > 0 &&
              artwork.isAvailable &&
              artwork.status === "AVAILABLE" ? (
                <Link
                  href={`/shop/${artwork.id}`}
                  className="flex w-full items-center justify-center border border-neutral-900 bg-neutral-900 py-5 text-center font-display text-xs font-normal uppercase tracking-[0.28em] text-white transition-colors duration-500 hover:bg-white hover:text-neutral-900"
                >
                  Acquire in Studio Shop →
                </Link>
              ) : (
                <Link
                  href="/shop"
                  className="flex w-full items-center justify-center border border-neutral-900 bg-white py-5 text-center font-display text-xs font-normal uppercase tracking-[0.28em] text-neutral-900 transition-colors duration-500 hover:bg-neutral-900 hover:text-white"
                >
                  Browse Studio Shop →
                </Link>
              )}

              <p className="font-archive-body text-sm font-light text-neutral-500">
                This page is the catalogue. Purchase happens in the Studio Shop.
              </p>

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-display text-[0.7rem] uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline"
                >
                  Ask about this artwork →
                </a>
              )}

              <button
                type="button"
                onClick={handleWishlistToggle}
                disabled={wishlistBusy}
                className="block font-display text-[0.7rem] uppercase tracking-[0.28em] text-neutral-400 underline-offset-4 transition-colors hover:text-neutral-800 hover:underline disabled:opacity-50"
              >
                {wishlistBusy
                  ? "…"
                  : onWishlist
                    ? "Saved · remove from wishlist"
                    : "Save to wishlist"}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

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
