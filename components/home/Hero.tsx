import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { EASE } from "@/components/home/motion";

/* ---------------------------------------------------------------------------
 * PHASE 1 PLACEHOLDER MEDIA (unchanged — swap here for the final video)
 * ---------------------------------------------------------------------------
 * The final JENGA opening video has NOT been supplied yet.
 *
 * The final JENGA opening video has NOT been supplied yet, so no video URL
 * is set: the hero rests on the artist portrait until the final Cloudinary
 * video/poster is dropped in (set HERO_VIDEO_MP4, optionally HERO_VIDEO_WEBM
 * / HERO_POSTER). Never point this at generic sample footage in production.
 * ------------------------------------------------------------------------- */
export const HERO_VIDEO_MP4 = "";
export const HERO_VIDEO_WEBM = "";
// Poster = the artist portrait already in the repo; swap alongside the final video.
export const HERO_POSTER = "/images/joj-artist.png";

/* ---------------------------------------------------------------------------
 * PHASE 2 REVEAL TIMING — the one place to tune the cinematic sequence.
 * Sequence: darkness → media perceptible → overlay clears → JENGA → subtitle
 * → tagline → ENTER. Delays are seconds from mount; durations are seconds.
 * The final client video will carry much of the darkness → light → focus
 * effect itself, so keep these restrained rather than over-animating.
 * ------------------------------------------------------------------------- */
export const HERO_REVEAL = {
  curtain: { delay: 0.2, duration: 3.2 },
  media: { delay: 0.15, duration: 2.8 },
  jenga: { delay: 1.15, duration: 1.4 },
  subtitle: { delay: 1.95, duration: 1.0 },
  tagline: { delay: 2.4, duration: 1.0 },
  enter: { delay: 2.95, duration: 0.9 },
  /** Scroll-out response as the visitor leaves the hero. */
  scroll: { mediaScale: 1.06, mediaY: 90, contentY: 70, contentFade: 0.55 },
} as const;

export default function Hero() {
  const hasVideo = Boolean(HERO_VIDEO_MP4);
  const reduce = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reduced motion: stop the background footage rather than let it loop.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduce) video.pause();
    else void video.play().catch(() => {});
  }, [reduce]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const mediaY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduce ? 0 : HERO_REVEAL.scroll.mediaY]
  );
  const mediaScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, reduce ? 1 : HERO_REVEAL.scroll.mediaScale]
  );
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduce ? 0 : HERO_REVEAL.scroll.contentY]
  );
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, HERO_REVEAL.scroll.contentFade],
    [1, reduce ? 1 : 0]
  );

  const d = (value: number) => (reduce ? 0 : value);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-black"
    >
      {/* Media bed — video → poster → flat black fallback */}
      <motion.div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ y: mediaY, scale: mediaScale }}
        data-motion
      >
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: d(HERO_REVEAL.media.delay),
            duration: d(HERO_REVEAL.media.duration),
            ease: EASE,
          }}
          data-motion
          data-reveal
        >
          {HERO_POSTER ? (
            <OptimizedImage
              src={HERO_POSTER}
              alt=""
              fill
              preset="hero"
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : null}

          {hasVideo ? (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover object-center"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={HERO_POSTER || undefined}
            >
              <source src={HERO_VIDEO_MP4} type="video/mp4" />
              {HERO_VIDEO_WEBM ? (
                <source src={HERO_VIDEO_WEBM} type="video/webm" />
              ) : null}
            </video>
          ) : null}
        </motion.div>

        {/* Flat overlay (no gradients): keeps the artist and type legible. */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Opening darkness curtain — reduces to reveal the media. */}
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{
            delay: d(HERO_REVEAL.curtain.delay),
            duration: d(HERO_REVEAL.curtain.duration),
            ease: "easeInOut",
          }}
          data-scrim
        />
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-24 pt-32 md:px-12 md:pt-36 lg:px-20"
        style={{ y: contentY, opacity: contentOpacity }}
        data-motion
      >
        <motion.h1
          className="jenga-cream font-display text-[clamp(4rem,14vw,12rem)] font-light leading-[0.88] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: d(HERO_REVEAL.jenga.delay),
            duration: d(HERO_REVEAL.jenga.duration),
            ease: EASE,
          }}
          data-motion
          data-reveal
        >
          JENGA
        </motion.h1>
        <motion.p
          className="jenga-accent mt-8 font-archive-body text-sm font-medium uppercase tracking-[0.42em] md:text-base"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: d(HERO_REVEAL.subtitle.delay),
            duration: d(HERO_REVEAL.subtitle.duration),
            ease: EASE,
          }}
          data-motion
          data-reveal
        >
          Visual artist. Musician.
        </motion.p>
        <motion.p
          className="jenga-cream mt-6 max-w-lg font-display text-2xl font-light italic leading-relaxed md:text-3xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: d(HERO_REVEAL.tagline.delay),
            duration: d(HERO_REVEAL.tagline.duration),
            ease: EASE,
          }}
          data-motion
          data-reveal
        >
          Exploring the seen and the unseen.
        </motion.p>

        <motion.a
          href="#world"
          className="jenga-link mt-12 inline-flex md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: d(HERO_REVEAL.enter.delay),
            duration: d(HERO_REVEAL.enter.duration),
            ease: EASE,
          }}
          data-motion
          data-reveal
        >
          ENTER <span aria-hidden>↓</span>
        </motion.a>
      </motion.div>

      {/* Desktop ENTER keeps its Tailwind centering transform, so it is
          intentionally NOT marked `data-motion` (reduced-motion CSS resets
          transforms on marked elements). Only opacity animates. */}
      <motion.a
        href="#world"
        className="absolute right-8 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 md:flex lg:right-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: d(HERO_REVEAL.enter.delay),
          duration: d(HERO_REVEAL.enter.duration),
          ease: EASE,
        }}
        data-reveal
      >
        <span className="text-[0.6875rem] uppercase tracking-[0.4em] text-white/75 [writing-mode:vertical-rl]">
          ENTER
        </span>
        <span aria-hidden className="h-16 w-px bg-white/30" />
      </motion.a>
    </section>
  );
}
