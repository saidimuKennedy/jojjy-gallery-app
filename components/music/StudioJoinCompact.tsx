import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { formatDisplayPrice } from "@/lib/currency";

type MembershipPlan = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
};

type PlansPayload = {
  plans: MembershipPlan[];
  viewerMembership: { active: boolean; expiresAt: string | null } | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load plans");
  }
  return body.data as PlansPayload;
};

type StudioJoinCompactProps = {
  returnPath?: string;
  className?: string;
};

export default function StudioJoinCompact({
  returnPath,
  className = "",
}: StudioJoinCompactProps) {
  const router = useRouter();
  const path = returnPath ?? router.asPath.split("?")[0];
  const { data: session, status: authStatus } = useSession();
  const { data, error, isLoading } = useSWR(
    "/api/music/membership-plans",
    fetcher
  );
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const handleJoin = async (planId: number) => {
    if (authStatus === "loading") return;
    if (!session?.user) {
      toast.error("Sign in to join the Studio");
      router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setBusyPlanId(planId);
    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ membershipPlanId: planId }],
          paymentProvider: "PAYSTACK",
          returnPath: path,
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
      setBusyPlanId(null);
    }
  };

  if (dismissed || isLoading || error) {
    if (error) {
      return (
        <p className={`text-sm text-red-600 ${className}`}>
          {(error as Error).message}
        </p>
      );
    }
    if (dismissed) {
      return (
        <p className={`text-sm text-neutral-500 ${className}`}>
          This release will reach the public catalogue later.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setDismissed(false)}
          >
            Show join options
          </button>
        </p>
      );
    }
    return null;
  }

  const plans = data?.plans ?? [];
  const membership = data?.viewerMembership;

  if (membership?.active) {
    return (
      <p className={`text-sm text-neutral-600 ${className}`}>
        ✓ Studio Member — you&apos;re listening before public release.{" "}
        <Link href="/music/library" className="underline">
          Your collection
        </Link>
      </p>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-sm leading-relaxed text-neutral-700">
        This release is{" "}
        <span className="font-medium text-neutral-900">inside the Studio</span>{" "}
        right now. Studio members hear every release before it reaches the
        public.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/music/studio#join-studio"
          className="inline-flex items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-neutral-900"
        >
          Join the Studio
        </Link>
        {plans[0] && (
          <button
            type="button"
            disabled={busyPlanId != null}
            onClick={() => handleJoin(plans[0].id)}
            className="inline-flex items-center justify-center border border-neutral-300 px-6 py-3 font-display text-xs uppercase tracking-[0.2em] text-neutral-800 hover:border-neutral-900 disabled:opacity-50"
          >
            {busyPlanId === plans[0].id
              ? "Redirecting…"
              : `Quick join · ${formatDisplayPrice(plans[0].price)}`}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
      >
        Wait until public release
      </button>
    </div>
  );
}
