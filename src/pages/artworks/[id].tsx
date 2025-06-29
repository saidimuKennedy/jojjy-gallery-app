import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeftCircle, ShoppingCart } from "lucide-react";
import { useArtwork } from "@/hooks/useArtWorks";
import Navbar from "@/components/Layout/Navbar";
import AddToCartButton from "@/components/Art/AddToCartButton";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ArtworkDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const artworkId = typeof id === "string" ? id : undefined;

  const { artwork, isLoading, error } = useArtwork(artworkId);

  const defaultCurrency = process.env.NEXT_PUBLIC_CURRENCY || "$";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 text-sm tracking-wide">
            LOADING ARTWORK
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <h1 className="text-2xl font-light text-neutral-900 mb-4">
            Artwork Not Found
          </h1>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            The artwork you are looking for does not exist or an error occurred.
          </p>
          <Link
            href="/gallery"
            className="inline-block px-8 py-3 border border-neutral-900 text-neutral-900 text-sm tracking-wide hover:bg-neutral-900 hover:text-white transition-all duration-300"
          >
            BACK TO GALLERY
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-neutral-50"
    >
      <Head>
        <title>{artwork.title} — Njenga Ngugi</title>
        <meta
          name="description"
          content={`Details of ${artwork.title} by Njenga Ngugi.`}
        />
      </Head>

      <Navbar />

      <section className="container mx-auto px-8 py-16 md:py-24">
        <Link
          href="/gallery"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors duration-300 mb-8"
        >
          <ChevronLeftCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">Back to Gallery</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          <motion.div
            variants={contentVariants}
            className="aspect-[4/5] overflow-hidden rounded-lg shadow-lg"
          >
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            variants={contentVariants}
            className="flex flex-col justify-center"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl font-light text-neutral-900 mb-4 leading-tight"
            >
              {artwork.title}
            </motion.h1>

            {/* Artist Name - assuming 'artist' field is available, if not, adjust */}
            {/* If 'artist' is not directly on Artwork, you might need to fetch it or define it in types */}
            {artwork.artist && (
              <motion.p
                variants={itemVariants}
                className="text-lg text-neutral-600 mb-2"
              >
                By: <span className="font-medium">{artwork.artist}</span>
              </motion.p>
            )}

            {artwork.series && (
              <motion.p
                variants={itemVariants}
                className="text-lg text-neutral-600 mb-4"
              >
                Series:{" "}
                <Link
                  href={`/portfolio/${artwork.series.slug}`} // Assuming portfolio link for series
                  className="font-medium hover:text-neutral-900 transition-colors duration-300"
                >
                  {artwork.series.name}
                </Link>
              </motion.p>
            )}

            <motion.div
              variants={itemVariants}
              className="text-neutral-700 space-y-4 mb-8"
            >
              {artwork.year !== null && (
                <p className="text-base">Year: {artwork.year}</p>
              )}
              {artwork.medium !== null && (
                <p className="text-base">Medium: {artwork.medium}</p>
              )}
              {artwork.dimensions !== null && (
                <p className="text-base">Dimensions: {artwork.dimensions}</p>
              )}
              {/* Add other metadata here if needed (e.g., materials, edition) */}
            </motion.div>

            {artwork.description !== null && (
              <motion.div
                variants={itemVariants}
                className="prose prose-lg text-neutral-700 font-light leading-relaxed mb-8"
              >
                <p>{artwork.description}</p>
              </motion.div>
            )}

            {/* Price and Add to Cart Button */}
            <motion.div variants={itemVariants}>
              {artwork.isAvailable ? (
                <>
                  {artwork.price !== undefined && artwork.price !== null && (
                    <p className="text-3xl font-semibold text-neutral-900 mb-8">
                      {artwork.price === 0
                        ? "Price on Request"
                        : `${defaultCurrency} ${artwork.price.toLocaleString()}`}
                    </p>
                  )}
                  {/* Only show Add to Cart if there's a positive price */}
                  {artwork.price && artwork.price > 0 && (
                    <AddToCartButton artwork={artwork} variant="minimal" />
                  )}
                </>
              ) : (
                <p className="text-xl font-medium text-gray-700 mb-8">
                  Currently Unavailable
                </p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
