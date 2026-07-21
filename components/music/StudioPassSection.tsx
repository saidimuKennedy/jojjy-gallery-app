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
  currency: string;
  durationDays: number;
};

type PlansPayload = {
  plans: MembershipPlan[];
  viewerMembership: {
    active: boolean;
    expiresAt: string | null;
    planName: string | null;
  } | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load Studio Pass plans");
  }
  return body.data as PlansPayload;
};

type StudioPassSectionProps = {
  variant?: "full" | "compact";
  returnPath?: string;
  className?: string;
};

export default function StudioPassSection({
  variant = "full",
  returnPath = "/music#studio-pass",
  className = "",
}: StudioPassSectionProps) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { data, error, isLoading } = useSWR("/api/music/membership-plans", fetcher);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);

  const handleGetPass = async (planId: number) => {
    if (authStatus === "loading") return;
    if (!session?.user) {
      toast.error("Sign in to get a Studio Pass");
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
          returnPath,
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

  if (isLoading) {
    return (
      <p className={`text-sm text-neutral-400 ${className}`}>Loading passes…</p>
    );
  }
  if (error) {
    return (
      <p className={`text-sm text-red-600 ${className}`}>
        {(error as Error).message}
      </p>
    );
  }

  const plans = data?.plans ?? [];
  const membership = data?.viewerMembership;

  if (plans.length === 0) {
    return null;
  }

  const expiryLabel =
    membership?.active && membership.expiresAt
      ? new Date(membership.expiresAt).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  if (variant === "compact") {
    return (
      <div className={`space-y-4 ${className}`}>
        {membership?.active ? (
          <p className="text-sm text-neutral-600">
            Studio Pass active
            {expiryLabel ? ` until ${expiryLabel}` : ""}.{" "}
            <Link href="/music/library" className="underline">
              Open library
            </Link>
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              Get a Studio Pass for member exclusives and early listens.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  disabled={busyPlanId != null}
                  onClick={() => handleGetPass(plan.id)}
                  className="inline-flex items-center justify-center border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
                >
                  {busyPlanId === plan.id
                    ? "Redirecting…"
                    : `${plan.name} · ${formatDisplayPrice(plan.price)}`}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <section
      id="studio-pass"
      className={`mx-auto max-w-3xl border-t border-neutral-200 pt-16 md:pt-20 ${className}`}
    >
      <p className="font-display text-xs uppercase tracking-[0.28em] text-neutral-400">
        Studio Pass
      </p>
      <h2 className="mt-4 font-display text-3xl font-light text-neutral-900 md:text-4xl">
        Member exclusives
      </h2>
      <p className="mt-4 max-w-xl font-archive-body text-base leading-relaxed text-neutral-600">
        Early listens and members-only releases from the studio. Passes stack —
        buy again anytime to extend access.
      </p>

      {membership?.active && (
        <p className="mt-6 text-sm text-neutral-700">
          Your pass is active
          {expiryLabel ? ` until ${expiryLabel}` : ""}
          {membership.planName ? ` (${membership.planName})` : ""}.{" "}
          <Link href="/music/library" className="underline">
            Your library
          </Link>
        </p>
      )}

      <ul className="mt-10 space-y-4">
        {plans.map((plan) => (
          <li
            key={plan.id}
            className="flex flex-col gap-4 border border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-xl text-neutral-900">{plan.name}</p>
              {plan.description && (
                <p className="mt-2 text-sm text-neutral-500">{plan.description}</p>
              )}
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-400">
                {plan.durationDays} days · {formatDisplayPrice(plan.price)}
              </p>
            </div>
            <button
              type="button"
              disabled={busyPlanId != null}
              onClick={() => handleGetPass(plan.id)}
              className="shrink-0 border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
            >
              {busyPlanId === plan.id ? "Redirecting…" : "Get pass"}
            </button>
          </li>
        ))}
      </ul>

      {!session && (
        <p className="mt-6 text-xs text-neutral-500">
          Sign in to purchase — your pass stays linked to your account.
        </p>
      )}
    </section>
  );
}
