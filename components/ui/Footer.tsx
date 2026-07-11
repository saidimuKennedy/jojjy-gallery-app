import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="px-8 py-16 md:px-16 lg:px-24">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-display text-2xl font-light tracking-tight text-neutral-900 md:text-3xl">
              Njenga Ngugi
            </p>
            <p className="text-sm font-light text-neutral-500 md:text-base">
              Nairobi, Kenya
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm uppercase tracking-[0.18em] text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Instagram
            </a>
            <Link
              href="/contact"
              className="text-sm uppercase tracking-[0.18em] text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Contact
            </Link>
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
