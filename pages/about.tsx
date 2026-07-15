import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import StatCounter from "@/components/Animations/StatCounter";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import toast from "react-hot-toast";

const followFetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed");
  }
  return body.data as { following: boolean };
};

export default function AboutPage() {
  const { data: session, status } = useSession();
  const [followBusy, setFollowBusy] = useState(false);
  const loggedIn = !!session?.user;

  const { data: followData, mutate: mutateFollow } = useSWR(
    loggedIn ? "/api/subscribe/follow" : null,
    followFetcher
  );

  const handleFollow = async () => {
    if (!session?.user) {
      toast.error("Sign in to follow");
      return;
    }
    setFollowBusy(true);
    try {
      const following = followData?.following;
      const res = await fetch("/api/subscribe/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: following ? undefined : JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Could not update");
        return;
      }
      toast.success(following ? "Unfollowed" : "You're following the artist");
      await mutateFollow();
    } catch {
      toast.error("Could not update");
    } finally {
      setFollowBusy(false);
    }
  };

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

              <div className="mt-10 flex flex-col sm:flex-row items-center md:items-start gap-4">
                {status !== "loading" && session?.user ? (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={followBusy}
                    className="border border-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.24em] text-neutral-900 hover:bg-neutral-900 hover:text-white disabled:opacity-50"
                  >
                    {followBusy
                      ? "…"
                      : followData?.following
                        ? "Following — unfollow"
                        : "Follow the artist"}
                  </button>
                ) : (
                  <Link
                    href="/login?callbackUrl=%2Fabout"
                    className="border border-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.24em] text-neutral-900 hover:bg-neutral-900 hover:text-white"
                  >
                    Sign in to follow
                  </Link>
                )}
                {session?.user && (
                  <Link
                    href="/account"
                    className="font-display text-xs uppercase tracking-[0.24em] text-neutral-500 underline-offset-4 hover:underline py-3"
                  >
                    Your account →
                  </Link>
                )}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Image
                src="https://res.cloudinary.com/dq3wkbgts/image/upload/v1751641304/joj-artist_vkqvbv.jpg"
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
