import React, { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ChevronRight, ArrowDown, ChevronDown } from "lucide-react";
import { useSeriesList, useArtworks } from "@/hooks/useArtWorks";
import { Artwork, Series } from "@/types/api";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

// Explicitly type all variants
const pageVariants: Variants = {
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

const fadeInUp: Variants = {
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

const dropDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -100,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1,
    },
  },
};

const artworkVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

interface SeriesWithArtworks {
  series: Series;
  artworks: Artwork[];
}

export default function PortfolioPage() {
  const { artworks: allArtworks, isLoading: artworksLoading } = useArtworks({
    limit: "all",
  });
  const { seriesList: allSeries, isLoading: seriesLoading } = useSeriesList();
  const isLoading = artworksLoading || seriesLoading;

  const portfolioArtworks = useMemo(() => {
    return allArtworks?.filter((artwork) => artwork.inGallery === true) || [];
  }, [allArtworks]);

  const sortedSeries = useMemo(() => {
    if (!allSeries) return [];
    const darkClouds = allSeries.find(
      (s) => s.name === "Dark Clouds Bring Waters"
    );
    const otherSeries = allSeries.filter(
      (s) => s.name !== "Dark Clouds Bring Waters"
    );
    return darkClouds
      ? [
          darkClouds,
          ...otherSeries.sort((a, b) => a.name.localeCompare(b.name)),
        ]
      : [...otherSeries].sort((a, b) => a.name.localeCompare(b.name));
  }, [allSeries]);

  const seriesWithArtworks = useMemo(() => {
    const seriesMap = new Map<string, Artwork[]>();
    portfolioArtworks.forEach((artwork) => {
      if (artwork.series) {
        const seriesSlug = artwork.series.slug || `series-${artwork.series.id}`;
        if (!seriesMap.has(seriesSlug)) {
          seriesMap.set(seriesSlug, []);
        }
        seriesMap.get(seriesSlug)?.push(artwork);
      }
    });

    return sortedSeries
      .map((series) => ({
        series,
        artworks: seriesMap.get(series.slug || `series-${series.id}`) || [],
      }))
      .filter((item) => item.artworks.length > 0);
  }, [sortedSeries, portfolioArtworks]);

  const heroArtwork =
    seriesWithArtworks.length > 0
      ? seriesWithArtworks[0]?.artworks[0]
      : undefined;

  const getNextSeriesId = (currentSeriesIndex: number) => {
    if (currentSeriesIndex < seriesWithArtworks.length - 1) {
      const nextSeries = seriesWithArtworks[currentSeriesIndex + 1].series;
      return nextSeries.slug || `series-${nextSeries.id}`;
    }
    return null;
  };

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

  if (!heroArtwork || seriesWithArtworks.length === 0) {
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
            No artworks have been marked for portfolio display or no series
            found.
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
    <div className="relative">
      <Head>
        <title>Njenga Ngugi — Portfolio</title>
        <meta
          name="description"
          content="Curated portfolio of Njenga Ngugi, featuring his latest series and selected works"
        />
      </Head>

      <Navbar />

      <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
        <motion.section
          id="hero-section"
          initial="hidden"
          animate="visible"
          variants={pageVariants}
          className="relative h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24 overflow-hidden snap-start"
        >
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroArtwork.imageUrl})`,
            }}
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 max-w-4xl">
            <motion.div variants={fadeInUp} className="mb-8 md:mb-12">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-light text-white tracking-tight leading-none">
                Njenga
                <br />
                Ngugi
              </h1>
            </motion.div>

            <motion.div variants={fadeInUp} className="mb-12 md:mb-16">
              <p className="text-lg md:text-xl text-white/90 font-light tracking-wide max-w-2xl">
                "... a space where hidden truths and unspoken fears take shape"
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Link
                href="#about-section"
                scroll={true}
                className="group inline-flex items-center gap-4 text-white hover:text-white/80 transition-colors duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 border border-white/30 rounded-full group-hover:border-white/60 transition-all duration-300">
                  <ChevronDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm tracking-widest uppercase">
                    Explore Work
                  </p>
                  <p className="text-base font-light">Journey Through Series</p>
                </div>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="animate-bounce">
              <ArrowDown className="w-5 h-5 text-white/60" />
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          id="about-section"
          variants={dropDownVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="py-20 md:py-32 px-8 md:px-16 lg:px-24 bg-neutral-50 min-h-screen snap-start relative z-10"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24">
              <motion.div variants={fadeInUp}>
                <h2 className="text-sm tracking-widest uppercase text-neutral-500 mb-8">
                  Artist Statement
                </h2>
                <div className="prose prose-lg text-neutral-700 font-light leading-relaxed">
                  <p>
                    "Dark clouds bring waters" is a body of work that dives into
                    the unconscious — a space where hidden truths and unspoken
                    fears take shape. It is an invitation to confront the
                    darkness within, not to erase it but to understand it.
                  </p>
                  <p>
                    I work on paper, drawn to its fragility and resilience. Ink,
                    bleach, charcoal and pastels allow me to create contrast —
                    bold sweeping gestures alongside delicate marks, presence
                    and absence, destruction and repair.
                  </p>
                </div>
              </motion.div>

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
                    Since 2017, his work has been featured in numerous
                    exhibitions including the Kenya Art Fair, Nairobi National
                    Museum, and various galleries across Nairobi.
                  </p>
                </div>
              </motion.div>
            </div>

            {seriesWithArtworks.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="mt-16 flex justify-center"
              >
                <Link
                  href={`#${
                    seriesWithArtworks[0].series.slug ||
                    `series-${seriesWithArtworks[0].series.id}`
                  }`}
                  scroll={true}
                  className="group inline-flex items-center gap-4 text-neutral-700 hover:text-neutral-900 transition-colors duration-300"
                >
                  <div className="flex items-center justify-center w-10 h-10 border border-neutral-300 rounded-full group-hover:border-neutral-500 transition-all duration-300">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm tracking-widest uppercase">
                      Continue
                    </p>
                    <p className="text-base font-light">
                      View First Series: {seriesWithArtworks[0].series.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </motion.section>

        {seriesWithArtworks.map((seriesData, index) => {
          const nextSeriesId = getNextSeriesId(index);
          return (
            <motion.section
              key={seriesData.series.id}
              id={seriesData.series.slug || `series-${seriesData.series.id}`}
              variants={dropDownVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="relative min-h-screen snap-start"
            >
              {seriesData.artworks[0]?.imageUrl && (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center opacity-15"
                  style={{
                    backgroundImage: `url(${seriesData.artworks[0].imageUrl})`,
                  }}
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/95 via-white/90 to-neutral-50/95" />

              <div className="relative z-10 py-24 px-8 md:px-16 lg:px-24">
                <div className="max-w-7xl mx-auto">
                  <motion.div
                    variants={fadeInUp}
                    className="mb-12 md:mb-16 text-center"
                  >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 mb-6">
                      {seriesData.series.name}
                    </h2>
                    <p className="text-lg text-neutral-600 max-w-4xl mx-auto leading-relaxed">
                      {seriesData.series.description}
                    </p>
                  </motion.div>

                  <motion.div
                    variants={fadeInUp}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
                  >
                    {seriesData.artworks.map((artwork, artIndex) => (
                      <motion.div
                        key={artwork.id}
                        variants={artworkVariants}
                        transition={{ delay: artIndex * 0.1 }}
                      >
                        <Link href={`/artworks/${artwork.id}`}>
                          <div className="group cursor-pointer">
                            <div className="relative aspect-[4/5] overflow-hidden mb-4 rounded-lg bg-neutral-100">
                              <Image
                                src={artwork.imageUrl}
                                alt={artwork.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                            <h4 className="text-lg font-light text-neutral-900 group-hover:text-neutral-600 transition-colors duration-300 mb-2">
                              {artwork.title}
                            </h4>
                            {artwork.dimensions && artwork.medium && (
                              <p className="text-sm text-neutral-500">
                                {artwork.dimensions} | {artwork.medium}
                              </p>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  {nextSeriesId && (
                    <motion.div
                      variants={fadeInUp}
                      className="mt-16 flex justify-center"
                    >
                      <Link
                        href={`#${nextSeriesId}`}
                        scroll={true}
                        className="group inline-flex items-center gap-4 text-neutral-700 hover:text-neutral-900 transition-colors duration-300"
                      >
                        <div className="flex items-center justify-center w-10 h-10 border border-neutral-300 rounded-full group-hover:border-neutral-500 transition-all duration-300">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm tracking-widest uppercase">
                            Continue
                          </p>
                          <p className="text-base font-light">
                            Next Series:{" "}
                            {seriesWithArtworks[index + 1].series.name}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.section>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 0.5 }}
          className="snap-start"
        >
          <Footer />
        </motion.div>
      </div>
    </div>
  );
}
