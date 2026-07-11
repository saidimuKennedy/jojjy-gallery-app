import React, { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { useSeriesList, useArtworks } from "@/hooks/useArtWorks";
import { Artwork } from "@/types/api";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const ease = [0.22, 1, 0.36, 1] as const;

const heroStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.15 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease },
  },
};

const reveal: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease },
  },
};

const sectionReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

/** Asymmetric hang spans — leaves intentional empty wall */
const HANG_SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5 md:col-start-2",
  "md:col-span-6",
  "md:col-span-6",
  "md:col-span-4 md:col-start-3",
  "md:col-span-7 md:col-start-6",
  "md:col-span-5 md:col-start-1",
];

const HANG_ASPECTS = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
];

function formatDimensions(dimensions: string | null | undefined): string | null {
  if (!dimensions) return null;
  return dimensions.replace(/x/gi, " × ").replace(/\s+/g, " ").trim();
}

function hangWorks(artworks: Artwork[]) {
  if (artworks.length === 0) {
    return { opening: null, middle: [] as Artwork[], closing: null };
  }
  if (artworks.length === 1) {
    return { opening: artworks[0], middle: [], closing: null };
  }
  if (artworks.length === 2) {
    return { opening: artworks[0], middle: [], closing: artworks[1] };
  }
  return {
    opening: artworks[0],
    middle: artworks.slice(1, -1),
    closing: artworks[artworks.length - 1],
  };
}

