import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import { ArrowLink, Eyebrow, MediaFrame, Shell } from "@/components/home/primitives";
import { EASE, Reveal, RevealGroup, RevealItem } from "@/components/home/motion";
import type { HomeStudioItem } from "@/components/home/types";

function StudioStripItem({
  item,
  index,
  progress,
}: {
  item: HomeStudioItem;
  index: number;
  progress: MotionValue<number>;
}) {
  const reduce = useReducedMotion() ?? false;
  // Small differential drift per image keeps the strip from feeling mechanical.
  const y = useTransform(
    progress,
    [0, 1],
    reduce ? [0, 0] : [12 + index * 5, -12 - index * 5]
  );

  return (
    <motion.div
      data-motion
      data-reveal
      style={{ y }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: reduce ? 0 : 0.8,
        delay: reduce ? 0 : index * 0.06,
        ease: EASE,
      }}
    >
      <MediaFrame
        src={item.imageUrl}
        alt={item.title}
        aspect="aspect-[4/5]"
        preset="card"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 18vw"
      />
    </motion.div>
  );
}

export default function FromTheStudio({
  items,
}: {
  items: HomeStudioItem[];
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="border-t border-white/5 bg-black py-20 md:py-28 lg:py-32"
    >
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <RevealGroup stagger={0.1}>
            <RevealItem y={18}>
              <Eyebrow>From the Studio</Eyebrow>
            </RevealItem>
            <RevealItem y={18} className="mt-5">
              <p className="jenga-body-text max-w-md text-sm leading-[1.95]">
                Works in progress. Fragments. Songs. Sketches. Ideas. Things
                still becoming.
              </p>
            </RevealItem>
          </RevealGroup>

          <Reveal y={14} duration={0.8} delay={0.1}>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              <ArrowLink href="/music/studio">Step inside</ArrowLink>
              <ArrowLink href="/gallery">View more</ArrowLink>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
          {items.slice(0, 5).map((item, index) => (
            <StudioStripItem
              key={item.id}
              item={item}
              index={index}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </Shell>
    </section>
  );
}
