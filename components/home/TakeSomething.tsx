import { ArrowLink, Eyebrow, MediaFrame, Shell } from "@/components/home/primitives";
import { Reveal, RevealGroup, RevealItem } from "@/components/home/motion";
import type {
  HomeArtwork,
  HomeEvent,
  HomeProduct,
  HomeRelease,
} from "@/components/home/types";

interface ShopCategory {
  label: string;
  description: string;
  image?: string | null;
  href: string;
}

function matchesCategory(product: HomeProduct, keywords: string[]): boolean {
  const haystack = `${product.category ?? ""} ${product.name}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

export default function TakeSomething({
  availableArtworks,
  artworks,
  products,
  release,
  event,
  portrait,
}: {
  availableArtworks: HomeArtwork[];
  artworks: HomeArtwork[];
  products: HomeProduct[];
  release?: HomeRelease;
  event?: HomeEvent;
  /** Fallback image (repo portrait) for categories with no dedicated media. */
  portrait?: string;
}) {
  const editionProduct =
    products.find((product) =>
      matchesCategory(product, ["edition", "print", "poster"])
    ) ?? products[0];
  const objectProduct =
    products.find(
      (product) =>
        product !== editionProduct &&
        matchesCategory(product, ["object", "apparel", "book", "merch"])
    ) ?? products.find((product) => product !== editionProduct);

  const categories: ShopCategory[] = [
    {
      label: "Original Works",
      description: "One-of-one pieces from the studio.",
      image:
        availableArtworks[0]?.imageUrl ?? artworks[0]?.imageUrl ?? portrait,
      href: "/shop",
    },
    {
      label: "Editions",
      description: "Limited prints and objects.",
      image:
        editionProduct?.imageUrl ??
        availableArtworks[1]?.imageUrl ??
        portrait,
      href: "/shop",
    },
    {
      label: "Music",
      description: "Releases and special editions.",
      image: release?.coverImage ?? portrait,
      href: "/music",
    },
    {
      label: "Live",
      description: "Tickets and experiences.",
      image: event?.imageUrl ?? portrait,
      href: "/events",
    },
    {
      label: "Objects",
      description: "Apparel, books and more.",
      image: objectProduct?.imageUrl ?? portrait,
      href: "/shop",
    },
  ];

  return (
    <section className="border-t border-white/5 bg-black py-20 md:py-28 lg:py-32">
      <Shell>
        <Reveal y={18} duration={0.8}>
          <Eyebrow>Take Something With You</Eyebrow>
        </Reveal>

        <RevealGroup
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-8"
          stagger={0.06}
        >
          {categories.map((category) => (
            <RevealItem key={category.label} y={20}>
              <article className="group flex flex-col">
                <MediaFrame
                  src={category.image}
                  alt={category.label}
                  aspect="aspect-[4/5]"
                  preset="card"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 18vw"
                />
                <h3 className="jenga-cream mt-4 font-display text-lg font-light">
                  {category.label}
                </h3>
                <p className="jenga-body-text mt-2 text-sm leading-relaxed">
                  {category.description}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal y={14} duration={0.8} delay={0.15} className="mt-12 flex justify-end">
          <ArrowLink href="/shop">Shop Jenga</ArrowLink>
        </Reveal>
      </Shell>
    </section>
  );
}
