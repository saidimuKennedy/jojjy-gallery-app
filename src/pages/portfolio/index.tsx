import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ArrowDown } from "lucide-react";
import { useSeriesList, useArtworks } from "@/hooks/useArtWorks";
import { Artwork } from "@/types/api";
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export default function PortfolioPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Fetch data
  const { artworks: allArtworks, isLoading: artworksLoading } = useArtworks();
  const { seriesList: allSeries, isLoading: seriesLoading } = useSeriesList();
  const isLoading = artworksLoading || seriesLoading;

  // Mouse tracking for subtle parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Data processing
  const portfolioArtworks = useMemo(() => {
    return allArtworks?.filter((artwork) => artwork.inGallery === true) || [];
  }, [allArtworks]);

  const darkCloudsSeries = useMemo(() => {
    if (allSeries && Array.isArray(allSeries)) {
      return allSeries.find((s) => s.name === "Dark Clouds Bring Waters");
    }
    return undefined;
  }, [allSeries]);

  const darkCloudsArtworks = useMemo(() => {
    if (!darkCloudsSeries) return [];
    return portfolioArtworks.filter(
      (a) => a.series?.id === darkCloudsSeries.id
    );
  }, [portfolioArtworks, darkCloudsSeries]);

  const heroArtwork = useMemo(() => {
    return darkCloudsArtworks.length > 0
      ? darkCloudsArtworks[0]
      : portfolioArtworks.length > 0
      ? portfolioArtworks[0]
      : undefined;
  }, [darkCloudsArtworks, portfolioArtworks]);

  const otherArtworksBySeries = useMemo(() => {
    const grouped: Record<string, Artwork[]> = {};
    const artworksToGroup = portfolioArtworks.filter(
      (artwork) => artwork.series?.id !== darkCloudsSeries?.id
    );

    artworksToGroup.forEach((artwork) => {
      const seriesName = artwork.series?.name || "Uncategorized";
      if (!grouped[seriesName]) {
        grouped[seriesName] = [];
      }
      grouped[seriesName].push(artwork);
    });
    return grouped;
  }, [portfolioArtworks, darkCloudsSeries]);

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

  if (!heroArtwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-light text-neutral-900 mb-4">
            Portfolio Empty
          </h1>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            No artworks have been marked for portfolio display.
          </p>
          <Link
            href="/gallery"
            className="inline-block px-8 py-3 border border-neutral-900 text-neutral-900 text-sm tracking-wide hover:bg-neutral-900 hover:text-white transition-all duration-300"
          >
            VIEW GALLERY
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
        <title>Njenga Ngugi — Portfolio</title>
        <meta
          name="description"
          content="Curated portfolio of Njenga Ngugi, featuring Dark Clouds Bring Waters and selected works"
        />
      </Head>

      <Navbar />

      {/* Hero Section - Clean and Minimal */}
      <section className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroArtwork.imageUrl})`,
              transform: `translateY(${scrollY * 0.3}px)`,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl">
            {/* Artist Name */}
            <motion.div variants={fadeInUp} className="mb-8 md:mb-12">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-light text-white tracking-tight leading-none">
                Njenga
                <br />
                Ngugi
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div variants={fadeInUp} className="mb-12 md:mb-16">
              <p className="text-lg md:text-xl text-white/90 font-light tracking-wide max-w-2xl">
                Exploring the unconscious through ink, bleach, and charcoal on
                paper
              </p>
            </motion.div>

            {/* CTA */}
            {darkCloudsSeries && (
              <motion.div variants={fadeInUp}>
                <Link
                  href={`/portfolio/${darkCloudsSeries.slug}`}
                  className="group inline-flex items-center gap-4 text-white hover:text-white/80 transition-colors duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 border border-white/30 rounded-full group-hover:border-white/60 transition-all duration-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm tracking-widest uppercase">
                      View Series
                    </p>
                    <p className="text-base font-light">
                      {darkCloudsSeries.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="animate-bounce">
            <ArrowDown className="w-5 h-5 text-white/60" />
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-20 md:py-32 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 gap-16 md:gap-24"
          >
            {/* Artist Statement */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-sm tracking-widest uppercase text-neutral-500 mb-8">
                Artist Statement
              </h2>
              <div className="prose prose-lg text-neutral-700 font-light leading-relaxed">
                <p>
                  "Dark clouds bring waters" is a body of work that dives into
                  the unconscious — a space where hidden truths and unspoken
                  fears take shape. It is an invitation to confront the darkness
                  within, not to erase it but to understand it.
                </p>
                <p>
                  I work on paper, drawn to its fragility and resilience. Ink,
                  bleach, charcoal and pastels allow me to create contrast —
                  bold sweeping gestures alongside delicate marks, presence and
                  absence, destruction and repair.
                </p>
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div variants={fadeInUp}>
              <h2 className="text-sm tracking-widest uppercase text-neutral-500 mb-8">
                Biography
              </h2>
              <div className="prose prose-lg text-neutral-700 font-light leading-relaxed">
                <p>
                  Njenga Ngugi is a Kenyan artist born (1996) and based in
                  Nairobi. His work is a profound exploration of the human
                  psyche, examining the myriad actions, thoughts, dreams, and
                  emotions that shape our existence.
                </p>
                <p>
                  Since 2017, his work has been featured in numerous exhibitions
                  including the Kenya Art Fair, Nairobi National Museum, and
                  various galleries across Nairobi.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Grid */}
      {Object.entries(otherArtworksBySeries).length > 0 && (
        <section className="py-20 md:py-32 px-8 md:px-16 lg:px-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-light text-neutral-900 mb-16 md:mb-24"
            >
              Selected Works
            </motion.h2>

            <div className="space-y-24 md:space-y-32">
              {Object.entries(otherArtworksBySeries).map(
                ([seriesName, artworks], index) => {
                  const series = allSeries?.find((s) => s.name === seriesName);
                  if (!series) return null;

                  return (
                    <motion.div
                      key={series.id}
                      variants={staggerContainer}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
                    >
                      {/* Series Header */}
                      <motion.div
                        variants={fadeInUp}
                        className="mb-12 md:mb-16"
                      >
                        <Link
                          href={`/portfolio/${series.slug}`}
                          className="group block"
                        >
                          <h3 className="text-2xl md:text-3xl font-light text-neutral-900 mb-4 group-hover:text-neutral-600 transition-colors duration-300">
                            {series.name}
                          </h3>
                          <p className="text-neutral-600 max-w-3xl leading-relaxed">
                            {series.description}
                          </p>
                        </Link>
                      </motion.div>

                      {/* Artwork Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {artworks.slice(0, 6).map((artwork, artworkIndex) => (
                          <motion.div
                            key={artwork.id}
                            variants={fadeInUp}
                            className="group"
                          >
                            <Link href={`/artworks/${artwork.id}`}>
                              <div className="relative aspect-[4/5] overflow-hidden mb-4">
                                <img
                                  src={artwork.imageUrl}
                                  alt={artwork.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </div>
                              <h4 className="text-neutral-900 font-light group-hover:text-neutral-600 transition-colors duration-300">
                                {artwork.title}
                              </h4>
                            </Link>
                          </motion.div>
                        ))}
                      </div>

                      {/* View All Link */}
                      {artworks.length > 6 && (
                        <motion.div
                          variants={fadeInUp}
                          className="mt-12 md:mt-16"
                        >
                          <Link
                            href={`/portfolio/${series.slug}`}
                            className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-600 transition-colors duration-300"
                          >
                            <span className="text-sm tracking-wide">
                              VIEW ALL WORKS
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                }
              )}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}
