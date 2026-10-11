import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate as globalMutate } from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Pause, Play } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import BackLink from "@/components/ui/BackLink";
import StudioJoinCompact from "@/components/music/StudioJoinCompact";
import MusicWelcomeModal from "@/components/music/MusicWelcomeModal";
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

function readPaystackReference(
  reference: string | string[] | undefined,
  trxref: string | string[] | undefined
): string | undefined {
  const values = [reference, trxref]
    .flatMap((value) => (Array.isArray(value) ? value : [value ?? ""]))
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueValues = [...new Set(values)];
  return uniqueValues.length === 1 ? uniqueValues[0] : undefined;
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

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamTrackId, setStreamTrackId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayed = useRef(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentCheckError, setPaymentCheckError] = useState<string | null>(null);
  const [paymentCheckAttempt, setPaymentCheckAttempt] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const access = release?.viewerAccess;
  const remainingTease =
    access?.state === "tease" ? access.remainingTease : access?.remainingTease;

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
      router.replace(
        `/login?callbackUrl=${encodeURIComponent(router.asPath)}`
      );
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
          if (isPass) {
            toast.success("Welcome to the Studio");
            verifiedRedirectPath = "/music/studio?welcomed=studio";
            return;
          }
          setShowWelcome(true);
          toast.success("Added to your collection");
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

  const playTrack = async (trackId: number) => {
    if (!release) return;
    if (access && !access.canPlay) {
      setPlayError(
        access.state === "locked"
          ? "Preview ended — unlock to keep listening"
          : access.state === "membership_required"
            ? "Join the Studio to listen — see options below"
            : "Playback unavailable"
      );
      return;
    }
    setBusy(true);
    setPlayError(null);
    try {
      const res = await fetch("/api/music/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ releaseId: release.id, trackId }),
      });
      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      if (
        res.headers.get("x-vercel-mitigated") === "challenge" ||
        (raw.trimStart().startsWith("<!") && !contentType.includes("application/json"))
      ) {
        throw new Error(
          "Playback blocked by Vercel Security Checkpoint. Disable Attack Mode (or WAF challenge rules) for this project, then retry."
        );
      }
      let json: {
        success?: boolean;
        message?: string;
        reason?: string;
        data?: { streamUrl: string; remainingTease?: number | null };
      };
      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error(
          `Playback failed (${res.status}): server returned non-JSON`
        );
      }
      if (!res.ok) {
        if (json.reason === "purchase_required") {
          await mutate();
        }
        throw new Error(json.message || "Playback denied");
      }
      if (!json.data?.streamUrl) {
        throw new Error("Playback denied");
      }
      setStreamUrl(json.data.streamUrl);
      setStreamTrackId(trackId);
      setPlayingId(trackId);
      setCurrentTime(0);
      setAudioDuration(null);
      if (json.data.remainingTease != null) {
        const nextRemaining = json.data.remainingTease;
        await mutate(
          (current) =>
            current
              ? {
                  ...current,
                  viewerAccess: {
                    ...current.viewerAccess,
                    state: nextRemaining === 0 ? "locked" : "tease",
                    remainingTease: nextRemaining,
                    canPlay: nextRemaining !== 0,
                    isStudioMember: current.viewerAccess.isStudioMember,
                  },
                }
              : current,
          { revalidate: false }
        );
      } else if (access?.state === "tease" || access?.state === "owned") {
        await mutate();
      }
    } catch (e) {
      setPlayError((e as Error).message);
      setStreamUrl(null);
      setPlayingId(null);
    } finally {
      setBusy(false);
    }
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
      toast.success("Already in your collection");
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
    busy || confirmingPayment || (access != null && !access.canPlay);

  const hasTracks = (release?.tracks.length ?? 0) > 0;

  const toggleTrack = (trackId: number) => {
    if (playingId === trackId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (streamUrl && streamTrackId === trackId) {
      void audioRef.current?.play();
      setPlayingId(trackId);
      return;
    }
    void playTrack(trackId);
  };

  const playTrackRef = useRef(playTrack);
  playTrackRef.current = playTrack;

  // Card-level Play (?autoplay=1) starts the first track once the release
  // loads. Gating rules still apply: locked or trackless releases simply
  // render their honest state. Quota is only consumed by real playback.
  useEffect(() => {
    if (router.query.autoplay !== "1" || autoplayed.current) return;
    if (!router.isReady || !release || !access) return;
    autoplayed.current = true;
    void router.replace(`/music/${slug}`, undefined, { shallow: true });
    if (release.tracks.length > 0 && access.canPlay) {
      void playTrackRef.current(release.tracks[0].id);
    }
  }, [router, slug, release, access]);

  return (
    <div className="min-h-screen bg-white">
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
              void playTrackRef.current(release.tracks[0].id);
            }
          }}
        />
      )}

      <main className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
        <BackLink href="/music">Back to Music</BackLink>

        {hasPaymentReturn && (
          <div
            role="status"
            className="mt-8 max-w-xl border border-neutral-200 p-5"
          >
            <p className="text-sm leading-relaxed text-neutral-700">
              {confirmingPayment
                ? "We’re checking your payment. Please don’t pay again while this check is in progress."
                : paymentCheckError || "Your payment is not confirmed yet."}
            </p>
            {!confirmingPayment && paymentReference && (
              <button
                type="button"
                onClick={() => setPaymentCheckAttempt((attempt) => attempt + 1)}
                className="mt-4 border border-neutral-900 px-5 py-3 font-display text-xs uppercase tracking-[0.2em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Check payment again
              </button>
            )}
          </div>
        )}

        {isLoading && !confirmingPayment && (
          <p className="mt-12 text-neutral-500">Loading…</p>
        )}
        {error && (
          <p className="mt-12 text-red-600">{(error as Error).message}</p>
        )}

        {release && access && (
          <div className="mt-10 grid gap-10 md:grid-cols-[240px_1fr]">
            <div className="relative aspect-square bg-neutral-100">
              {release.coverImage ? (
                <OptimizedImage
                  src={release.coverImage}
                  alt={release.title}
                  fill
                  preset="card"
                  priority
                  sizes="240px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                {release.releaseType.replace(/_/g, " ")} · {release.accessMode}
                {release.accessMode === "PAID" && release.price != null
                  ? ` · ${formatDisplayPrice(release.price)}`
                  : ""}
              </p>
              <h1 className="mt-3 font-display text-4xl font-light text-neutral-900 md:text-5xl">
                {release.title}
              </h1>
              <p className="mt-2 text-neutral-500">{release.artistName}</p>
              {release.description && (
                <p className="mt-6 leading-relaxed text-neutral-600">
                  {release.description}
                </p>
              )}

              {access.owned && (
                <p className="mt-4 text-sm text-neutral-600">
                  In your collection forever —{" "}
                  <Link href="/music/library" className="underline">
                    view collection
                  </Link>
                </p>
              )}

              {access.isStudioMember && (
                <p className="mt-4 text-sm text-neutral-700">
                  ✓ Studio Member — you&apos;re listening before public release.
                </p>
              )}

              {access.state === "tease" &&
                remainingTease != null &&
                hasTracks && (
                  <p className="mt-4 text-sm text-neutral-600">
                    Preview · {remainingTease} of {release.paidPlayLimit}{" "}
                    free preview{remainingTease === 1 ? " play" : " plays"}{" "}
                    remaining
                  </p>
                )}

              {access.state === "locked" && hasTracks && (
                <p className="mt-4 text-sm text-neutral-600">
                  Preview ended. Unlock for unlimited listening.
                </p>
              )}

              {playError && (
                <p className="mt-4 text-sm text-red-600">{playError}</p>
              )}

              {streamUrl && (
                <div className="mt-6 border border-neutral-200 p-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (playingId != null) {
                          audioRef.current?.pause();
                          setPlayingId(null);
                        } else if (streamTrackId != null) {
                          void audioRef.current?.play();
                          setPlayingId(streamTrackId);
                        }
                      }}
                      aria-label={
                        playingId != null ? "Pause current track" : "Resume current track"
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                    >
                      {playingId != null ? (
                        <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
                      ) : (
                        <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {release.tracks.find(
                          (t) => t.id === (playingId ?? streamTrackId)
                        )?.title ?? release.title}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-600">
                        {formatDuration(currentTime) ?? "0:00"}
                        {audioDuration != null &&
                          ` / ${formatDuration(audioDuration)}`}
                      </p>
                    </div>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Playback progress"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(audioDuration ?? 0)}
                    aria-valuenow={Math.round(currentTime)}
                    className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-200"
                  >
                    <div
                      className="h-full rounded-full bg-neutral-900"
                      style={{
                        width:
                          audioDuration != null && audioDuration > 0
                            ? `${Math.min(100, (currentTime / audioDuration) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <audio
                    ref={audioRef}
                    key={streamUrl}
                    className="sr-only"
                    controls={false}
                    autoPlay
                    src={streamUrl}
                    onTimeUpdate={(e) =>
                      setCurrentTime(e.currentTarget.currentTime)
                    }
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration;
                      setAudioDuration(Number.isFinite(d) ? d : null);
                    }}
                    onEnded={() => setPlayingId(null)}
                  />
                </div>
              )}

              {hasTracks ? (
                <ol className="mt-8 divide-y divide-neutral-100 border-t border-neutral-100">
                  {release.tracks.map((t) => {
                    const isPlaying = playingId === t.id;
                    const trackDuration = formatDuration(t.duration);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-4 py-3"
                      >
                        <button
                          type="button"
                          disabled={playDisabled}
                          onClick={() => toggleTrack(t.id)}
                          aria-label={`${isPlaying ? "Pause" : "Play"} ${t.title}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-900 text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                          ) : (
                            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                          )}
                        </button>
                        <span className="min-w-0 flex-1 text-neutral-800">
                          <span className="mr-3 text-neutral-500">
                            {t.trackNumber}
                          </span>
                          {t.title}
                        </span>
                        {trackDuration && (
                          <span className="shrink-0 text-sm tabular-nums text-neutral-500">
                            {trackDuration}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="mt-8 border border-neutral-200 p-5">
                  <p className="text-sm font-medium text-neutral-900">
                    No tracks yet
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Preview is unavailable until tracks are added to this
                    release.
                  </p>
                </div>
              )}

              {showUnlockCta && release.price != null && (
                <div className="mt-6">
                  {confirmUnlock ? (
                    <div className="max-w-md space-y-3 border border-neutral-200 p-5">
                      <p className="text-sm leading-relaxed text-neutral-600">
                        {CHECKOUT_SUPPORT_COPY}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setConfirmUnlock(false)}
                          className="px-4 py-3 text-xs uppercase tracking-widest text-neutral-500"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={checkoutBusy || confirmingPayment}
                          onClick={handleUnlock}
                          className="inline-flex flex-1 items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white hover:bg-white hover:text-neutral-900 disabled:opacity-50"
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
                      className="inline-flex items-center justify-center border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
                    >
                      Unlock release — {formatDisplayPrice(release.price)}
                    </button>
                  )}
                  {!session && !confirmUnlock && (
                    <p className="mt-2 text-sm text-neutral-600">
                      Sign in to add this release to your collection. Unlocks
                      stay in your account.
                    </p>
                  )}
                  {access.isStudioMember && (
                    <p className="mt-2 text-sm text-neutral-600">
                      Studio members still unlock paid releases individually —
                      membership covers member-only releases.
                    </p>
                  )}
                </div>
              )}

              {release.accessMode === "MEMBERS_ONLY" &&
                access.state === "membership_required" && (
                  <div className="mt-6">
                    <StudioJoinCompact returnPath={`/music/${release.slug}`} />
                  </div>
                )}

              {release.artistNotes && (
                <div className="mt-8 border-t border-neutral-100 pt-8">
                  <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Artist notes
                  </p>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-neutral-600">
                    {release.artistNotes}
                  </p>
                </div>
              )}

              {release.studioNotes && (
                <div className="mt-8 border-t border-neutral-100 pt-8">
                  <p className="font-display text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Studio notes
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    For Studio members only
                  </p>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-neutral-600">
                    {release.studioNotes}
                  </p>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