function MuseumLabel({
  artwork,
  align = "left",
}: {
  artwork: Artwork;
  align?: "left" | "center";
}) {
  return (
    <figcaption
      className={`mt-5 space-y-1 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <p className="font-display text-lg font-light text-neutral-900 md:text-xl">
        {artwork.title}
      </p>
      {artwork.year != null && (
        <p className="text-sm font-light tracking-wide text-neutral-600">
          {artwork.year}
        </p>
      )}
      {artwork.medium && (
        <p className="text-sm font-light tracking-wide text-neutral-600">
          {artwork.medium}
        </p>
      )}
      {formatDimensions(artwork.dimensions) && (
        <p className="text-sm font-light tracking-wide text-neutral-600">
          {formatDimensions(artwork.dimensions)}
        </p>
      )}
    </figcaption>
  );
}

function ArtworkLink({
  artwork,
  className = "",
  aspect = "aspect-[4/5]",
  sizes = "(max-width: 768px) 100vw, 50vw",
  labelAlign = "left",
}: {
  artwork: Artwork;
  className?: string;
  aspect?: string;
  sizes?: string;
  labelAlign?: "left" | "center";
}) {
  return (
    <motion.figure variants={reveal} className={`group ${className}`}>
      <Link
        href={`/artworks/${artwork.id}`}
        className="block outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
        style={{ cursor: "zoom-in" }}
      >
        <div className={`relative overflow-hidden bg-neutral-100 ${aspect}`}>
          <Image
            src={artwork.imageUrl}
            alt={artwork.title}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-[800ms] ease-in-out group-hover:scale-[1.02]"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=="
          />
        </div>
        <MuseumLabel artwork={artwork} align={labelAlign} />
      </Link>
    </motion.figure>
  );
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
          Loading
        </p>
      </div>
    );
  }

  if (!heroArtwork || seriesWithArtworks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <h1 className="font-display text-2xl font-light text-neutral-900 mb-4">
          Portfolio Empty
        </h1>
        <Link
          href="/gallery"
          className="font-display text-xs uppercase tracking-[0.28em] text-neutral-500 hover:text-neutral-900"
        >
          View Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-white">
      <Head>
        <title>Njenga Ngugi — Portfolio</title>
        <meta
          name="description"
          content="Exhibition catalogue of works by Njenga Ngugi"
        />
      </Head>

      <Navbar />

      {/* Hero — painting fades, then title, then line */}
      <section className="relative flex h-[100svh] flex-col justify-center overflow-hidden px-8 md:px-16 lg:px-24">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroArtwork.imageUrl})` }}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
        />
        <motion.div
          className="absolute inset-0 bg-black/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease }}
        />

        <motion.div
          className="relative z-10 max-w-4xl pt-10 md:pt-14"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={heroItem}
            className="font-display text-6xl font-light leading-[0.92] tracking-tight text-white md:text-8xl lg:text-9xl"
          >
            Njenga
            <br />
            Ngugi
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mt-10 max-w-md font-display text-base font-light italic leading-relaxed text-white/80 md:mt-12 md:text-lg"
          >
            Dreams are not escapes from reality—they are another way reality
            speaks.
          </motion.p>

          <motion.div variants={heroItem} className="mt-14">
            <a
              href="#introduction"
              className="font-display text-sm uppercase tracking-[0.28em] text-white/80 transition-colors duration-500 hover:text-white"
            >
              Enter exhibition ↓
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Introduction */}
      <motion.section
        id="introduction"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-12%" }}
        className="px-8 py-28 md:px-16 md:py-36 lg:px-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <motion.blockquote
            variants={reveal}
            className="font-display text-3xl font-light leading-[1.35] tracking-tight text-neutral-900 md:text-4xl lg:text-[2.75rem]"
          >
            “Dark clouds bring waters—a space where hidden truths and unspoken
            fears take shape.”
          </motion.blockquote>
          <motion.p
            variants={reveal}
            className="mt-10 font-display text-sm uppercase tracking-[0.24em] text-neutral-500"
          >
            — Njenga Ngugi
          </motion.p>
          <motion.div
            variants={reveal}
            className="mx-auto mt-16 h-px w-12 bg-neutral-200"
            aria-hidden
          />
          <motion.p
            variants={reveal}
            className="mx-auto mt-16 max-w-md text-sm font-light leading-relaxed text-neutral-500"
          >
            Kenyan artist, born 1996, based in Nairobi. Works on paper in ink,
            bleach, charcoal and pastel—exploring the unconscious through mark
            and void.
          </motion.p>
        </div>
      </motion.section>

      {seriesWithArtworks.map((seriesData, index) => {
        const seriesId =
          seriesData.series.slug || `series-${seriesData.series.id}`;
        const { opening, middle, closing } = hangWorks(seriesData.artworks);

        return (
          <React.Fragment key={seriesData.series.id}>
            {index === 1 && (
              <motion.section
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 0.85, ease }}
                className="flex min-h-[70vh] items-center justify-center bg-neutral-950 px-8 py-32 md:px-16"
              >
                <div className="max-w-3xl text-center">
                  <p className="font-display text-3xl font-light leading-[1.4] tracking-tight text-white md:text-5xl lg:text-6xl">
                    “I have always been fascinated
                    <br className="hidden sm:block" /> by dreams.”
                  </p>
                  <p className="mt-12 font-display text-sm uppercase tracking-[0.28em] text-white/60">
                    — Njenga Ngugi
                  </p>
                </div>
              </motion.section>
            )}

            <motion.section
              id={seriesId}
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-8%" }}
              className="px-6 py-24 md:px-12 md:py-32 lg:px-20"
            >
              <div
                className="mx-auto mb-16 h-px w-8 bg-neutral-200 md:mb-20"
                aria-hidden
              />

              <motion.header
                variants={reveal}
                className="mb-16 text-center md:mb-24"
              >
                <p className="font-display text-sm uppercase tracking-[0.28em] text-neutral-500">
                  Series {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-5 font-display text-4xl font-light tracking-tight text-neutral-900 md:text-5xl lg:text-6xl xl:text-7xl">
                  {seriesData.series.name}
                </h2>
                {seriesData.series.description && (
                  <p className="mx-auto mt-6 max-w-md text-sm font-light leading-relaxed text-neutral-500">
                    {seriesData.series.description.length > 120
                      ? `${seriesData.series.description.slice(0, 120).trim()}…`
                      : seriesData.series.description}
                  </p>
                )}
              </motion.header>

              <div className="mx-auto max-w-[1400px]">
                {/* Opening wall — one dominant work */}
                {opening && (
                  <div className="mb-20 md:mb-28 md:px-[8%]">
                    <ArtworkLink
                      artwork={opening}
                      aspect="aspect-[4/5] md:aspect-[16/11]"
                      sizes="(max-width: 768px) 100vw, 84vw"
                      labelAlign="center"
                    />
                  </div>
                )}

                {/* Asymmetric hang — varied spans, empty wall */}
                {middle.length > 0 && (
                  <div className="mb-20 grid grid-cols-1 gap-x-8 gap-y-16 md:mb-28 md:grid-cols-12 md:gap-y-24">
                    {middle.map((artwork, i) => (
                      <ArtworkLink
                        key={artwork.id}
                        artwork={artwork}
                        className={HANG_SPANS[i % HANG_SPANS.length]}
                        aspect={HANG_ASPECTS[i % HANG_ASPECTS.length]}
                        sizes="(max-width: 768px) 100vw, 45vw"
                      />
                    ))}
                  </div>
                )}

                {/* Closing wall — quieter, centered, more margin */}
                {closing && (
                  <div className="mx-auto max-w-xl md:max-w-2xl">
                    <ArtworkLink
                      artwork={closing}
                      aspect="aspect-[4/5]"
                      sizes="(max-width: 768px) 100vw, 42vw"
                      labelAlign="center"
                    />
                  </div>
                )}
              </div>
            </motion.section>
          </React.Fragment>
        );
      })}

      <Footer />
    </div>
  );
}
