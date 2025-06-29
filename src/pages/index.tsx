import Head from "next/head";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/ui/Footer";
import StatCounter from "@/components/Animations/StatCounter";
import React from "react";
import Link from "next/link"; // Import Link for navigation

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
              <source src="https://res.cloudinary.com/dq3wkbgts/video/upload/v1735653355/samples/dance-2.mp4" type="video/mp4" />
              <source src="/videos/hero-background.webm" type="video/webm" />
              {/* Fallback for browsers that don't support video */}
            </video>
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl font-extrabold text-white sm:text-6xl md:text-7xl tracking-tight">
                  <span className="block font-serif">Njenga Ngugi</span>
                  <span className="block text-2xl sm:text-3xl font-normal text-gray-200 mt-4">
                    Contemporary African Art
                  </span>
                </h1>

                <p className="mt-8 text-xl text-gray-100 leading-relaxed max-w-3xl mx-auto">
                  Exploring the intersection of traditional African artistry and
                  contemporary expression. Each piece is a journey through
                  culture, memory, and innovation, creating a bridge between
                  generations and continents. Discover his unique series of
                  works, each telling its own compelling story.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                  {/* Link to the main gallery page */}
                  <Link
                    href="/gallery"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200 shadow-lg backdrop-blur-sm"
                  >
                    Explore Gallery
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
                    <StatCounter end={15} label="Years of experience" />
                  </div>

                  <div className="w-px h-12 bg-gray-400"></div>

                  <div className="flex flex-col items-center">
                    <StatCounter end={15} label="Major exhibitions" />
                  </div>

                  <div className="w-px h-12 bg-gray-400"></div>

                  <div className="flex flex-col items-center">
                    <StatCounter end={20} label="Artworks" />
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