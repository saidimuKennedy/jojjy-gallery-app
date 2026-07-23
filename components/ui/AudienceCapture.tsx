import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import NewsletterModal from "@/components/ui/NewsletterModal";
import {
  isAudienceModalExcludedPath,
  markAudienceModalDismissed,
  shouldShowAudienceModal,
} from "@/lib/audience";

const SCROLL_DEPTH = 0.8;
const DELAY_MS = 10_000;

/**
 * Site-wide scroll prompt that sends visitors to `/subscribe`.
 * Form lives only on that page — this is a soft CTA.
 */
export default function AudienceCapture() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const firedRef = useRef(false);
  const eligibleRef = useRef(false);
  const delayDoneRef = useRef(false);

  const tryOpen = useCallback(() => {
    if (firedRef.current) return;
    if (!eligibleRef.current || !delayDoneRef.current) return;
    if (!shouldShowAudienceModal()) return;
    if (isAudienceModalExcludedPath(router.pathname)) return;
    firedRef.current = true;
    setOpen(true);
  }, [router.pathname]);

  useEffect(() => {
    firedRef.current = false;
    eligibleRef.current = false;
    delayDoneRef.current = false;
    setOpen(false);

    if (isAudienceModalExcludedPath(router.pathname)) return;
    if (!shouldShowAudienceModal()) return;

    eligibleRef.current = true;

    const delayTimer = window.setTimeout(() => {
      delayDoneRef.current = true;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 48) {
        tryOpen();
      } else {
        const ratio =
          scrollable <= 0 ? 1 : window.scrollY / scrollable;
        if (ratio >= SCROLL_DEPTH) tryOpen();
      }
    }, DELAY_MS);

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= SCROLL_DEPTH) {
        tryOpen();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(delayTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [router.pathname, tryOpen]);

  const dismiss = useCallback(() => {
    markAudienceModalDismissed();
    setOpen(false);
  }, []);

  const goSubscribe = useCallback(() => {
    // Navigating to subscribe counts as engaging — don't re-prompt this session
    // via dismiss cooldown; only close. They may still dismiss later from page.
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <NewsletterModal onClose={dismiss} onGoSubscribe={goSubscribe} />
  );
}
