import React from "react";
import Head from "next/head";
import Navbar from "@/components/ui/Navbar"; // Assuming you want Navbar on all pages
import Footer from "@/components/ui/Footer"; // Assuming you want Footer on all pages
import Image from "next/image";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - Njenga Ngugi</title>
        <meta
          name="description"
          content="Learn more about Njenga Ngugi, the artist, their journey, and artistic philosophy."
        />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
                About the Artist
              </h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Njenga Ngugi
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Njenga Ngugi is a contemporary African artist whose work delves
                into the rich tapestry of culture, memory, and identity. With
                over 15 years of experience, Njenga's unique perspective bridges
                traditional artistry with modern expression, creating pieces
                that resonate deeply with viewers.
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                Known for their evocative use of color and texture, Njenga's art
                often explores themes of heritage, urban landscapes, and the
                human condition. Their work has been featured in over 50 major
                exhibitions worldwide, garnering critical acclaim for its
                profound storytelling and innovative techniques.
              </p>
              <div className="mt-8 flex justify-center md:justify-start space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">15+</p>
                  <p className="text-sm text-gray-500">Years Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">50+</p>
                  <p className="text-sm text-gray-500">Exhibitions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">200+</p>
                  <p className="text-sm text-gray-500">Artworks</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              {/* Placeholder image for the artist */}
              <Image
                src="https://placehold.co/400x500.png?text=Artist+Photo" // Placeholder image
                alt="Njenga Ngugi - The Artist"
                width={400}
                height={500}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
