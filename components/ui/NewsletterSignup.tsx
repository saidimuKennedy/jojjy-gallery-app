import React, { useState } from "react";
import {
  isValidSubscriberEmail,
  markAudienceSubscribed,
  normalizeSubscriberEmail,
} from "@/lib/audience";

type NewsletterSignupProps = {
  className?: string;
  /** "dark" is used by the JENGA homepage closing section. */
  variant?: "default" | "dark";
};

export default function NewsletterSignup({
  className = "",
  variant = "default",
}: NewsletterSignupProps) {
  const isDark = variant === "dark";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalized = normalizeSubscriberEmail(email);
    if (!normalized || !isValidSubscriberEmail(normalized)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setStatus("error");
        setErrorMessage(body.message || "Could not subscribe. Please try again.");
        return;
      }
      markAudienceSubscribed();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div className={className} role="status">
        <p
          className={`font-display text-3xl font-light tracking-tight md:text-4xl ${
            isDark ? "text-white" : "text-neutral-900"
          }`}
        >
          Thanks for joining.
        </p>
        <p
          className={`mt-6 max-w-md text-sm font-light leading-relaxed md:text-base ${
            isDark ? "text-neutral-300" : "text-neutral-600"
          }`}
        >
          You&apos;ll be the first to hear about new artworks, studio releases,
          and upcoming exhibitions.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <label
          htmlFor="audience-email"
          className={`block text-xs font-medium uppercase tracking-[0.18em] ${
            isDark ? "text-neutral-400" : "text-neutral-500"
          }`}
        >
          Email Address
        </label>
        <input
          id="audience-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className={
            isDark
              ? "mt-3 w-full border-0 border-b border-neutral-600 bg-transparent py-3 text-base text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-[color:var(--jenga-accent)] disabled:opacity-60"
              : "mt-3 w-full border-0 border-b border-neutral-300 bg-transparent py-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 disabled:opacity-60"
          }
          placeholder="you@email.com"
        />
      </div>

      {errorMessage && (
        <p
          className={`text-sm ${isDark ? "text-red-400" : "text-red-700"}`}
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "loading"}
          className={
            isDark
              ? "jenga-btn disabled:opacity-50"
              : "border border-neutral-900 bg-neutral-900 px-8 py-3 font-display text-xs uppercase tracking-[0.22em] text-white transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-50"
          }
        >
          {status === "loading" ? "Subscribing…" : isDark ? "Join" : "Subscribe"}
        </button>
      </div>

      <p className="text-xs font-light text-neutral-500">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
