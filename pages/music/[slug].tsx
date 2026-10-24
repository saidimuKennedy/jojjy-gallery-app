import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate as globalMutate } from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Check, Pause, Play } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import BackLink from "@/components/ui/BackLink";
import StudioJoinCompact from "@/components/music/StudioJoinCompact";
import MusicWelcomeModal from "@/components/music/MusicWelcomeModal";
import LibrarySidebar, {
  LIBRARY_SWR_KEY,
} from "@/components/music/LibrarySidebar";
import {
  useMusicPlayer,
  type PlayerRelease,
} from "@/components/music/MusicPlayer";
import { releaseExperience } from "@/lib/music/experience";
import { readMusicPaymentReference } from "@/lib/paystack-callback";
import { formatDisplayPrice } from "@/lib/currency";
import { CHECKOUT_SUPPORT_COPY } from "@/lib/music/studio-defaults";

type Track = {
  id: number;
  title: string;
  trackNumber: number;
  duration: number | null;
};

type ViewerAccessState =
  | "free"
  | "owned"
  | "tease"
  | "locked"
  | "membership_required"
  | "unavailable";

type ViewerAccess = {
  state: ViewerAccessState;
  owned: boolean;
  isStudioMember: boolean;
  remainingTease: number | null;
  canPlay: boolean;
};

type ReleaseDetail = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  artistNotes: string | null;
  studioNotes: string | null;
  coverImage: string | null;
  artistName: string;
  releaseType: string;
  releaseDate: string | null;
  accessMode: string;
  price: number | null;
  currency: string;
  paidPlayLimit: number;
  tracks: Track[];
  viewerAccess: ViewerAccess;
};

