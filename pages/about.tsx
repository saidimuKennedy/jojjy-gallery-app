import React from "react";
import Head from "next/head";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import StatCounter from "@/components/Animations/StatCounter";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/Admin/AdminDashboard";

export default function AboutPage() {
  const { data: session, status } = useSession();

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
              <p className="font-display text-xs uppercase tracking-[0.28em] text-gray-500 mb-4">
                Biography
              </p>
              <h1 className="font-display text-4xl font-light tracking-tight text-gray-900 mb-3 md:text-5xl">
                About the Artist
              </h1>
              <h2 className="font-display text-2xl font-light text-gray-600 mb-8 md:text-3xl">
                Njenga Ngugi
              </h2>
              <div className="max-w-xl space-y-4 text-sm font-light leading-relaxed text-gray-500 md:text-[0.9375rem] md:leading-[1.75]">
                <p>
                  Njenga (b. 1996, Nairobi) crafts raw, expressive pieces in
                  charcoal, bleach, and pastel, blending abstraction and
                  surrealism to explore the depths of the human psyche. His work
                  invites viewers to engage with themes such as individuation,
                  mental struggle, identity, growth and resilience.
                </p>
                <p>
                  Since 2017, his work has appeared in the Kenya Art Fair and
                  the Nairobi National Museum Affordable Art Show. He has
                  participated in group exhibitions including A Bad Idea
                  (Nafasi Art Gallery, 2019), Shadows (Brush‑tu Art Studio,
                  2022), and Hidden Treasures (Gravitart Gallery, 2024). His
                  debut solo exhibition, Dark Clouds Bring Waters, was held at
                  Kamene Cultural Centre in 2025.
                </p>
                <p>
                  His studio practice begins intuitively—water, ink, and bleach
                  create a chaotic foundation, then charcoal and pastel bring
                  form, uncovering subconscious stories in every layer. Featured
                  in Kenyan Arts Diary (2025) and profiled by Business Daily, he
                  continues exploring the interplay of mark and void.
                </p>
              </div>
              <div className="mt-8 flex justify-center md:justify-start space-x-6">
                <StatCounter end={15} label="Years of experience" />
                <StatCounter end={15} label="Exhibitions" />
                <StatCounter end={20} label="Artworks" />
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              {/* Artist Image */}
              <Image
                src="https://res.cloudinary.com/dq3wkbgts/image/upload/v1751641304/joj-artist_vkqvbv.jpg"
                alt="Njenga Ngugi - The Artist"
                width={400}
                height={500}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>

          {status !== "loading" && session?.user?.role === UserRole.ADMIN && (
            <>
              <hr className="my-16 border-gray-300" />{" "}
              {/* A clear visual separator */}
              <h2 className="text-2xl font-medium text-gray-900 mb-8 text-center">
                Artwork Management Panel
              </h2>
              <AdminDashboard />
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
