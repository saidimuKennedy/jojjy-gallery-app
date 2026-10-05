import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { ButtonLink, Eyebrow } from "@/components/home/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/motion";

export default function WorldOfJenga({
  image,
  imageAlt,
}: {
  image?: string | null;
  imageAlt?: string;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [40, -40]
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [1.04, 1.0]
  );

  return (
    <section
      ref={sectionRef}
      id="world"
      className="border-t border-white/5 bg-black"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-20 md:px-12 md:py-28 lg:px-20 lg:py-36">
          <RevealGroup stagger={0.12} delay={0.05}>
            <RevealItem y={18}>
              <Eyebrow>The World of Jenga</Eyebrow>
            </RevealItem>

            <RevealItem y={24} className="mt-9">
              <div className="jenga-body-text max-w-xl space-y-5 text-[0.9375rem] leading-[1.95]">
                <p>There are things we experience that are difficult to explain.</p>
                <p>
                  A feeling. A memory. A moment between two people. A thought that
                  refuses to leave.
                </p>
                <p>
                  Jenga explores these spaces through visual art and
                  music—sometimes through the surreal, sometimes through the
                  familiar, always through the human experience.
                </p>
                <p className="jenga-cream font-display text-xl font-light italic leading-relaxed md:text-2xl">
                  Two disciplines. One evolving practice.
                </p>
              </div>
            </RevealItem>

            <RevealItem y={18} className="mt-10">
              <ButtonLink href="/portfolio">Explore the work</ButtonLink>
            </RevealItem>
          </RevealGroup>
        </div>

        <motion.div
          className="relative min-h-[60vh] lg:min-h-[42rem]"
          style={{ y: imageY, scale: imageScale }}
          data-motion
        >
          <Reveal className="absolute inset-0" y={0} duration={1.2}>
            {image ? (
              <OptimizedImage
                src={image}
                alt={imageAlt || "Artwork by JENGA"}
                fill
                preset="hero"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-black" />
            )}
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}