function formatDuration(totalSeconds: number | null): string | null {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return null;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function releaseYear(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function readPaystackReference(
  reference: string | string[] | undefined,
  trxref: string | string[] | undefined
): string | undefined {
  return readMusicPaymentReference(reference, trxref);
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const raw = await res.text();
  if (
    res.headers.get("x-vercel-mitigated") === "challenge" ||
    raw.trimStart().startsWith("<!")
  ) {
    throw new Error(
      "Blocked by Vercel Security Checkpoint. Disable Attack Mode for this project, then reload."
    );
  }
  let body: { success?: boolean; message?: string; data?: ReleaseDetail };
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to load release (${res.status}): non-JSON response`);
  }
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load release");
  }
  return body.data as ReleaseDetail;
};

export default function MusicReleasePage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";
  const paymentReference = readPaystackReference(
    router.query.reference,
    router.query.trxref
  );
  const hasPaymentReturn = Boolean(
    router.query.reference || router.query.trxref
  );

  const { data: session, status: authStatus } = useSession();
  const { data: release, error, isLoading, mutate } = useSWR(
    slug ? `/api/music/releases/${slug}` : null,
    fetcher
  );

  const player = useMusicPlayer();
  const { setTone } = player;

  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentCheckError, setPaymentCheckError] = useState<string | null>(
    null
  );
  const [paymentCheckAttempt, setPaymentCheckAttempt] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const access = release?.viewerAccess;
  const experience = releaseExperience(access);
  const dark = experience !== "DISCOVERY";
  const owned = experience === "OWNED";
  const studio = experience === "STUDIO";
  const remainingTease =
    access?.state === "tease" ? access.remainingTease : access?.remainingTease;

  const playerRelease: PlayerRelease | null = useMemo(() => {
    if (!release) return null;
    return {
      id: release.id,
      slug: release.slug,
      title: release.title,
      artistName: release.artistName,
      coverImage: release.coverImage,
      tracks: release.tracks,
    };
  }, [release]);

  useEffect(() => {
    setTone(dark ? "dark" : "light");
  }, [dark, setTone]);

  // Drive the semantic experience into presentation via one class set.
  const t = {
    page: dark ? "min-h-screen bg-[#000] text-white" : "min-h-screen bg-white",
    heading: dark ? "text-white" : "text-neutral-900",
    secondary: dark ? "text-neutral-400" : "text-neutral-500",
    body: dark ? "text-neutral-300" : "text-neutral-600",
    border: dark ? "border-neutral-800" : "border-neutral-100",
    strongBorder: dark ? "border-neutral-800" : "border-neutral-200",
    trackHover: dark ? "hover:bg-neutral-900" : "hover:bg-neutral-50",
    trackText: dark ? "text-neutral-200" : "text-neutral-800",
    iconButton: dark
      ? "border-white/70 text-white hover:bg-white hover:text-neutral-950"
      : "border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white",
  };

  useEffect(() => {
    if (!router.isReady || !hasPaymentReturn || !slug) return;
    if (authStatus === "loading") return;
    if (!paymentReference) {
      setPaymentCheckError(
        "The payment reference could not be read. Please contact support before trying to pay again."
      );
      return;
    }
    if (authStatus === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    let cancelled = false;
    let paymentConfirmed = false;
    let verifiedRedirectPath: string | null = null;

    (async () => {
      setConfirmingPayment(true);
      setPaymentCheckError(null);
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: paymentReference }),
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          const message =
            body.data?.paymentStatus === "NEEDS_ATTENTION"
              ? "Payment was received, but the order needs review. Please contact support and do not pay again."
              : "We couldn’t confirm this payment yet. Check again before trying to pay again.";
          setPaymentCheckError(message);
          toast.error(body.message || "Could not confirm payment");
          return;
        }
        if (body.data?.status === "PAID") {
          paymentConfirmed = true;
          const isPass = body.data.items?.some(
            (i: { itemType: string }) => i.itemType === "MEMBERSHIP_PASS"
          );
          await globalMutate("/api/music/membership-plans");
          await globalMutate(LIBRARY_SWR_KEY);
          if (isPass) {
            toast.success("Welcome to the Studio");
            verifiedRedirectPath = "/music/studio?welcomed=studio";
            return;
          }
          setShowWelcome(true);
          toast.success("Added to your library");
          await mutate();
        } else {
          setPaymentCheckError(
            "Payment is still being confirmed. Check again before trying to pay again."
          );
        }
      } catch {
        if (!cancelled) {
          setPaymentCheckError(
            "We couldn’t reach the payment checker. Check again before trying to pay again."
          );
          toast.error("Could not confirm payment");
        }
      } finally {
        if (!cancelled) {
          setConfirmingPayment(false);
          if (paymentConfirmed) {
            router.replace(
              verifiedRedirectPath ?? `/music/${slug}`,
              undefined,
              { shallow: !verifiedRedirectPath }
            );
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    paymentReference,
    hasPaymentReturn,
    slug,
    authStatus,
    paymentCheckAttempt,
    router,
    mutate,
  ]);

  const playTrackId = async (trackId: number) => {
    if (!release || !playerRelease) return;
    if (access && !access.canPlay && !owned && !studio) {
      toast.error(
        access.state === "locked"
          ? "Preview ended — unlock to keep listening"
          : access.state === "membership_required"
            ? "Join the Studio to listen"
            : "Playback unavailable"
      );
      return;
    }
    setBusy(true);
    const outcome = await player.play({
      release: playerRelease,
      trackId,
    });
    setBusy(false);
    if (!outcome.ok) {
      if (outcome.reason === "purchase_required") {
        await mutate();
      }
      if (outcome.message) toast.error(outcome.message);
      return;
    }
    if (outcome.remainingTease != null) {
      const next = outcome.remainingTease;
      await mutate(
        (current) =>
          current
            ? {
                ...current,
                viewerAccess: {
                  ...current.viewerAccess,
                  state: next === 0 ? "locked" : "tease",
                  remainingTease: next,
                  canPlay: next !== 0,
                  isStudioMember: current.viewerAccess.isStudioMember,
                },
              }
            : current,
        { revalidate: false }
      );
    } else if (access?.state === "tease" || access?.state === "owned") {
      await mutate();
    }
  };

  const playingThisRelease =
    !!release && player.release?.id === release.id && player.isPlaying;
  const playingThisTrackId =
    release && player.release?.id === release.id ? player.track?.id ?? null : null;

  const toggleRelease = () => {
    if (!release) return;
    if (playingThisRelease) {
      player.toggle();
      return;
    }
    if (release.tracks.length > 0) {
      void playTrackId(release.tracks[0].id);
    }
  };

  const toggleTrack = (trackId: number) => {
    if (
      release &&
      player.release?.id === release.id &&
      playingThisTrackId === trackId &&
      player.isPlaying
    ) {
      player.toggle();
      return;
    }
    void playTrackId(trackId);
  };

  const handleUnlock = async () => {
    if (!release) return;
    if (authStatus === "loading") return;
    if (!session?.user) {
      toast.error("Sign in to unlock");
      router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (access?.owned) {
      toast.success("Already in your library");
      return;
    }

    setCheckoutBusy(true);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ releaseId: release.id }],
          paymentProvider: "PAYSTACK",
          returnPath: `/music/${release.slug}`,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || "Checkout failed");
        return;
      }
      if (body.data?.authorizationUrl) {
        window.location.href = body.data.authorizationUrl as string;
        return;
      }
      toast.error("Payment could not be started");
    } catch {
      toast.error("Checkout failed");
    } finally {
      setCheckoutBusy(false);
    }
  };

  const showUnlockCta =
    !hasPaymentReturn &&
    release?.accessMode === "PAID" &&
    access &&
    (access.state === "locked" || access.state === "tease");

  const playDisabled =
    busy || confirmingPayment || (access != null && !access.canPlay && !owned && !studio);

  const hasTracks = (release?.tracks.length ?? 0) > 0;

  const autoplayed = useRef(false);
  useEffect(() => {
    if (router.query.autoplay !== "1" || autoplayed.current) return;
    if (!router.isReady || !release || !access) return;
    autoplayed.current = true;
    void router.replace(`/music/${slug}`, undefined, { shallow: true });
    if (release.tracks.length > 0 && access.canPlay) {
      void playTrackId(release.tracks[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, slug, release, access]);

  const showSidebar = authStatus === "authenticated";

  return (
    <div className={t.page}>
      <Head>
        <title>
          {release ? `${release.title} — Music` : "Music — Jojjy Gallery"}
        </title>
      </Head>
      <Navbar />

      {showWelcome && release && (
        <MusicWelcomeModal
          type="release"
          title={release.title}
          onClose={() => setShowWelcome(false)}
          onListen={() => {
            if (release.tracks.length > 0) {
              void playTrackId(release.tracks[0].id);
            }
          }}
        />
      )}

      <div
        className={`mx-auto max-w-[1600px] ${
          showSidebar ? "lg:grid lg:grid-cols-[300px_1fr]" : ""
        }`}
      >
        {showSidebar && (
          <aside
            className={`hidden border-r lg:block ${t.border}`}
            aria-label="Your library"
          >
            <div className="sticky top-0 h-screen overflow-y-auto px-6 py-8">
              <LibrarySidebar tone={dark ? "dark" : "light"} />
            </div>
          </aside>
        )}

        <main className="px-6 pb-28 pt-10 md:px-10 md:pt-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackLink href="/music" tone={dark ? "dark" : "light"}>
              Back to Music
            </BackLink>
            {!showSidebar && (
              <Link
                href="/music/library"
                className={`inline-flex min-h-[2.75rem] items-center justify-center px-5 py-2.5 font-archive-body text-xs font-medium uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  dark
                    ? "bg-white text-neutral-950 hover:bg-neutral-200 focus-visible:outline-white"
                    : "bg-neutral-900 text-white hover:bg-neutral-700 focus-visible:outline-neutral-900"
                }`}
              >
                Your library
              </Link>
            )}
            {showSidebar && (
              <Link
                href="/music/library"
                className={`inline-flex min-h-[2.75rem] items-center justify-center px-5 py-2.5 font-archive-body text-xs font-medium uppercase tracking-[0.18em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden ${
                  dark
                    ? "bg-white text-neutral-950 hover:bg-neutral-200 focus-visible:outline-white"
                    : "bg-neutral-900 text-white hover:bg-neutral-700 focus-visible:outline-neutral-900"
                }`}
              >
                Your library
              </Link>
            )}
          </div>

          {hasPaymentReturn && (
            <div
              role="status"
              className={`mt-8 max-w-xl border p-5 ${t.strongBorder}`}
            >
              <p className={`text-sm leading-relaxed ${t.body}`}>
                {confirmingPayment
                  ? "We’re checking your payment. Please don’t pay again while this check is in progress."
                  : paymentCheckError || "Your payment is not confirmed yet."}
              </p>
              {!confirmingPayment && paymentReference && (
                <button
                  type="button"
                  onClick={() =>
                    setPaymentCheckAttempt((attempt) => attempt + 1)
                  }
                  className={`mt-4 inline-flex min-h-[2.75rem] items-center border px-5 py-3 font-display text-xs uppercase tracking-[0.2em] transition-colors ${
                    dark
                      ? "border-white text-white hover:bg-white hover:text-neutral-950"
                      : "border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  Check payment again
                </button>
              )}
            </div>
          )}

          {isLoading && !confirmingPayment && (
            <p className={`mt-12 ${t.secondary}`}>Loading…</p>
          )}
          {error && (
            <p className={`mt-12 ${dark ? "text-red-400" : "text-red-600"}`}>
              {(error as Error).message}
            </p>
          )}

          {release && access && (
            <div className="mt-8">
              <div className="grid gap-10 md:grid-cols-[minmax(0,420px)_1fr] md:gap-14">
                <div
                  className={`relative aspect-square overflow-hidden ${dark ? "bg-neutral-900" : "bg-neutral-100"}`}
                >
                  {release.coverImage ? (
                    <OptimizedImage
                      src={release.coverImage}
                      alt={release.title}
                      fill
                      preset="card"
                      priority
                      sizes="(max-width: 768px) 100vw, 420px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-xs uppercase tracking-[0.2em] ${t.secondary}`}
                  >
                    {release.releaseType.replace(/_/g, " ")}
                    {releaseYear(release.releaseDate)
                      ? ` · ${releaseYear(release.releaseDate)}`
                      : ""}
                  </p>
                  <h1
                    className={`mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl ${t.heading}`}
                  >
                    {release.title}
                  </h1>
                  <p className={`mt-2 ${t.secondary}`}>{release.artistName}</p>

                  {owned && (
                    <p className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-300">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Yours
                    </p>
                  )}
                  {studio && (
                    <p className={`mt-4 text-sm ${t.secondary}`}>
                      Studio Access
                      {access.isStudioMember
                        ? " · included with your membership"
                        : ""}
                    </p>
                  )}

                  {release.description && (
                    <p className={`mt-6 leading-relaxed ${t.body}`}>
                      {release.description}
                    </p>
                  )}

                  {/* Listening controls */}
                  {hasTracks && (
                    <div className="mt-7 flex items-center gap-4">
                      <button
                        type="button"
                        disabled={playDisabled}
                        onClick={toggleRelease}
                        aria-label={
                          playingThisRelease
                            ? `Pause ${release.title}`
                            : `Play ${release.title}`
                        }
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          dark
                            ? "bg-white text-neutral-950 hover:bg-neutral-200 focus-visible:outline-white"
                            : "bg-neutral-900 text-white hover:bg-neutral-700 focus-visible:outline-neutral-900"
                        }`}
                      >
                        {playingThisRelease ? (
                          <Pause className="h-6 w-6 fill-current" aria-hidden="true" />
                        ) : (
                          <Play className="h-6 w-6 fill-current" aria-hidden="true" />
                        )}
                      </button>
                      {access.state === "tease" &&
                        remainingTease != null &&
                        !owned && (
                          <p className={`text-sm ${t.secondary}`}>
                            Preview · {remainingTease} of {release.paidPlayLimit}{" "}
                            free {remainingTease === 1 ? "play" : "plays"} left
                          </p>
                        )}
                      {access.state === "locked" && !owned && (
                        <p className={`text-sm ${t.secondary}`}>
                          Preview ended — unlock for full listening.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Discovery: acquire */}
                  {showUnlockCta && release.price != null && (
                    <div className="mt-8">
                      {confirmUnlock ? (
                        <div className={`max-w-md space-y-3 border p-5 ${t.strongBorder}`}>
                          <p className={`text-sm leading-relaxed ${t.body}`}>
                            {CHECKOUT_SUPPORT_COPY}
                          </p>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setConfirmUnlock(false)}
                              className={`min-h-[2.75rem] px-4 py-3 text-xs uppercase tracking-widest ${t.secondary}`}
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              disabled={checkoutBusy || confirmingPayment}
                              onClick={handleUnlock}
                              className={`inline-flex min-h-[2.75rem] flex-1 items-center justify-center border px-6 py-3 font-display text-xs uppercase tracking-[0.22em] transition-colors disabled:opacity-50 ${
                                dark
                                  ? "border-white bg-white text-neutral-950 hover:bg-transparent hover:text-white"
                                  : "border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900"
                              }`}
                            >
                              {checkoutBusy
                                ? "Redirecting…"
                                : `Continue · ${formatDisplayPrice(release.price)}`}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={checkoutBusy || confirmingPayment}
                          onClick={() => {
                            if (!session?.user) {
                              toast.error("Sign in to unlock");
                              router.push(
                                `/login?callbackUrl=${encodeURIComponent(router.asPath)}`
                              );
                              return;
                            }
                            setConfirmUnlock(true);
                          }}
                          className={`inline-flex min-h-[3rem] w-full items-center justify-center border px-8 py-4 font-display text-xs uppercase tracking-[0.24em] transition-colors disabled:opacity-50 sm:w-auto ${
                            dark
                              ? "border-white bg-white text-neutral-950 hover:bg-transparent hover:text-white"
                              : "border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900"
                          }`}
                        >
                          Unlock release — {formatDisplayPrice(release.price)}
                        </button>
                      )}
                      {!session && !confirmUnlock && (
                        <p className={`mt-2 text-sm ${t.body}`}>
                          Sign in to add this release to your library. Unlocks
                          stay in your account.
                        </p>
                      )}
                      {access?.isStudioMember && (
                        <p className={`mt-2 text-sm ${t.body}`}>
                          Studio members still unlock paid releases individually
                          — membership covers member-only releases.
                        </p>
                      )}
                    </div>
                  )}

                  {release.accessMode === "MEMBERS_ONLY" &&
                    access.state === "membership_required" && (
                      <div className="mt-8">
                        <StudioJoinCompact
                          returnPath={`/music/${release.slug}`}
                        />
                      </div>
                    )}
                </div>
              </div>

              {/* Track list — spans the content width */}
              {hasTracks ? (
                <ol
                  className={`mt-12 border-t ${t.border} divide-y ${dark ? "divide-neutral-800" : "divide-neutral-100"}`}
                >
                  {release.tracks.map((tr) => {
                    const isThisTrack =
                      playingThisTrackId === tr.id && player.isPlaying;
                    const trackDuration = formatDuration(tr.duration);
                    return (
                      <li key={tr.id}>
                        <button
                          type="button"
                          disabled={playDisabled}
                          onClick={() => toggleTrack(tr.id)}
                          aria-label={`${isThisTrack ? "Pause" : "Play"} ${tr.title}`}
                          className={`flex min-h-[3.5rem] w-full items-center gap-4 py-3 text-left transition disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${t.trackHover} ${
                            dark
                              ? "focus-visible:outline-white"
                              : "focus-visible:outline-neutral-900"
                          }`}
                        >
                          <span
                            className={`w-6 shrink-0 text-center text-sm tabular-nums ${t.secondary}`}
                          >
                            {tr.trackNumber}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${t.trackText}`}>
                            {tr.title}
                          </span>
                          {trackDuration && (
                            <span
                              className={`shrink-0 text-sm tabular-nums ${t.secondary}`}
                            >
                              {trackDuration}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className={`mt-12 border p-5 ${t.strongBorder}`}>
                  <p className={`text-sm font-medium ${t.heading}`}>
                    No tracks yet
                  </p>
                  <p className={`mt-1 text-sm ${t.body}`}>
                    Preview is unavailable until tracks are added to this
                    release.
                  </p>
                </div>
              )}

              {release.artistNotes && (
                <div className={`mt-12 border-t pt-8 ${t.border}`}>
                  <p
                    className={`font-display text-xs uppercase tracking-[0.2em] ${t.secondary}`}
                  >
                    Artist notes
                  </p>
                  <p
                    className={`mt-4 max-w-3xl whitespace-pre-wrap leading-relaxed ${t.body}`}
                  >
                    {release.artistNotes}
                  </p>
                </div>
              )}

              {release.studioNotes && (
                <div className={`mt-8 border-t pt-8 ${t.border}`}>
                  <p
                    className={`font-display text-xs uppercase tracking-[0.2em] ${t.secondary}`}
                  >
                    Studio notes
                  </p>
                  <p className={`mt-1 text-xs ${t.secondary}`}>
                    For Studio members and owners
                  </p>
                  <p
                    className={`mt-4 max-w-3xl whitespace-pre-wrap leading-relaxed ${t.body}`}
                  >
                    {release.studioNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer tone={dark ? "dark" : "light"} />
    </div>
  );
}
