import Head from "next/head";
import type { GetStaticProps } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/home/Hero";
import WorldOfJenga from "@/components/home/WorldOfJenga";
import ArtMusic from "@/components/home/ArtMusic";
import TwoLanguages from "@/components/home/TwoLanguages";
import NowSection from "@/components/home/NowSection";
import TakeSomething from "@/components/home/TakeSomething";
import FromTheStudio from "@/components/home/FromTheStudio";
import AboutJenga from "@/components/home/AboutJenga";
import KeepLooking from "@/components/home/KeepLooking";
import { getArtworks } from "@/lib/data/artworks";
import { getPublishedEvents } from "@/lib/data/events";
import { getMediaBlogEntries } from "@/lib/data/media-blog";
import { serializeReleasePublic } from "@/lib/music/entitlements";
import prisma from "@/lib/prisma";
import type { ArtworkWithRelations } from "@/types/api";
import type {
  HomeArtwork,
  HomeEvent,
  HomeProduct,
  HomeProps,
  HomeRelease,
  HomeStudioItem,
} from "@/components/home/types";

/** Artist portrait committed in the repo — used when a DB slot has no image. */
const PORTRAIT_IMAGE = "/images/joj-artist.png";

function mapArtwork(artwork: ArtworkWithRelations): HomeArtwork {
  return {
    id: artwork.id,
    title: artwork.title,
    imageUrl: artwork.imageUrl,
    year: artwork.year,
    medium: artwork.medium,
    price: artwork.price,
    status: String(artwork.status),
  };
}

/** Never let one content source break the whole homepage build. */
async function safe<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[home] ${label} failed`, error);
    return fallback;
  }
}

export default function Home({
  artworks,
  availableArtworks,
  releases,
  events,
  products,
  studioItems,
}: HomeProps) {
  const now = Date.now();
  const upcomingEvent = [...events]
    .filter((event) => new Date(event.startsAt).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )[0];

  const artImage = artworks[0]?.imageUrl ?? availableArtworks[0]?.imageUrl;
  // Music falls back to the artist portrait until release/performance media exists.
  const musicImage =
    releases[0]?.coverImage ?? events[0]?.imageUrl ?? PORTRAIT_IMAGE;
  const twoLanguagesArt =
    artworks[1]?.imageUrl ?? artworks[0]?.imageUrl ?? availableArtworks[0]?.imageUrl;
  const twoLanguagesMusic =
    releases[1]?.coverImage ??
    releases[0]?.coverImage ??
    events[0]?.imageUrl ??
    PORTRAIT_IMAGE;

  return (
    <div className="jenga-home relative overflow-x-clip">
      <Head>
        <title>JENGA — Visual Artist. Musician.</title>
        <meta
          name="description"
          content="JENGA is a multidisciplinary Kenyan artist working across visual art and music. Exploring the seen and the unseen."
        />
        {/* No-JS fallback: reveal all motion-enhanced content immediately and
            drop the opening curtain/atmosphere scrims. */}
        <noscript>
          <style>{`.jenga-home [data-motion]{opacity:1 !important;transform:none !important;}.jenga-home [data-scrim]{opacity:0 !important;}`}</style>
        </noscript>
      </Head>

      <Navbar variant="transparent" />

      <main>
        <Hero />

        <WorldOfJenga image={artImage} imageAlt="Artwork by JENGA" />

        <ArtMusic
          artImage={artworks[0]?.imageUrl}
          artAlt={artworks[0]?.title}
          musicImage={musicImage}
          musicAlt={releases[0]?.title}
        />

        <TwoLanguages
          artImage={twoLanguagesArt}
          artAlt={artworks[0]?.title}
          musicImage={twoLanguagesMusic}
          musicAlt={releases[0]?.title}
        />

        <NowSection
          artworks={artworks}
          availableArtworks={availableArtworks}
          release={releases[0]}
          upcomingEvent={upcomingEvent}
        />

        <TakeSomething
          availableArtworks={availableArtworks}
          artworks={artworks}
          products={products}
          release={releases[0]}
          event={upcomingEvent}
          portrait={PORTRAIT_IMAGE}
        />

        <FromTheStudio items={studioItems} />

        <AboutJenga />

        <KeepLooking />
      </main>

      <Footer />
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const galleryResult = await safe(
    "artworks:gallery",
    () => getArtworks({ inGallery: true, limit: 8, minimal: true }),
    { artworks: [] as ArtworkWithRelations[], total: 0 }
  );
  const availableResult = await safe(
    "artworks:available",
    () =>
      getArtworks({
        status: "AVAILABLE",
        isAvailable: true,
        limit: 8,
        minimal: true,
      }),
    { artworks: [] as ArtworkWithRelations[], total: 0 }
  );

  const rawEvents = await safe("events", () => getPublishedEvents(), []);
  const events: HomeEvent[] = rawEvents.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    // Normalise blank strings to null so `?? fallback` works downstream.
    imageUrl: event.imageUrl?.trim() || null,
    venue: event.venue,
    startsAt: event.startsAt,
    status: String(event.status),
  }));

  const rawReleases = await safe(
    "music:releases",
    () =>
      prisma.release.findMany({
        where: { publishStatus: "PUBLISHED" },
        include: {
          accessPolicy: true,
          tracks: { orderBy: { trackNumber: "asc" } },
        },
        orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
    []
  );
  const releases: HomeRelease[] = rawReleases
    .map(serializeReleasePublic)
    .map((release) => ({
      id: release.id,
      slug: release.slug,
      title: release.title,
      coverImage: release.coverImage?.trim() || null,
      releaseType: release.releaseType,
      artistName: release.artistName,
      releaseDate: release.releaseDate,
      accessMode: release.accessMode,
      price: release.price,
      currency: release.currency,
    }));

  const rawProducts = await safe(
    "shop:products",
    () =>
      prisma.product.findMany({
        where: { isAvailable: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          variants: {
            where: { stock: { gt: 0 } },
            orderBy: { price: "asc" },
          },
        },
      }),
    []
  );
  const products: HomeProduct[] = rawProducts.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    imageUrl: product.imageUrl?.trim() || null,
    category: product.category,
    price: product.variants[0] ? Number(product.variants[0].price) : null,
  }));

  const mediaBlog = await safe(
    "studio:media-blog",
    () => getMediaBlogEntries({ limit: 8, minimal: true }),
    { entries: [], total: 0 }
  );
  const editorialItems: HomeStudioItem[] = mediaBlog.entries
    .filter((entry) => Boolean(entry.thumbnailUrl))
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      imageUrl: entry.thumbnailUrl,
    }));

  // No editorial entries: hide the strip rather than implying
  // "From the Studio" with unrelated fallback artwork/portrait.
  // (FromTheStudio renders nothing when the list is empty.)
  const studioItems: HomeStudioItem[] = editorialItems;

  return {
    props: {
      artworks: galleryResult.artworks.map(mapArtwork),
      availableArtworks: availableResult.artworks.map(mapArtwork),
      releases,
      events,
      products,
      studioItems,
    },
    revalidate: 120,
  };
};
