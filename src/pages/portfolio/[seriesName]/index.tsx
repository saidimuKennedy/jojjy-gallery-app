import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router"; 
import { useArtworks, useSeriesList } from "@/hooks/useArtWorks";
import { Artwork } from "@/types/api";
import { motion } from "framer-motion";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/ui/Footer";


const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.15,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const PortfolioSeriesPage: React.FC = () => { 
  const router = useRouter();
  const { seriesName } = router.query; 

  const seriesSlug = typeof seriesName === 'string' ? seriesName : ''; 

  const { artworks: allArtworks, isLoading: artworksLoading } = useArtworks();
  const { seriesList: allSeries, isLoading: seriesLoading } = useSeriesList();

  const isLoading = artworksLoading || seriesLoading || !router.isReady; 

  const currentSeries = useMemo(() => {
    if (!allSeries || !seriesSlug) return undefined;
    return allSeries.find(
      (s) => s.slug?.toLowerCase() === seriesSlug.toLowerCase()
    );
  }, [allSeries, seriesSlug]);

  const artworksInSeries = useMemo(() => {
    if (!allArtworks || !currentSeries) return [];
    return allArtworks.filter(
      (artwork) => artwork.series?.id === currentSeries.id && artwork.inGallery === true
    );
  }, [allArtworks, currentSeries]);

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
          <p className="text-neutral-600 text-sm tracking-wide">LOADING</p>
        </motion.div>
      </div>
    );
  }

  if (!currentSeries) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center min-h-screen flex flex-col justify-center">
          <h1 className="text-4xl font-light text-gray-900 mb-6">Series Not Found</h1>
          <p className="text-gray-600 text-lg">
            The series "{seriesSlug.replace(/-/g, " ")}" could not be found.
          </p>
          <Link href="/portfolio" className="mt-8 text-blue-600 hover:underline">
            Back to Portfolio
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  if (artworksInSeries.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center min-h-screen flex flex-col justify-center">
          <h1 className="text-4xl font-light text-gray-900 mb-6">
            {currentSeries.name}
          </h1>
          <p className="text-gray-600 text-lg">
            No artworks found for this series.
          </p>
          <Link href="/portfolio" className="mt-8 text-blue-600 hover:underline">
            Back to Portfolio
          </Link>
        </div>
        <Footer />
      </>
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
        <title>{currentSeries.name} — Njenga Ngugi Portfolio</title>
        <meta
          name="description"
          content={`Artworks from the ${currentSeries.name} series by Njenga Ngugi`}
        />
      </Head>
      <Navbar />

      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
        <motion.h1
          variants={fadeInUp}
          className="text-4xl md:text-5xl font-light text-gray-900 text-center mb-6 md:mb-8 animate-fade-in-up"
        >
          {currentSeries.name}
        </motion.h1>
        {currentSeries.description && (
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-700 text-center max-w-3xl mx-auto mb-12 md:mb-16 leading-relaxed"
          >
            {currentSeries.description}
          </motion.p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {artworksInSeries.map((artwork) => (
            <motion.div
              key={artwork.id}
              variants={fadeInUp}
              className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <Link href={`/artworks/${artwork.id}`} className="block">
                <div className="relative w-full h-80 bg-gray-100 overflow-hidden">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 truncate mb-1">
                    {artwork.title}
                  </h2>
                  <p className="text-sm text-gray-600 truncate mb-2">
                    {artwork.artist}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    {artwork.dimensions} | {artwork.medium}
                  </p>
                  <p className="text-md font-bold text-gray-900">
                    {defaultCurrency} {artwork.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </motion.div>
  );
};

export default PortfolioSeriesPage;