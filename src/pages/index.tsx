import { useState } from "react";
import Head from "next/head";
// Removed: FeaturedSection, FeaturingSection (as per discussion)
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
// Removed: useFeaturedArtworks, useArtworks (not needed for static landing)
// Removed: CategoriesNav/SeriesNav from homepage itself, as it navigates away
import { ArtworkWithRelations } from "@/types/api"; // Still useful for general type awareness
import StatCounter from "@/components/Animations/StatCounter";
import React from "react";
import Link from "next/link"; // Import Link for navigation

export default function Home() {
  // No longer need focusImage, selectedCategory, or artwork fetching logic
  // as the homepage will be a static landing page

  return (
    <>
      <Head>
        <title>Njenga Ngugi - Contemporary African Art</title>
        <meta
          name="description"
          content="Discover amazing artworks by Njenga Ngugi. Explore his unique series of contemporary African art in the online gallery."
        />
        {/* You can add more meta tags for SEO here */}
      </Head>

      <main className="min-h-screen bg-white flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Hero Section - Keep its structure, but update content and links */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden flex-grow">
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                backgroundSize: "60px 60px",
              }}
            />
          </div>
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl md:text-7xl tracking-tight">
                  <span className="block font-serif">Njenga Ngugi</span>
                  <span className="block text-2xl sm:text-3xl font-normal text-gray-500 mt-4">
                    Contemporary African Art
                  </span>
                </h1>
                <p className="mt-8 text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  Exploring the intersection of traditional African artistry and
                  contemporary expression. Each piece is a journey through
                  culture, memory, and innovation, creating a bridge between
                  generations and continents. Discover his unique series of
                  works, each telling its own compelling story.
                </p>
                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                  {/* Link to the main gallery page */}
                  <Link href="/gallery" passHref>
                    <a className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200 shadow-sm">
                      Explore Gallery
                    </a>
                  </Link>
                  {/* Link to the About page */}
                  <Link href="/about" passHref>
                    <a className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-md text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                      About the Artist
                    </a>
                  </Link>
                </div>
                <div className="mt-16 flex justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex flex-col items-center">
                    <StatCounter end={15} label="Years of experience" />
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="flex flex-col items-center">
                    <StatCounter end={15} label="Major exhibitions" />
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="flex flex-col items-center">
                    {/* Consider dynamically fetching total artwork count or manually updating */}
                    <StatCounter end={20} label="Artworks" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Removed: Categories Navigation (SeriesNav) from homepage directly */}
        {/* Removed: Featured Section and Featuring Section */}
      </main>

      <Footer />
    </>
  );
}
