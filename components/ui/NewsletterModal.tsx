import React, { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type NewsletterModalProps = {
  onClose: () => void;
  onGoSubscribe: () => void;
};

export default function NewsletterModal({
  onClose,
  onGoSubscribe,
}: NewsletterModalProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audience-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={
          reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md bg-white p-8 text-center shadow-xl md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xs uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:text-neutral-900"
          aria-label="Dismiss"
        >
          Close
        </button>

        <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400">
          Updates
        </p>
        <h2
          id="audience-modal-title"
          className="mt-4 font-display text-3xl font-light text-neutral-900"
        >
          Stay Close to the Work
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Occasional notes on new artworks, music releases, exhibitions, and
          studio news.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/subscribe"
            className="border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white hover:bg-white hover:text-neutral-900"
            onClick={onGoSubscribe}
          >
            Subscribe
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="border border-neutral-300 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-neutral-700 hover:border-neutral-900"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
