import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate as globalMutate } from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
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
  const paymentReference =
    typeof router.query.reference === "string" ? router.query.reference : undefined;

  const { data: session, status: authStatus } = useSession();
  const { data: release, error, isLoading, mutate } = useSWR(
    slug ? `/api/music/releases/${slug}` : null,
    fetcher
  );

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const access = release?.viewerAccess;
  const remainingTease =
    access?.state === "tease" ? access.remainingTease : access?.remainingTease;

  useEffect(() => {
    if (!router.isReady || !paymentReference || !slug) return;
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
          if (isPass) {
            toast.success("Welcome to the Studio");
            router.replace("/music/studio?welcomed=studio");
            return;
          }
          setShowWelcome(true);
          toast.success("Added to your collection");
          await mutate();
        }
      } catch {
        if (!cancelled) toast.error("Could not confirm payment");
      } finally {
        if (!cancelled) {
          setConfirmingPayment(false);
          router.replace(`/music/${slug}`, undefined, { shallow: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    paymentReference,
    slug,
    authStatus,
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
      setPlayingId(trackId);
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
    release?.accessMode === "PAID" &&
    access &&
    (access.state === "locked" || access.state === "tease");

  const playDisabled =
    busy || confirmingPayment || (access != null && !access.canPlay);

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
        />
      )}

      <main className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-20">
        <Link
          href="/music"
          className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-800"
        >
          ← Music
        </Link>

        {confirmingPayment && (
          <p className="mt-8 text-sm text-neutral-500">Confirming payment…</p>
        )}

        {isLoading && !confirmingPayment && (
          <p className="mt-12 text-neutral-400">Loading…</p>
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
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
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

              {access.state === "tease" && remainingTease != null && (
                <p className="mt-4 text-sm text-neutral-500">
                  {remainingTease} of {release.paidPlayLimit} free preview
                  {remainingTease === 1 ? " play" : " plays"} left
                </p>
              )}

              {access.state === "locked" && (
                <p className="mt-4 text-sm text-neutral-600">
                  Preview ended. Unlock for unlimited listening.
                </p>
              )}

              {playError && (
                <p className="mt-4 text-sm text-red-600">{playError}</p>
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
                      {access.state === "locked"
                        ? `Unlock · ${formatDisplayPrice(release.price)}`
                        : `Unlock · ${formatDisplayPrice(release.price)}`}
                    </button>
                  )}
                  {!session && !confirmUnlock && (
                    <p className="mt-2 text-xs text-neutral-500">
                      Sign in required — unlocks stay in your collection
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
                  <p className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                    Artist notes
                  </p>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-neutral-600">
                    {release.artistNotes}
                  </p>
                </div>
              )}

              {release.studioNotes && (
                <div className="mt-8 border-t border-neutral-100 pt-8">
                  <p className="font-display text-xs uppercase tracking-[0.24em] text-neutral-400">
                    Studio notes
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    For Studio members only
                  </p>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-neutral-600">
                    {release.studioNotes}
                  </p>
                </div>
              )}

              {streamUrl && (
                <audio
                  key={streamUrl}
                  className="mt-6 w-full"
                  controls
                  autoPlay
                  src={streamUrl}
                />
              )}

              <ol className="mt-8 divide-y divide-neutral-100 border-t border-neutral-100">
                {release.tracks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-neutral-800">
                      <span className="mr-3 text-neutral-400">
                        {t.trackNumber}
                      </span>
                      {t.title}
                    </span>
                    <button
                      type="button"
                      disabled={playDisabled}
                      onClick={() => playTrack(t.id)}
                      className="text-xs uppercase tracking-[0.18em] text-neutral-600 hover:text-neutral-950 disabled:opacity-50"
                    >
                      {playingId === t.id ? "Playing" : "Play"}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
