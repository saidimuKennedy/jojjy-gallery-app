import { Shell } from "@/components/home/primitives";
import { Reveal } from "@/components/home/motion";
import NewsletterSignup from "@/components/ui/NewsletterSignup";

export default function KeepLooking() {
  return (
    <section className="border-t border-white/5 bg-black py-24 md:py-32 lg:py-40">
      <Shell>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal y={24} duration={1.1}>
            <h2 className="jenga-cream font-display text-[clamp(2.25rem,8vw,6rem)] font-light leading-[1] tracking-tight">
              KEEP LOOKING.
            </h2>
          </Reveal>

          <Reveal y={16} duration={0.9} delay={0.12} className="mt-8">
            <p className="jenga-accent font-archive-body text-[0.6875rem] font-medium uppercase tracking-[0.36em]">
              New work, music, exhibitions and live experiences.
            </p>
          </Reveal>

          <Reveal y={14} duration={0.9} delay={0.2} className="mt-14">
            <p className="jenga-eyebrow">Join the world.</p>
          </Reveal>

          <Reveal y={16} duration={0.9} delay={0.28} className="mt-8">
            <NewsletterSignup
              variant="dark"
              className="mx-auto max-w-md text-left"
            />
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
