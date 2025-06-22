import { Artwork } from "../../types/api";
import ArtworkCard from "./ArtworkCard";
import { useArtworks } from "@/hooks/useArtWorks";

interface FeaturingSectionProps {
  onFocus: (imageUrl: string) => void;
  selectedCategory?: string;
}

const FeaturingSection = ({
  onFocus,
  selectedCategory,
}: FeaturingSectionProps) => {
  const { artworks, isLoading, error } = useArtworks(
    selectedCategory ? { category: selectedCategory } : undefined
  );

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-red-600">Error loading artworks: {error}</p>
      </div>
    );
  }

  if (!artworks?.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No artworks found in this category</p>
      </div>
    );
  }

  const normalizeArtwork = (artwork: any): Artwork => ({
    id: artwork.id,
    title: artwork.title,
    artist: artwork.artist,
    category: artwork.category,
    price: artwork.price,
    imageUrl: artwork.imageUrl,
    description: artwork.description || "",
    dimensions: artwork.dimensions || "",
    isAvailable: artwork.isAvailable || true,
    views: artwork.views,
    likes: artwork.likes,
    medium: artwork.medium,
    year: artwork.year,
    createdAt: artwork.createdAt,
    updatedAt: artwork.updatedAt,
    featured: artwork.featured || false,
  });

  return (
    <section className="mb-20">
      {/* Section Header */}
      <div className="mb-12">
        <h2 className="text-2xl font-light text-gray-900 mb-6">
          {selectedCategory ? `${selectedCategory} Collection` : "All Artworks"}
        </h2>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.map((artwork) => (
          <ArtworkCard
            key={artwork.id}
            artwork={normalizeArtwork(artwork)}
            onFocus={onFocus}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturingSection;
