import { useState, useEffect } from "react";
import { Artwork } from "../../types/api"; 
import ArtworkCard from "./ArtworkCard";

interface FeaturedSectionProps {
  artworks: Artwork[];
  onFocus: (imageUrl: string) => void;
}

const FeaturedSection = ({ artworks, onFocus }: FeaturedSectionProps) => {
  const [focusedArtwork, setFocusedArtwork] = useState<Artwork | undefined>(
    undefined
  );

  useEffect(() => {
    if (artworks && artworks.length > 0) {
      setFocusedArtwork(artworks[0]);
    } else {
      setFocusedArtwork(undefined);
    }
  }, [artworks]);

  const handleFocus = (imageUrl: string) => {
    onFocus(imageUrl);
    const artwork = artworks.find((art) => art.imageUrl === imageUrl);
    if (artwork) setFocusedArtwork(artwork);
  };

  if (!artworks || artworks.length === 0) {
    return (
      <section className="mb-24">
        <h2 className="text-3xl font-light text-gray-900 mb-2">
          Featured Work
        </h2>
        <p className="text-gray-500 mb-8 max-w-2xl">
          Discover our curated selection of exceptional artworks...
        </p>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No featured artworks available.</p>
        </div>
      </section>
    );
  }

  if (!focusedArtwork) {
    return (
      <section className="mb-24">
        <h2 className="text-3xl font-light text-gray-900 mb-2">
          Featured Work
        </h2>
        <p className="text-gray-500 mb-8 max-w-2xl">
          Discover our curated selection of exceptional artworks...
        </p>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading featured artwork details...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-24">
      {/* Hero Featured Artwork */}
      <div className="mb-20">
        <h2 className="text-3xl font-light text-gray-900 mb-2">
          Featured Work
        </h2>
        <p className="text-gray-500 mb-8 max-w-2xl">
          Discover our curated selection of exceptional artworks, each piece
          carefully chosen for its artistic excellence.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
            <img
              src={focusedArtwork.imageUrl}
              alt={focusedArtwork.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-light text-gray-900 mb-2">
                {focusedArtwork.title}
              </h3>
              <p className="text-gray-600">{focusedArtwork.artist}</p>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {focusedArtwork.description || "No description available."}{" "}
              {/* Handle null */}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Medium</p>
                  <p className="text-gray-900">
                    {focusedArtwork.medium || "N/A"}
                  </p>{" "}
                  {/* Handle null */}
                </div>
                <div>
                  <p className="text-gray-500">Dimensions</p>
                  <p className="text-gray-900">
                    {focusedArtwork.dimensions || "N/A"}
                  </p>{" "}
                  {/* Handle null */}
                </div>
                <div>
                  <p className="text-gray-500">Year</p>
                  <p className="text-gray-900">
                    {focusedArtwork.year || "N/A"}
                  </p>{" "}
                  {/* Handle null */}
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="text-gray-900">{focusedArtwork.category}</p>
                </div>
              </div>
              <p className="text-2xl font-light text-gray-900">
                KSH {focusedArtwork.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div>
        <h3 className="text-xl font-light text-gray-900 mb-6">
          More Featured Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              onFocus={handleFocus}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
