import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate as globalMutate } from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Camera, Music, Palette, Ticket } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import StudioJoinSection from "@/components/music/StudioJoinSection";
import MusicWelcomeModal from "@/components/music/MusicWelcomeModal";

type StudioPayload = {
  content: {
    heroTitle: string;
    heroSubtitle: string;
    relationshipLead: string;
    journeySteps: string[];
    faq: Array<{ q: string; a: string }>;
  };
  insideStudio: {
    memberReleaseCount: number;
    memberReleases: Array<{
      id: number;
      slug: string;
      title: string;
      coverImage: string | null;
    }>;
    earlyAccessCount: number;
  };
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load studio");
  }
  return body.data as StudioPayload;
};

export default function MusicStudioPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const paymentReference =
    typeof router.query.reference === "string"
      ? router.query.reference
      : undefined;
  const welcomed =
    router.query.welcomed === "studio" || router.query.welcomed === "release";

  const { data, error, isLoading } = useSWR("/api/music/studio", fetcher);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeType, setWelcomeType] = useState<"studio" | "release">("studio");

  useEffect(() => {
    if (welcomed) {
      setWelcomeType(router.query.welcomed === "release" ? "release" : "studio");
      setShowWelcome(true);
    }
  }, [welcomed, router.query.welcomed]);

  useEffect(() => {
    if (!router.isReady || !paymentReference) return;
    if (authStatus === "loading") return;
    if (authStatus === "unauthenticated") {
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(router.asPath)}`
      );
      return;
    }

    let cancelled = false;

    (async () => {
      setConfirmingPayment(true);
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: paymentReference }),
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          toast.error(body.message || "Could not confirm payment");
          return;
        }
        if (body.data?.status === "PAID") {
          const isPass = body.data.items?.some(
            (i: { itemType: string }) => i.itemType === "MEMBERSHIP_PASS"
          );
          await globalMutate("/api/music/membership-plans");
          setWelcomeType(isPass ? "studio" : "release");
          setShowWelcome(true);
          toast.success(
            isPass ? "Welcome to the Studio" : "Added to your collection"
          );
        }
      } catch {
        if (!cancelled) toast.error("Could not confirm payment");
      } finally {
        if (!cancelled) {
          setConfirmingPayment(false);
          router.replace("/music/studio?welcomed=studio", undefined, {
            shallow: true,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, paymentReference, authStatus, router]);

  const content = data?.content;
  const inside = data?.insideStudio;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>The Studio — Njenga Ngugi</title>
        <meta
          name="description"
          content="Step inside the studio — early music and member releases before they go wider."
        />
      </Head>
      <Navbar />

      {showWelcome && (
        <MusicWelcomeModal
          type={welcomeType}
          onClose={() => {
            setShowWelcome(false);
            router.replace("/music/studio", undefined, { shallow: true });
          }}
        />
      )}

      <main className="px-5 pb-24 pt-14 md:px-10 md:pt-20 lg:px-16 lg:pb-32">
        {confirmingPayment && (
          <p className="mb-8 text-center text-sm text-neutral-500">
            Confirming payment…
          </p>
        )}

        {isLoading && !confirmingPayment && (
          <p className="text-center text-neutral-400">Loading…</p>
        )}
        {error && (
          <p className="text-center text-red-600">{(error as Error).message}</p>
        )}

        {content && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-3xl text-center"
            >
              <p className="font-display text-xs uppercase tracking-[0.32em] text-neutral-400">
                The Studio
              </p>
              <h1 className="mt-6 font-display text-5xl font-light tracking-tight text-neutral-900 md:text-6xl lg:text-7xl">
                {content.heroTitle}
              </h1>
              <p className="mx-auto mt-8 max-w-xl font-archive-body text-lg leading-[1.75] text-neutral-600 md:text-[1.125rem]">
                {content.heroSubtitle}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="#join-studio"
                  className="inline-flex border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-neutral-900"
                >
                  Join the Studio
                </a>
                <Link
                  href="/music"
                  className="font-display text-xs uppercase tracking-[0.24em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                >
                  Listen on Music →
                </Link>
              </div>
            </motion.section>

            <section className="mx-auto mt-24 max-w-2xl md:mt-32">
              <p className="font-archive-body text-lg leading-relaxed text-neutral-700 md:text-xl">
                {content.relationshipLead}
              </p>
              <ul className="mt-12 space-y-0 border-l border-neutral-200 pl-8">
                {content.journeySteps.map((step, i) => (
                  <li
                    key={step}
                    className="relative pb-10 font-display text-lg font-light text-neutral-800 last:pb-0"
                  >
                    <span className="absolute -left-[2.125rem] top-1.5 h-2 w-2 rounded-full bg-neutral-900" />
                    {step}
                    {i < content.journeySteps.length - 1 && (
                      <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-neutral-300">
                        ↓
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mx-auto mt-24 max-w-4xl border-t border-neutral-200 pt-16 md:mt-32 md:pt-20">
              <h2 className="font-display text-3xl font-light text-neutral-900 md:text-4xl">
                Currently inside the Studio
              </h2>
              <p className="mt-4 text-neutral-600">
                What members can reach right now — updated as new work arrives.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="border border-neutral-200 p-6">
                  <Music className="h-6 w-6 text-neutral-900" strokeWidth={1.25} aria-hidden />
                  <p className="mt-3 font-display text-xl text-neutral-900">
                    {inside?.memberReleaseCount ?? 0} member{" "}
                    {(inside?.memberReleaseCount ?? 0) === 1
                      ? "release"
                      : "releases"}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Unreleased to the public catalogue
                  </p>
                </div>
                <div className="border border-neutral-200 p-6">
                  <Palette className="h-6 w-6 text-neutral-900" strokeWidth={1.25} aria-hidden />
                  <p className="mt-3 font-display text-xl text-neutral-900">
                    Early access window
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    {inside?.earlyAccessCount ?? 0} releases in the exclusive
                    window
                  </p>
                </div>
                <div className="border border-neutral-200 p-6">
                  <Camera className="h-6 w-6 text-neutral-900" strokeWidth={1.25} aria-hidden />
                  <p className="mt-3 font-display text-xl text-neutral-900">
                    Studio notes
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    Context and stories on select releases
                  </p>
                </div>
                <div className="border border-neutral-200 p-6">
                  <Ticket className="h-6 w-6 text-neutral-900" strokeWidth={1.25} aria-hidden />
                  <p className="mt-3 font-display text-xl text-neutral-900">
                    Priority access
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">
                    First in line for studio events
                  </p>
                </div>
              </div>

              {(inside?.memberReleases.length ?? 0) > 0 && (
                <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {inside!.memberReleases.map((r) => (
                    <li key={r.id}>
                      <Link href={`/music/${r.slug}`} className="group block">
                        <div className="relative aspect-square bg-neutral-100">
                          {r.coverImage ? (
                            <OptimizedImage
                              src={r.coverImage}
                              alt={r.title}
                              fill
                              preset="card"
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover transition duration-500 group-hover:scale-[1.02]"
                            />
                          ) : null}
                        </div>
                        <p className="mt-3 font-display text-lg text-neutral-900">
                          {r.title}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                          Inside the Studio
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mx-auto mt-24 max-w-2xl border-t border-neutral-200 pt-16 md:mt-32 md:pt-20">
              <h2 className="font-display text-3xl font-light text-neutral-900">
                The journey
              </h2>
              <p className="mt-4 text-neutral-600">
                You&apos;re hearing it at the beginning.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3 font-display text-sm uppercase tracking-[0.18em] text-neutral-700">
                <span>Idea</span>
                <span className="text-neutral-300">→</span>
                <span className="text-neutral-900">Studio Members</span>
                <span className="text-neutral-300">→</span>
                <span>Paid Release</span>
                <span className="text-neutral-300">→</span>
                <span className="text-neutral-400">Spotify / YouTube</span>
              </div>
            </section>

            <section className="mx-auto mt-24 max-w-2xl border-t border-neutral-200 pt-16 md:mt-32 md:pt-20">
              <h2 className="font-display text-3xl font-light text-neutral-900">
                Join the Studio
              </h2>
              <p className="mt-4 text-neutral-600">
                Choose how long you&apos;d like to stay close to the work.
              </p>
              <div className="mt-10">
                <StudioJoinSection returnPath="/music/studio" />
              </div>
            </section>

            <section className="mx-auto mt-20 max-w-2xl">
              <h3 className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
                Questions
              </h3>
              <ul className="mt-8 space-y-8">
                {content.faq.map((item) => (
                  <li key={item.q}>
                    <p className="font-display text-lg text-neutral-900">
                      {item.q}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {item.a}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
