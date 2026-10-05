import { ArrowLink, Eyebrow, MediaFrame, Shell } from "@/components/home/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/motion";
import type { HomeArtwork, HomeEvent, HomeRelease } from "@/components/home/types";

interface NowCard {
  label: string;
  title: string;
  description: string;
  image?: string | null;
  href: string;
  cta: string;
}

function formatEventDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function NowSection({
  artworks,
  availableArtworks,
  release,
  upcomingEvent,
}: {
  artworks: HomeArtwork[];
  availableArtworks: HomeArtwork[];
  release?: HomeRelease;
  upcomingEvent?: HomeEvent;
}) {
  const cards: NowCard[] = [];

  const studioWork = artworks[0];
  if (studioWork) {
    cards.push({
      label: "In the Studio",
      title: studioWork.title,
      description: "Current work from the studio.",
      image: studioWork.imageUrl,
      href: `/artworks/${studioWork.id}`,
      cta: "View",
    });
  }

  if (release) {
    cards.push({
      label: "Now Playing",
      title: release.title,
      description: "The latest release is out now.",
      image: release.coverImage,
      href: `/music/${release.slug}`,
      cta: "Listen",
    });
  }

  if (upcomingEvent) {
    const where = upcomingEvent.venue || formatEventDate(upcomingEvent.startsAt);
    cards.push({
      label: "Upcoming",
      title: upcomingEvent.title,
      description: where ? `${where}` : "The next gathering.",
      image: upcomingEvent.imageUrl,
      href: `/events/${upcomingEvent.slug}`,
      cta: "Details",
    });
  }

  const available = availableArtworks[0];
  if (available) {
    cards.push({
      label: "Available",
      title: available.title,
      description: "Selected original works are available.",
      image: available.imageUrl,
      href: "/shop",
      cta: "View works",
    });
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/5 bg-black py-20 md:py-28 lg:py-32">
      <Shell>
        <Reveal y={18} duration={0.8}>
          <Eyebrow>Now</Eyebrow>
        </Reveal>

        <RevealGroup
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4 lg:gap-x-8"
          stagger={0.08}
        >
          {cards.map((card) => (
            <RevealItem key={card.label} y={24}>
              <article className="group flex flex-col">
                <MediaFrame
                  src={card.image}
                  alt={card.title}
                  aspect="aspect-[4/3]"
                  preset="card"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <p className="jenga-accent mt-5 font-archive-body text-[0.625rem] font-medium uppercase tracking-[0.32em]">
                  {card.label}
                </p>
                <h3 className="jenga-cream mt-3 font-display text-xl font-light leading-snug md:text-2xl">
                  {card.title}
                </h3>
                <p className="jenga-body-text mt-3 text-sm leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-5">
                  <ArrowLink href={card.href}>{card.cta}</ArrowLink>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Shell>
    </section>
  );
}
