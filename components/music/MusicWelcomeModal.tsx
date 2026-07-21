import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type MusicWelcomeModalProps = {
  type: "studio" | "release";
  title?: string;
  onClose: () => void;
};

export default function MusicWelcomeModal({
  type,
  title,
  onClose,
}: MusicWelcomeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full bg-white p-8 md:p-10 text-center shadow-xl"
      >
        {type === "studio" ? (
          <>
            <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400">
              Welcome
            </p>
            <h2 className="mt-4 font-display text-3xl font-light text-neutral-900">
              Welcome to the Studio
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Member releases are unlocked. You&apos;re hearing the work before
              it goes wider.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/music/studio"
                className="border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white hover:bg-white hover:text-neutral-900"
                onClick={onClose}
              >
                Inside the Studio
              </Link>
              <Link
                href="/music/library"
                className="border border-neutral-300 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-neutral-700 hover:border-neutral-900"
                onClick={onClose}
              >
                Your collection
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400">
              Welcome
            </p>
            <h2 className="mt-4 font-display text-3xl font-light text-neutral-900">
              {title ? `"${title}" is yours` : "Added to your collection"}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Unlimited playback — forever in your collection.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white hover:bg-white hover:text-neutral-900"
                onClick={onClose}
              >
                Listen now
              </button>
              <Link
                href="/music/library"
                className="border border-neutral-300 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-neutral-700 hover:border-neutral-900"
                onClick={onClose}
              >
                Your collection
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
