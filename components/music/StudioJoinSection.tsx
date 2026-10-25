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
    status: "ACTIVE" | "EXPIRED" | "CANCELLED" | null;
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
  /** "grid" renders plans as equal cards, one column per plan. */
  variant?: "list" | "grid";
};

export default function StudioJoinSection({
  returnPath = "/music/studio",
  showSupportCopy = true,
  variant = "list",
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
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">{(error as Error).message}</p>
    );
  }

  const plans = data?.plans ?? [];
  const membership = data?.viewerMembership;

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

  const expiredLabel =
    membership && !membership.active
      ? membership.status === "CANCELLED"
        ? "Your Studio access is not active."
        : membership.expiresAt
          ? `Your Studio access ended on ${new Date(
              membership.expiresAt
            ).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}.`
          : null
      : null;

  return (
    <div id="join-studio">
      {membership?.active ? (
        <div className="border border-neutral-200 bg-neutral-50 p-6 md:p-8">
          <p className="font-display text-xs uppercase tracking-[0.24em] text-neutral-500">
            ✓ Studio Member
            {membership.isFounding ? " · Founding Member" : ""}
          </p>
          <p className="mt-3 font-display text-2xl font-normal text-neutral-900">
            Welcome back inside the Studio
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {sinceLabel ? `Studio member since ${sinceLabel}` : "Active member"}
            {expiryLabel ? ` · access until ${expiryLabel}` : ""}
          </p>
          <Link
            href="/music/library"
            className="mt-4 inline-block font-archive-body text-sm font-medium text-neutral-700 underline-offset-4 underline decoration-neutral-400 transition-colors hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            Your library
          </Link>
        </div>
      ) : (
        <>
          {expiredLabel && (
            <p className="mb-6 text-sm leading-relaxed text-neutral-600">
              {expiredLabel}
            </p>
          )}
          {showSupportCopy && (
            <p className="mb-8 max-w-lg text-sm leading-relaxed text-neutral-600">
              {CHECKOUT_SUPPORT_COPY}
            </p>
          )}
          {plans.length === 0 ? (
            <p className="border border-neutral-200 bg-neutral-50 p-6 text-sm leading-relaxed text-neutral-600">
              Studio plans are not available right now. Please check back
              shortly.
            </p>
          ) : variant === "grid" ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                return (
                  <li
                    key={plan.id}
                    className="relative flex flex-col border border-neutral-200 bg-white/60 p-6"
                  >
                    <p className="font-display text-2xl text-neutral-900">
                      {plan.durationDays} days
                    </p>
                    {plan.description && (
                      <p className="mt-2 font-archive-body text-sm leading-relaxed text-neutral-600">
                        {plan.description}
                      </p>
                    )}
                    <p className="mt-6 font-display text-2xl text-neutral-900">
                      {formatDisplayPrice(plan.price)}
                    </p>
                    <div className="mt-auto pt-6">
                      {confirmPlanId === plan.id ? (
                        <div className="space-y-3">
                          <p className="text-xs leading-relaxed text-neutral-500">
                            {CHECKOUT_SUPPORT_COPY}
                          </p>
                          <button
                            type="button"
                            disabled={busyPlanId != null}
                            onClick={() => handleJoin(plan.id)}
                            className="w-full border border-neutral-900 bg-neutral-900 px-4 py-3 font-archive-body text-xs font-medium text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
                          >
                            {busyPlanId === plan.id
                              ? "Redirecting…"
                              : "Continue to payment"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmPlanId(null)}
                            className="w-full text-xs text-neutral-500 hover:text-neutral-900"
                          >
                            Back
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busyPlanId != null}
                          onClick={() => setConfirmPlanId(plan.id)}
                          className="w-full border border-neutral-900 bg-transparent px-4 py-3 font-archive-body text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-50"
                        >
                          Join the Studio
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
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
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-500">
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
          )}
          {!session && plans.length > 0 && (
            <p className="mt-6 text-xs text-neutral-500">
              Sign in to join — your Studio access stays with your account.
            </p>
          )}
        </>
      )}
    </div>
  );
}
