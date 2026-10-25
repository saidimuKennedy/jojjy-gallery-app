import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
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

  const following = !!followData?.following;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>About - Njenga Ngugi</title>
        <meta
          name="description"
          content="Learn more about Njenga Ngugi, the artist, their journey, and artistic philosophy."
        />
      </Head>
      <Navbar />

      <main>
        {/* Biography */}
        <section className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-16 md:px-12 md:py-20 lg:px-16">
          <div className="max-w-xl">
            <p className="font-archive-body text-xs font-semibold uppercase tracking-[0.28em] text-neutral-600">
              Biography
            </p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[1.05] tracking-tight text-neutral-900 md:text-6xl">
              About the Artist
            </h1>
            <h2 className="mt-3 font-display text-3xl font-normal text-neutral-800">
              Njenga Ngugi
            </h2>
            <div className="mt-8 space-y-5 font-archive-body text-base leading-[1.75] text-neutral-700">
              <p>
                Njenga (b. 1996, Nairobi) creates raw, expressive works in
                charcoal, bleach, and pastel, blending abstraction and
                surrealism to explore the depths of the human psyche.
              </p>
              <p>
                Across visual art and music, his work invites viewers and
                listeners to engage with themes such as individuation, mental
                struggle, identity, growth and resilience.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-6">
              {status !== "loading" && session?.user ? (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followBusy}
                  className="min-h-[3rem] border border-neutral-900 bg-neutral-900 px-7 py-3 font-archive-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
                >
                  {followBusy
                    ? "…"
                    : following
                      ? "Following — unfollow"
                      : "Follow the artist"}
                </button>
              ) : (
                <Link
                  href="/login?callbackUrl=%2Fabout"
                  className="inline-flex min-h-[3rem] items-center border border-neutral-900 bg-neutral-900 px-7 py-3 font-archive-body text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-neutral-900"
                >
                  Sign in to follow
                </Link>
              )}
              {session?.user && (
                <Link
                  href="/account"
                  className="font-archive-body text-sm text-neutral-800 underline-offset-4 hover:underline"
                >
                  Your account
                </Link>
              )}
            </div>
          </div>

          <div className="relative aspect-[11/10] overflow-hidden bg-neutral-900">
            <Image
              src="https://res.cloudinary.com/dq3wkbgts/image/upload/v1751641304/joj-artist_vkqvbv.jpg"
              alt="Njenga Ngugi - The Artist"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-[50%_20%]"
            />
          </div>
        </section>

        {/* Practice */}
        <section className="border-t border-neutral-200">
          <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-16 md:px-12 md:py-20 lg:px-16">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl font-medium tracking-tight text-neutral-900 md:text-5xl">
                Practice
              </h2>
              <p className="mt-5 font-archive-body text-base leading-[1.75] text-neutral-700">
                His studio practice begins intuitively — water, ink, and bleach
                create a chaotic foundation, then charcoal and pastel bring
                form, uncovering subconscious stories in every layer. The
                result is a visual language that moves between figuration and
                abstraction, vulnerability and strength.
              </p>
              <SectionLink href="/portfolio">Explore the art</SectionLink>
            </div>
            <div className="relative aspect-[2/1] overflow-hidden bg-neutral-900">
              <Image
                src="/images/studio/about-practice.jpg"
                alt="The studio, with works in progress"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Selected history */}
        <section className="border-t border-neutral-200">
          <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-16 md:px-12 md:py-20 lg:px-16">
            <div className="relative aspect-[9/5] overflow-hidden bg-neutral-900 md:order-1">
              <Image
                src="/images/studio/about-history.jpg"
                alt="Detail of a charcoal and pastel work"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="max-w-xl md:order-2">
              <h2 className="font-display text-4xl font-medium tracking-tight text-neutral-900 md:text-5xl">
                Selected History
              </h2>
              <p className="mt-5 font-archive-body text-base leading-[1.75] text-neutral-700">
                Since 2017, his work has appeared in the Kenya Art Fair and the
                Nairobi National Museum Affordable Art Show. He has
                participated in group exhibitions including A Bad Idea (Nafasi
                Art Gallery, 2019), Shadows (Brush‑tu Art Studio, 2022), and
                Hidden Treasures (Gravitart Gallery, 2024). His debut solo
                exhibition, Dark Clouds Bring Waters, was held at Kamene
                Cultural Centre in 2025.
              </p>
              <SectionLink href="/events">View exhibitions</SectionLink>
            </div>
          </div>
        </section>

        {/* Also a musician */}
        <section className="border-t border-neutral-200">
          <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-6 py-14 md:grid-cols-2 md:gap-16 md:px-12 md:py-20 lg:px-16">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl font-medium tracking-tight text-neutral-900 md:text-5xl">
                Also a Musician
              </h2>
              <p className="mt-5 font-archive-body text-base leading-[1.75] text-neutral-700">
                Alongside his visual art, Njenga creates music — another way to
                explore the same questions. His soundscapes and songs extend
                the themes of his visual work, giving voice to what cannot
                always be seen.
              </p>
              <SectionLink href="/music">Listen in Music</SectionLink>
            </div>
            <div className="relative aspect-[11/5] overflow-hidden bg-neutral-900">
              <Image
                src="/images/studio/about-music.jpg"
                alt="The music corner of the studio"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-7 inline-flex items-center gap-3 font-archive-body text-xs font-medium uppercase tracking-[0.2em] text-neutral-900 hover:underline underline-offset-4"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}
