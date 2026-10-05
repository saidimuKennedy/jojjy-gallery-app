/**
 * Phase 1 homepage view-models.
 *
 * These are deliberately small, serializable shapes derived from the canonical
 * Prisma/API content in getStaticProps. They exist so the homepage components
 * never depend on Prisma/Decimal/Date internals and so the props survive
 * JSON serialization cleanly.
 */

export interface HomeArtwork {
  id: number;
  title: string;
  imageUrl: string;
  year: number | null;
  medium: string | null;
  price: number | null;
  status: string;
}

export interface HomeRelease {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  releaseType: string;
  artistName: string;
  releaseDate: string | null;
  accessMode: string;
  price: number | null;
  currency: string;
}

export interface HomeEvent {
  id: number;
  title: string;
  slug: string;
  imageUrl: string | null;
  venue: string | null;
  startsAt: string;
  status: string;
}

export interface HomeProduct {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: string | null;
  price: number | null;
}

export interface HomeStudioItem {
  id: number;
  title: string;
  imageUrl: string | null;
}

export interface HomeProps {
  artworks: HomeArtwork[];
  availableArtworks: HomeArtwork[];
  releases: HomeRelease[];
  events: HomeEvent[];
  products: HomeProduct[];
  studioItems: HomeStudioItem[];
}
