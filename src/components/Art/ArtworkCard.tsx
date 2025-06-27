import { ArtworkWithRelations } from "../../types/api";
import { Heart, Eye } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import { useState } from "react";

interface ArtworkCardProps {
  artwork: ArtworkWithRelations;
  onFocus: (imageUrl: string) => void;
}

const ArtworkCard = ({ artwork, onFocus }: ArtworkCardProps) => {
  const [likes, setLikes] = useState(artwork.likes);
  const [views, setViews] = useState(artwork.views);

  const defaultCurrency = process.env.NEXT_PUBLIC_CURRENCY;

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/artworks/${artwork.id}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setLikes((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error liking artwork:", error);
    }
  };

  const handleView = async () => {
    try {
      const response = await fetch(`/api/artworks/${artwork.id}/view`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setViews((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  return (
    <div
      className="relative group overflow-hidden shadow-sm transform hover:scale-[1.02] transition-all duration-300 ease-in-out bg-white border border-gray-100"
      onMouseEnter={() => {
        onFocus(artwork.imageUrl);
        handleView();
      }}
    >
      {/* Artwork Image */}
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Basic Artwork Info */}
      <div className="p-6 bg-white">
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {artwork.title}
          </h3>
          <p className="text-sm text-gray-500">{artwork.artist}</p>
        </div>
      </div>

      {/* Gallery-style Hover Overlay */}
      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-light text-gray-900">
              {artwork.title}
            </h3>
            <p className="text-sm text-gray-600">{artwork.artist}</p>
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
              {artwork.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className="flex items-center hover:text-pink-500 transition-colors"
              >
                <Heart className="w-4 h-4 mr-1" /> {likes}
              </button>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" /> {views}
              </span>
            </div>
            {/* Conditional pricing based on inGallery */}
            {!artwork.inGallery ? (
              <p className="font-medium text-gray-900">
                {defaultCurrency} {artwork.price.toLocaleString()}
              </p>
            ) : (
              <p className="font-medium text-gray-700 text-sm">
                In Gallery - Contact for Price
              </p>
            )}
          </div>

          {/* Conditionally hide AddToCartButton if inGallery is true */}
          {!artwork.inGallery && (
            <AddToCartButton artwork={artwork} variant="minimal" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;
