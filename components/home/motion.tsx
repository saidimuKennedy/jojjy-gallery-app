import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";

/**
 * Phase 2 motion primitives — kept small and shared so every homepage section
 * speaks the same restrained motion language.
 *
 * Reduced-motion strategy (two layers, deliberately redundant):
 *  1. `useReducedMotion()` zeroes out durations below, so animation is skipped.
 *  2. `styles/globals.css` force-finalises `[data-motion]` elements for
 *     `prefers-reduced-motion`, so even before hydration the content is in its
 *     intended final state (and no transform/parallax leaks through).
 *
 * Every motion wrapper in the homepage carries the `data-motion` attribute.
 */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const VIEWPORT = { once: true, margin: "-12% 0px" } as const;

export function Reveal({
  children,
  className = "",
  y = 26,
  delay = 0,
  duration = 0.9,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      data-motion
      data-reveal
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={once ? VIEWPORT : { margin: "-12% 0px" }}
      transition={{
        duration: reduce ? 0 : duration,
        delay: reduce ? 0 : delay,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants = (stagger: number, delay: number, reduce: boolean): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reduce ? 0 : stagger,
      delayChildren: reduce ? 0 : delay,
    },
  },
});

export function RevealGroup({
  children,
  className = "",
  stagger = 0.08,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      data-motion
      data-reveal
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={once ? VIEWPORT : { margin: "-12% 0px" }}
      variants={groupVariants(stagger, delay, reduce)}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className = "",
  y = 22,
  duration = 0.8,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      data-motion
      data-reveal
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduce ? 0 : duration, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
