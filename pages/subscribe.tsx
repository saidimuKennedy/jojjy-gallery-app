import React from "react";
import Head from "next/head";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import NewsletterSignup from "@/components/ui/NewsletterSignup";

export default function SubscribePage() {
  return (
    <>
      <Head>
        <title>Stay Close — Njenga Ngugi</title>
        <meta
          name="description"
          content="Receive occasional updates about new artworks, music releases, exhibitions and studio news."
        />
      </Head>
      <main className="min-h-screen bg-white">
        <Navbar />

        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.04),_transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-24 md:px-8 md:py-32">
            <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400">
              Updates
            </p>
            <h1 className="mt-5 font-display text-4xl font-light tracking-tight text-neutral-900 md:text-5xl">
              Stay Close to the Work
            </h1>
            <p className="mt-6 text-sm font-light leading-relaxed text-neutral-600 md:text-base">
              Receive occasional updates about new artworks, music releases,
              exhibitions and studio news.
            </p>

            <div className="mt-12">
              <NewsletterSignup />
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
