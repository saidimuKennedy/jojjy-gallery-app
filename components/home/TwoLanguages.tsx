import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLink, MediaFrame, Shell } from "@/components/home/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/motion";

export default function TwoLanguages({
  artImage,
  artAlt,
  musicImage,
  musicAlt,
}: {
  artImage?: string | null;
  artAlt?: string;
  musicImage?: string | null;
  musicAlt?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion() ?? false;

  // Progress across the pinned (desktop) composition.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Art and Music begin low/quiet, then resolve toward the viewer as the
  // central statement becomes the anchor. Deliberately small distances.
  const artY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [70, -30]
  );
  const artScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [0.94, 1.02]
  );
  const artOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 1],
    reduce ? [1, 1, 1] : [0.45, 0.9, 1]
  );

  const musicY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [110, -50]
  );
  const musicScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [0.9, 1.04]
  );
  const musicOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    reduce ? [1, 1, 1] : [0.45, 0.9, 1]
  );

  const centerScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduce ? [1, 1, 1] : [0.98, 1, 1.01]
  );

  return (
    <section
      ref={sectionRef}
      className="jenga-pin-track border-t border-white/5 bg-black py-20 md:py-28 lg:h-[210vh] lg:py-0"
    >
      <div className="jenga-pin lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
        <Shell className="w-full">
          <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.3fr_0.85fr] lg:gap-14">
            <motion.div
              className="hidden lg:block"
              style={{ y: artY, scale: artScale, opacity: artOpacity }}
              data-motion
            >
              <MediaFrame
                src={artImage}
                alt={artAlt || "Artwork by JENGA"}
                aspect="aspect-[4/5]"
                preset="card"
                sizes="(max-width: 1024px) 45vw, 22vw"
              />
            </motion.div>

            <motion.div
              className="text-center"
              style={{ scale: centerScale }}
              data-motion
            >
              <RevealGroup stagger={0.12}>
                <RevealItem y={20}>
                  <h2 className="jenga-cream font-display text-[clamp(2.25rem,5vw,4rem)] font-light leading-[1.05] tracking-tight">
                    Two Languages. One Voice.
                  </h2>
                </RevealItem>

                <RevealItem y={16} className="mt-8">
                  <div className="jenga-body-text space-y-1 font-display text-xl font-light italic leading-relaxed md:text-2xl">
                    <p>One looks inward.</p>
                    <p>One speaks outward.</p>
                  </div>
                </RevealItem>

                <RevealItem y={16} className="mt-9">
                  <p className="jenga-body-text mx-auto max-w-md text-sm leading-[1.95]">
                    Both begin with the same place: human experience.
                  </p>
                </RevealItem>

                <RevealItem y={14} className="mt-10">
                  <div className="flex items-center justify-center gap-x-12">
                    <ArrowLink href="/portfolio">Art</ArrowLink>
                    <ArrowLink href="/music">Music</ArrowLink>
                  </div>
                </RevealItem>
              </RevealGroup>
            </motion.div>

            <motion.div
              className="hidden lg:block"
              style={{ y: musicY, scale: musicScale, opacity: musicOpacity }}
              data-motion
            >
              <MediaFrame
                src={musicImage}
                alt={musicAlt || "JENGA music"}
                aspect="aspect-[4/5]"
                preset="card"
                sizes="(max-width: 1024px) 45vw, 22vw"
              />
            </motion.div>

            {/* Mobile/tablet: static stacked composition with a simple reveal. */}
            <div className="grid grid-cols-2 gap-4 lg:hidden">
              <Reveal y={18} duration={0.9}>
                <MediaFrame
                  src={artImage}
                  alt={artAlt || "Artwork by JENGA"}
                  aspect="aspect-[4/5]"
                  preset="card"
                  sizes="45vw"
                />
              </Reveal>
              <Reveal y={18} duration={0.9} delay={0.08}>
                <MediaFrame
                  src={musicImage}
                  alt={musicAlt || "JENGA music"}
                  aspect="aspect-[4/5]"
                  preset="card"
                  sizes="45vw"
                />
              </Reveal>
            </div>
          </div>
        </Shell>
      </div>
    </section>
  );
}
