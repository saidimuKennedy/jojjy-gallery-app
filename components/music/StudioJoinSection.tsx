import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { formatDisplayPrice } from "@/lib/currency";
import { CHECKOUT_SUPPORT_COPY } from "@/lib/music/studio-defaults";

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
    startedAt: string | null;
    planName: string | null;
    isFounding: boolean;
  } | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.message || "Failed to load plans");
  }
  return body.data as PlansPayload;
};

type StudioJoinSectionProps = {
  returnPath?: string;
  showSupportCopy?: boolean;
};

export default function StudioJoinSection({
  returnPath = "/music/studio",
  showSupportCopy = true,
}: StudioJoinSectionProps) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { data, error, isLoading } = useSWR(
    "/api/music/membership-plans",
    fetcher
  );
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [confirmPlanId, setConfirmPlanId] = useState<number | null>(null);

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
      setConfirmPlanId(null);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">{(error as Error).message}</p>
    );
  }

  const plans = data?.plans ?? [];
  const membership = data?.viewerMembership;

  if (plans.length === 0) return null;

  const expiryLabel =
    membership?.active && membership.expiresAt
      ? new Date(membership.expiresAt).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  const sinceLabel =
    membership?.active && membership.startedAt
      ? new Date(membership.startedAt).toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        })
      : null;

  return (
    <div id="join-studio">
      {membership?.active ? (
        <div className="border border-neutral-200 bg-neutral-50 p-6 md:p-8">
          <p className="font-display text-xs uppercase tracking-[0.24em] text-neutral-500">
            ✓ Studio Member
            {membership.isFounding ? " · Founding Member" : ""}
          </p>
          <p className="mt-3 font-display text-2xl font-light text-neutral-900">
            Welcome back inside the Studio
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {sinceLabel ? `Studio member since ${sinceLabel}` : "Active member"}
            {expiryLabel ? ` · access until ${expiryLabel}` : ""}
          </p>
          <Link
            href="/music/library"
            className="mt-4 inline-block text-sm underline text-neutral-700"
          >
            Your collection →
          </Link>
        </div>
      ) : (
        <>
          {showSupportCopy && (
            <p className="mb-8 max-w-lg text-sm leading-relaxed text-neutral-600">
              {CHECKOUT_SUPPORT_COPY}
            </p>
          )}
          <ul className="space-y-4">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col gap-4 border border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-xl text-neutral-900">
                    {plan.durationDays} days in the Studio
                  </p>
                  {plan.description && (
                    <p className="mt-2 text-sm text-neutral-500">
                      {plan.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-400">
                    {formatDisplayPrice(plan.price)}
                  </p>
                </div>
                {confirmPlanId === plan.id ? (
                  <div className="flex flex-col gap-2 sm:items-end">
                    <p className="text-xs text-neutral-500 max-w-xs text-right">
                      {CHECKOUT_SUPPORT_COPY}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmPlanId(null)}
                        className="px-4 py-3 text-xs uppercase tracking-widest text-neutral-500"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={busyPlanId != null}
                        onClick={() => handleJoin(plan.id)}
                        className="border border-neutral-900 bg-neutral-900 px-6 py-3 font-display text-xs uppercase tracking-[0.22em] text-white hover:bg-white hover:text-neutral-900 disabled:opacity-50"
                      >
                        {busyPlanId === plan.id
                          ? "Redirecting…"
                          : "Continue to payment"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busyPlanId != null}
                    onClick={() => setConfirmPlanId(plan.id)}
                    className="shrink-0 border border-neutral-900 bg-neutral-900 px-8 py-4 font-display text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
                  >
                    Join the Studio
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!session && (
            <p className="mt-6 text-xs text-neutral-500">
              Sign in to join — your Studio access stays with your account.
            </p>
          )}
        </>
      )}
    </div>
  );
}
