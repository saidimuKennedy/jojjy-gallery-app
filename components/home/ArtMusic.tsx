import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { MotionStyle } from "framer-motion";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { ArrowLink, Divider } from "@/components/home/primitives";
import { EASE, RevealGroup, RevealItem } from "@/components/home/motion";

interface PanelLink {
  label: string;
  href: string;
}

function Panel({
  variant,
  title,
  subtitle,
  paragraphs,
  image,
  imageAlt,
  links,
  scrollStyle,
}: {
  variant: "art" | "music";
  title: string;
  subtitle: string;
  paragraphs: string[];
  image?: string | null;
  imageAlt?: string;
  links: PanelLink[];
  scrollStyle: MotionStyle;
}) {
  const reduce = useReducedMotion() ?? false;
  const isMusic = variant === "music";

  return (
    <section className="relative flex min-h-[80vh] items-end overflow-hidden border-t border-white/5">
      <motion.div
        className="absolute inset-0"
        style={scrollStyle}
        data-motion
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: isMusic ? 1.08 : 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: reduce ? 0 : isMusic ? 1.15 : 1.5, ease: EASE }}
          data-motion
          data-reveal
        >
          {image ? (
            <OptimizedImage
              src={image}
              alt={imageAlt || ""}
              fill
              preset="hero"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-black" />
          )}
        </motion.div>

        {/* Art → Music atmosphere: Music opens out of a deeper shadow as it
            enters, while Art keeps the inward, darker base treatment. */}
        {isMusic ? (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0.5 }}
            whileInView={{ opacity: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: reduce ? 0 : 1.6, ease: "easeInOut" }}
            data-scrim
          />
        ) : null}

        {/* Flat scrim (no gradients). Stronger on the bright artwork; lighter
            on the darker portrait so the Music image remains visible. */}
        <div
          className={`absolute inset-0 ${isMusic ? "bg-black/50" : "bg-black/70"}`}
        />
      </motion.div>

      <RevealGroup
        className="relative z-10 w-full px-6 pb-16 pt-32 md:px-12 md:pb-20 lg:px-16 lg:pb-24"
        stagger={0.09}
      >
        <RevealItem y={20}>
          <h2 className="jenga-cream font-display text-5xl font-light tracking-tight md:text-6xl lg:text-7xl">
            {title}
          </h2>
        </RevealItem>
        <RevealItem y={14} className="mt-5">
          <p className="jenga-accent font-archive-body text-[0.6875rem] font-medium uppercase tracking-[0.32em]">
            {subtitle}
          </p>
        </RevealItem>
        <RevealItem y={10} className="mt-6">
          <Divider />
        </RevealItem>
        <RevealItem y={20} className="mt-7">
          <div className="jenga-body-text max-w-md space-y-4 text-sm leading-[1.95]">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </RevealItem>
        <RevealItem y={16} className="mt-9">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {links.map((link) => (
              <ArrowLink key={link.href} href={link.href}>
                {link.label}
              </ArrowLink>
            ))}
          </div>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}

export default function ArtMusic({
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const artY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [30, -30]
  );
  const artScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [1.03, 1.01]
  );
  const musicY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [60, -60]
  );
  const musicScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [1.06, 1.02]
  );

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2">
      <Panel
        variant="art"
        title="ART"
        subtitle="What exists beneath what we see."
        image={artImage}
        imageAlt={artAlt}
        scrollStyle={{ y: artY, scale: artScale }}
        paragraphs={[
          "Jenga's visual practice moves between abstraction, surrealism and realism, using charcoal, ink, bleach and pastel to explore the psychological landscapes beneath everyday experience.",
          "Figures emerge from chaos. Familiar forms become strange. The personal becomes universal.",
        ]}
        links={[{ label: "View the art", href: "/portfolio" }]}
      />
      <Panel
        variant="music"
        title="MUSIC"
        subtitle="Stories we already know."
        image={musicImage}
        imageAlt={musicAlt}
        scrollStyle={{ y: musicY, scale: musicScale }}
        paragraphs={[
          "Love. Distance. Desire. Vulnerability. The things we say, the things we don't, and everything that happens between.",
          "Through R&B and soul, Jenga turns the ordinary experiences of connection and relationships into song.",
        ]}
        links={[
          { label: "Listen", href: "/music" },
          { label: "Upcoming live experiences", href: "/events" },
        ]}
      />
    </div>
  );
}
