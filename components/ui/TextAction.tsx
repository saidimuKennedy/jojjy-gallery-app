import React from "react";
import Link from "next/link";

/**
 * Canonical quiet EDITORIAL / INLINE LINK for contextual navigation inside
 * copy or where navigation should stay quiet (View collection, Your account).
 *
 * Sentence case, no box, no arrow, readable contrast, underline interaction,
 * visible focus state. Never competes with navigation controls or buttons.
 */
export default function TextAction({
  href,
  children,
  external = false,
  tone = "light",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  /** Renders an anchor (new tab) instead of a Next Link. */
  external?: boolean;
  /** "light" for light pages, "dark" for dark pages (e.g. homepage sections). */
  tone?: "light" | "dark";
  className?: string;
}) {
  const classes = `inline-flex items-center py-1 font-archive-body text-sm font-medium underline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 hover:underline focus-visible:underline ${
    tone === "dark"
      ? "text-neutral-300 hover:text-white"
      : "text-neutral-700 hover:text-neutral-900"
  } ${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
