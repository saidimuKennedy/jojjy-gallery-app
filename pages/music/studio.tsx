import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate as globalMutate } from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  FileText,
  Music2,
  Play,
  Ticket,
  Users,
  Video,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import StudioJoinSection from "@/components/music/StudioJoinSection";
import { CHECKOUT_SUPPORT_COPY } from "@/lib/music/studio-defaults";
import {
  HERO_BODY,
  HERO_LABEL,
  HERO_MIN_HEIGHT,
  HERO_TITLE,
} from "@/lib/music/hero-styles";
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

const JOURNEY_ICONS = [Music2, FileText, Video, Users, Ticket];

type StudioTile = {
  key: string;
  title: string;
  meta: string;
  coverImage: string | null;
  href?: string;
  playable?: boolean;
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
    let welcome: "studio" | "release" | null = null;

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
          await Promise.all([
            globalMutate("/api/music/membership-plans"),
            globalMutate("/api/music/library"),
          ]);
          welcome = isPass ? "studio" : "release";
          setWelcomeType(welcome);
          setShowWelcome(true);
          toast.success(
            welcome === "studio" ? "Welcome to the Studio" : "Added to your library"
          );
        }
      } catch {
        if (!cancelled) toast.error("Could not confirm payment");
      } finally {
        if (!cancelled) {
          setConfirmingPayment(false);
          router.replace(
            welcome ? `/music/studio?welcomed=${welcome}` : "/music/studio",
            undefined,
            { shallow: true }
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, paymentReference, authStatus, router]);

  const content = data?.content;
  const inside = data?.insideStudio;

  const releaseTiles: StudioTile[] = (inside?.memberReleases ?? []).map((r) => ({
    key: `release-${r.id}`,
    title: r.title,
    meta: "Studio release",
    coverImage: r.coverImage,
    href: `/music/${r.slug}`,
    playable: true,
  }));
  const tiles = releaseTiles.slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>The Studio — Njenga Ngugi</title>
        <meta
          name="description"
          content="Step inside the studio — member-only releases, Studio notes and your member library."
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

      <main className="pb-24">
        {confirmingPayment && (
          <p className="px-5 py-6 text-center text-sm text-neutral-500">
            Confirming payment…
          </p>
        )}

        {isLoading && !confirmingPayment && (
          <p className="px-5 py-16 text-center text-neutral-500">Loading…</p>
        )}
        {error && (
          <p className="px-5 py-16 text-center text-red-600">
            {(error as Error).message}
          </p>
        )}

        {content && (
          <>
            {/* Hero */}
            <section className="relative isolate overflow-hidden">
              <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[62%]">
                <OptimizedImage
                  src="/images/studio/hero.jpg"
                  alt=""
                  fill
                  preset="full"
                  priority
                  sizes="(max-width: 768px) 100vw, 62vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/50 to-black/20 md:bg-gradient-to-r md:from-white md:from-[38%] md:via-white/70 md:via-[48%] md:to-transparent md:to-[66%]" />
              <div className={`mx-auto flex max-w-[1600px] items-center ${HERO_MIN_HEIGHT}`}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="w-full px-6 py-14 md:w-[48%] md:px-12 lg:px-16"
                >
                  <p className={`${HERO_LABEL} text-white/80 md:text-neutral-700`}>
                    The Studio
                  </p>
                  <h1 className={`mt-5 ${HERO_TITLE} text-white md:text-neutral-900`}>
                    {content.heroTitle}
                  </h1>
                  <p className={`mt-5 max-w-md ${HERO_BODY} text-white/90 md:text-neutral-800`}>
                    {content.heroSubtitle}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-6">
                    <a
                      href="#join-studio"
                      className="inline-flex min-h-[3rem] items-center border border-white bg-white px-8 py-3 font-archive-body text-xs font-medium tracking-[0.08em] text-neutral-900 transition-colors hover:bg-transparent hover:text-white md:border-neutral-900 md:bg-neutral-900 md:text-white md:hover:bg-transparent md:hover:text-neutral-900"
                    >
                      Join the Studio
                    </a>
                    <Link
                      href="/music"
                      className="inline-flex items-center gap-2 font-archive-body text-sm font-medium text-white underline-offset-4 hover:underline md:text-neutral-900"
                    >
                      Listen on Music
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </section>

            <div className="bg-white">
              {/* Benefits */}
              <section className="mx-auto max-w-[1600px] px-6 py-14 md:px-12 lg:px-16">
                <ul className="grid grid-cols-2 gap-y-10 md:grid-cols-5 md:gap-y-0">
                  {content.journeySteps.map((step, i) => {
                    const Icon = JOURNEY_ICONS[i % JOURNEY_ICONS.length];
                    return (
                      <li
                        key={`${step}-${i}`}
                        className={`pr-6 md:px-6 md:first:pl-0 ${
                          i > 0 ? "md:border-l md:border-neutral-300/70" : ""
                        }`}
                      >
                        <Icon
                          className="h-6 w-6 text-neutral-900"
                          strokeWidth={1.1}
                          aria-hidden
                        />
                        <p className="mt-4 font-archive-body text-sm font-semibold text-neutral-900">
                          {step}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Currently inside */}
              <section className="mx-auto max-w-[1600px] px-6 pt-6 md:px-12 lg:px-16">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-900 md:text-[2.1rem]">
                      Currently inside the Studio
                    </h2>
                    <p className="mt-1 font-archive-body text-sm text-neutral-600">
                      Member releases available now for Studio members.
                    </p>
                  </div>
                  <Link
                    href="/music/library"
                    className="hidden items-center gap-2 font-archive-body text-xs font-medium text-neutral-900 hover:underline sm:inline-flex"
                  >
                    View all Studio content
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>

                <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
                  {tiles.map((tile) => {
                    const body = (
                      <>
                        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
                          {tile.coverImage ? (
                            <OptimizedImage
                              src={tile.coverImage}
                              alt={tile.title}
                              fill
                              preset="card"
                              sizes="(max-width: 768px) 50vw, 20vw"
                              className="object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950" />
                          )}
                          {tile.playable && (
                            <span className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-900">
                              <Play
                                className="h-3.5 w-3.5 fill-current"
                                aria-hidden
                              />
                            </span>
                          )}
                        </div>
                        <p className="mt-3 font-archive-body text-sm font-medium text-neutral-900">
                          {tile.title}
                        </p>
                        <p className="mt-1 font-archive-body text-xs text-neutral-600">
                          {tile.meta}
                        </p>
                      </>
                    );
                    return (
                      <li key={tile.key}>
                        {tile.href ? (
                          <Link href={tile.href} className="group block">
                            {body}
                          </Link>
                        ) : (
                          <div className="group block">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {tiles.length === 0 && (
                  <p className="mt-8 font-archive-body text-sm text-neutral-500">
                    New Studio releases will appear here.
                  </p>
                )}
              </section>
            </div>

            {/* Journey band */}
            <section className="mt-16 grid bg-black text-white md:mt-20 md:grid-cols-[47%_1fr]">
              <div className="relative min-h-[260px] md:min-h-[340px]">
                <OptimizedImage
                  src="/images/studio/journey.jpg"
                  alt=""
                  fill
                  preset="full"
                  sizes="(max-width: 768px) 100vw, 47vw"
                  className="object-cover object-[30%_30%]"
                />
              </div>
              <div className="flex flex-col justify-center px-6 py-14 md:px-14 lg:px-20">
                <p className="font-archive-body text-xs uppercase tracking-[0.28em] text-white/60">
                  The Journey
                </p>
                <p className="mt-6 max-w-lg font-display text-4xl font-normal leading-[1.12] md:text-[2.6rem]">
                  {content.relationshipLead}
                </p>
                <p className="mt-6 max-w-md font-archive-body text-sm leading-relaxed text-white/80">
                  Join to be part of that journey.
                </p>
              </div>
            </section>

            <div className="bg-white">
              {/* Join */}
              <section className="mx-auto max-w-[1600px] px-6 pt-14 md:px-12 lg:px-16">
                <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-900 md:text-[2.1rem]">
                  Join the Studio
                </h2>
                <p className="mt-2 max-w-xl font-archive-body text-sm leading-relaxed text-neutral-600">
                  Choose how long you&apos;d like to stay close to the work.{" "}
                  {CHECKOUT_SUPPORT_COPY}
                </p>
                <div className="mt-8">
                  <StudioJoinSection
                    returnPath="/music/studio"
                    showSupportCopy={false}
                    variant="grid"
                  />
                </div>
              </section>

              {/* FAQ */}
              <section className="mx-auto grid max-w-[1600px] gap-8 px-6 pb-4 pt-20 md:grid-cols-[1fr_1.6fr] md:px-12 lg:px-16">
                <h2 className="font-display text-3xl font-medium text-neutral-900 md:text-[2.1rem]">
                  Questions
                </h2>
                <ul className="divide-y divide-neutral-300/70 border-y border-neutral-300/70">
                  {content.faq.map((item) => (
                    <li key={item.q}>
                      <details className="group py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-archive-body text-sm text-neutral-900 [&::-webkit-details-marker]:hidden">
                          {item.q}
                          <ChevronDown
                            className="h-4 w-4 shrink-0 text-neutral-600 transition-transform group-open:rotate-180"
                            aria-hidden
                          />
                        </summary>
                        <p className="mt-3 max-w-xl font-archive-body text-sm leading-relaxed text-neutral-600">
                          {item.a}
                        </p>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
