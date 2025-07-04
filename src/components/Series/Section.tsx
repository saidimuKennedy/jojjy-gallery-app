import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Series, Artwork } from "@/types/api";

interface SeriesSectionProps {
  series: Series;
  artworks: Artwork[];
  nextSeriesSlug?: string;
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.42, 0, 0.58, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const SeriesSection: React.FC<SeriesSectionProps> = ({
  series,
  artworks,
  nextSeriesSlug,
}) => {
  return (
    <section
      id={series.slug || `series-${series.id}`}
      className="py-24 px-8 md:px-16 lg:px-24 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-12 md:mb-16 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
            {series.name}
          </h2>
          <p className="text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            {series.description}
          </p>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          {artworks.map((art) => (
            <motion.div variants={fadeInUp} key={art.id}>
              <Link href={`/artworks/${art.id}`}>
                <div className="group">
                  <div className="relative aspect-[4/5] overflow-hidden mb-4 rounded-lg">
                    <Image
                      src={art.imageUrl}
                      alt={art.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="text-neutral-900 font-light group-hover:text-neutral-600 transition-colors duration-300">
                    {art.title}
                  </h4>
                  {art.dimensions && art.medium && (
                    <p className="text-sm text-gray-500">
                      {art.dimensions} | {art.medium}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        {nextSeriesSlug && (
          <div className="mt-16 flex justify-center">
            <Link
              href={`#${nextSeriesSlug}`}
              className="flex items-center gap-2 text-neutral-800 hover:text-neutral-500 transition-all"
            >
              <span className="tracking-wide text-sm">Next Series</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default SeriesSection;
