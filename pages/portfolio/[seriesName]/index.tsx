import React from "react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSeries } from "@/hooks/useArtWorks";
import { motion, Variants } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

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

function filmEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v");
      if (!id && u.hostname.includes("youtu.be")) {
        id = u.pathname.slice(1);
      }
      if (!id && u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/")[2];
      }
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

const PortfolioSeriesPage: React.FC = () => {
  const router = useRouter();
  const { seriesName } = router.query;
  const seriesSlug = typeof seriesName === "string" ? seriesName : undefined;

  const { series, isLoading, error } = useSeries(
    router.isReady ? seriesSlug : undefined
  );

  if (isLoading || !router.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 text-sm tracking-wide">LOADING</p>
        </motion.div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center min-h-screen flex flex-col justify-center">
          <h1 className="font-display text-4xl font-light text-gray-900 mb-6 tracking-tight">
            Series Not Found
          </h1>
          <p className="text-gray-600 text-sm font-light">
            The series &quot;{(seriesSlug || "").replace(/-/g, " ")}&quot; could
            not be found.
          </p>
          <Link
            href="/portfolio"
            className="mt-8 text-neutral-600 hover:text-neutral-900 underline-offset-4 hover:underline"
          >
            Back to Portfolio
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const intro = series.introduction || series.description;
  const mediaFiles = series.mediaFiles || [];
  const artworks = series.artworks || [];
  const embedSrc = series.filmUrl ? filmEmbedUrl(series.filmUrl) : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-neutral-50"
    >
      <Head>
        <title>{series.name} — Njenga Ngugi Portfolio</title>
        <meta
          name="description"
          content={
            intro ||
            `Artworks from the ${series.name} series by Njenga Ngugi`
          }
        />
      </Head>
      <Navbar />

      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
        <motion.h1
          variants={fadeInUp}
          className="font-display text-4xl md:text-5xl font-light text-gray-900 text-center mb-6 md:mb-8 tracking-tight"
        >
          {series.name}
        </motion.h1>

        {/* Intro */}
        {intro && (
          <motion.section variants={fadeInUp} className="max-w-2xl mx-auto mb-16 md:mb-24">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 text-center mb-6">
              Introduction
            </p>
            <p className="text-sm font-light text-gray-600 text-center leading-relaxed md:text-base md:leading-relaxed whitespace-pre-line">
              {intro}
            </p>
          </motion.section>
        )}

        {/* Artist statement */}
        {series.artistStatement && (
          <motion.section
            variants={fadeInUp}
            className="max-w-2xl mx-auto mb-16 md:mb-24 border-t border-neutral-200 pt-16"
          >
            <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 text-center mb-6">
              Artist statement
            </p>
            <blockquote className="font-display text-xl md:text-2xl font-light leading-relaxed text-neutral-800 text-center tracking-tight whitespace-pre-line">
              {series.artistStatement}
            </blockquote>
          </motion.section>
        )}

        {/* Works */}
        <motion.section variants={fadeInUp} className="mb-16 md:mb-24">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 text-center mb-10">
            Works
          </p>
          {artworks.length === 0 ? (
            <p className="text-center text-sm font-light text-neutral-500">
              No artworks in this series yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {artworks.map((artwork) => (
                <motion.div key={artwork.id} variants={fadeInUp} className="group">
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
                    <div className="pt-4">
                      <h2 className="font-display text-lg font-light text-gray-800 truncate mb-1">
                        {artwork.title}
                      </h2>
                      <p className="text-sm text-gray-500 font-light">
                        {[artwork.year, artwork.medium].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Behind the scenes */}
        {mediaFiles.length > 0 && (
          <motion.section
            variants={fadeInUp}
            className="mb-16 md:mb-24 border-t border-neutral-200 pt-16"
          >
            <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 text-center mb-10">
              Behind the scenes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {mediaFiles.map((file) => (
                <div key={file.id} className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {file.type === "VIDEO" ? (
                    <video
                      src={file.url}
                      poster={file.thumbnailUrl || undefined}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={file.url}
                      alt={file.description || "Behind the scenes"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                  {file.description && (
                    <p className="mt-2 text-xs font-light text-neutral-500">
                      {file.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Film */}
        {series.filmUrl && (
          <motion.section
            variants={fadeInUp}
            className="mb-16 md:mb-24 border-t border-neutral-200 pt-16"
          >
            <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 text-center mb-10">
              Film
            </p>
            <div className="max-w-3xl mx-auto">
              {embedSrc ? (
                <div className="relative w-full aspect-video bg-neutral-900">
                  <iframe
                    src={embedSrc}
                    title={`${series.name} film`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <p className="text-center text-sm font-light">
                  <a
                    href={series.filmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 underline-offset-4 hover:underline"
                  >
                    Watch the film →
                  </a>
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* CTAs */}
        {artworks.length > 0 && (
          <motion.section
            variants={fadeInUp}
            className="text-center border-t border-neutral-200 pt-16"
          >
            <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400 mb-8">
              Collect
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {artworks.slice(0, 4).map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  className="inline-block border border-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.24em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
                >
                  {artwork.title}
                </Link>
              ))}
            </div>
            <Link
              href="/portfolio"
              className="mt-10 inline-block font-display text-xs uppercase tracking-[0.28em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
            >
              Back to Portfolio
            </Link>
          </motion.section>
        )}
      </div>
      <Footer />
    </motion.div>
  );
};

export default PortfolioSeriesPage;
