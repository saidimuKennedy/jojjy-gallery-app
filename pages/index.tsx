import Head from "next/head";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { SITE_LOGO_URL } from "@/lib/cloudinary";
import StatCounter from "@/components/Animations/StatCounter";
import React from "react";
import Link from "next/link"; 

export default function Home() {
  return (
    <>
      <Head>
        <title>Njenga Ngugi - Contemporary African Art</title>
        <meta
          name="description"
          content="Discover amazing artworks by Njenga Ngugi. Explore his unique series of contemporary African art in the online gallery."
        />
      </Head>

      <main className="min-h-screen bg-white flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden flex-grow">
          {/* Video Background */}
          <div className="absolute inset-0 overflow-hidden">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://res.cloudinary.com/dq3wkbgts/video/upload/v1735653355/samples/dance-2.mp4"
                type="video/mp4"
              />
              <source src="/videos/hero-background.webm" type="video/webm" />
              {/* Fallback for browsers that don't support video */}
            </video>
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-4xl mx-auto">
                <div className="flex justify-center mb-4">
                  <div className="w-36 h-24 sm:w-44 sm:h-28 md:w-52 md:h-32 relative">
                    <OptimizedImage
                      src={SITE_LOGO_URL}
                      alt="Njenga Ngugi Logo"
                      fill
                      preset="thumb"
                      priority
                      className="object-contain transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </div>

                <h1 className="mt-6 font-display text-5xl font-light tracking-tight text-white sm:text-6xl md:text-7xl">
                  Njenga Ngugi
                </h1>

                <p className="mt-8 text-sm font-light leading-relaxed text-white/80 max-w-xl mx-auto md:text-[0.9375rem] md:leading-[1.7]">
                  Exploring the intersection of traditional African artistry and
                  contemporary expression—a bridge between generations and
                  continents.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                  {/* Link to the main gallery page */}
                  <Link
                    href="/gallery"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200 shadow-lg backdrop-blur-sm"
                  >
                    Enter Archive
                  </Link>

                  {/* Link to the About page */}
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-md text-gray-900 bg-white bg-opacity-90 hover:bg-opacity-100 transition-all duration-200 backdrop-blur-sm"
                  >
                    About the Artist
                  </Link>
                </div>

                <div className="mt-16 flex justify-center space-x-6 text-sm text-gray-200">
                  <div className="flex flex-col items-center">
                    <StatCounter end={15} label="Years of experience" light />
                  </div>

                  <div className="w-px h-12 bg-white/30"></div>

                  <div className="flex flex-col items-center">
                    <StatCounter end={15} label="Major exhibitions" light />
                  </div>

                  <div className="w-px h-12 bg-white/30"></div>

                  <div className="flex flex-col items-center">
                    <StatCounter end={20} label="Artworks" light />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
