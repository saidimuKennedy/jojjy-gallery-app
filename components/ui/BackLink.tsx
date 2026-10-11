import React from "react";
import Link from "next/link";

/**
 * Canonical OUTLINED NAVIGATION CONTROL for standalone navigation
 * (Back to Art / Studio / Events / Shop / Music, prominent section choices).
 *
 * Link semantics. Transparent background, thin 1px border, square corners,
 * no arrow, compact, restrained uppercase with moderate tracking. Crisp
 * color-invert hover — deliberately not playful.
 */
export default function BackLink({
  href,
  children,
  tone = "light",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  /** "light" for light pages, "dark" for dark pages (e.g. homepage sections). */
  tone?: "light" | "dark";
  className?: string;
}) {
  const palette =
    tone === "dark"
      ? "border-white/40 bg-transparent text-neutral-100 hover:border-neutral-100 hover:bg-neutral-100 hover:text-neutral-900"
      : "border-neutral-400 bg-transparent text-neutral-800 hover:border-neutral-900 hover:bg-neutral-900 hover:text-neutral-50";

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center border px-5 py-2.5 font-archive-body text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${palette} ${className}`}
    >
      {children}
    </Link>
  );
}
