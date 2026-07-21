import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import useSWR, { mutate as globalMutate } from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import OptimizedImage from "@/components/ui/OptimizedImage";
import StudioPassSection from "@/components/music/StudioPassSection";
import { formatDisplayPrice } from "@/lib/currency";

type ReleaseCard = {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  artistName: string;
  releaseType: string;
  accessMode: string;
  price: number | null;
  currency: string;
  locked: boolean;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load music");
  }
  return body.data as ReleaseCard[];
};

function accessBadge(r: ReleaseCard): string {
  if (r.accessMode === "FREE") return "Free";
  if (r.accessMode === "MEMBERS_ONLY") return "Members Only";
  if (r.accessMode === "PAID") {
    return r.price != null
      ? `Purchase · ${formatDisplayPrice(r.price)}`
      : "Purchase";
  }
  return r.accessMode;
}

export default function MusicIndexPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const paymentReference =
    typeof router.query.reference === "string"
      ? router.query.reference
      : undefined;

  const { data: releases, error, isLoading, mutate } = useSWR(
    "/api/music/releases",
    fetcher
  );
  const [confirmingPayment, setConfirmingPayment] = useState(false);

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
          toast.success(
            isPass
              ? "Studio Pass active — member releases are unlocked"
              : "Unlocked — enjoy the full release"
          );
          await mutate();
          await globalMutate("/api/music/membership-plans");
        }
      } catch {
        if (!cancelled) toast.error("Could not confirm payment");
      } finally {
        if (!cancelled) {
          setConfirmingPayment(false);
          router.replace("/music#studio-pass", undefined, { shallow: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, paymentReference, authStatus, router, mutate]);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Music — Jojjy Gallery</title>
        <meta
          name="description"
          content="Listen first here — releases from the studio, for supporters."
        />
      </Head>
      <Navbar />

      <main className="px-5 pt-14 pb-24 md:px-10 md:pt-20 lg:px-16 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-20 max-w-3xl text-center md:mb-28"
        >
          <h1 className="font-display text-5xl font-light tracking-tight text-neutral-900 md:text-6xl lg:text-7xl">
            Music
          </h1>
          <p className="mx-auto mt-8 max-w-lg font-archive-body text-lg font-normal leading-[1.7] text-neutral-600 md:text-[1.125rem]">
            First windows for new work — stream here before it goes wider.
          </p>
          <p className="mt-4">
            <Link
              href="/music/library"
              className="text-sm uppercase tracking-[0.2em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
            >
              Your library
            </Link>
          </p>
        </motion.div>

        {confirmingPayment && (
          <p className="mb-10 text-center text-sm text-neutral-500">
            Confirming payment…
          </p>
        )}

        {isLoading && (
          <p className="text-center font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
            Loading
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-red-600">
            {(error as Error).message}
          </p>
        )}

        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {(releases || []).map((r) => (
            <Link
              key={r.id}
              href={`/music/${r.slug}`}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                {r.coverImage ? (
                  <OptimizedImage
                    src={r.coverImage}
                    alt={r.title}
                    fill
                    preset="card"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : null}
              </div>
              <div className="mt-4">
                <p className="font-display text-xl text-neutral-900">
                  {r.title}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{r.artistName}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-400">
                  {accessBadge(r)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {releases?.length === 0 && !isLoading && (
          <p className="text-center text-neutral-500">No releases yet.</p>
        )}

        <StudioPassSection className="mt-24 md:mt-32" returnPath="/music" />
      </main>
      <Footer />
    </div>
  );
}
