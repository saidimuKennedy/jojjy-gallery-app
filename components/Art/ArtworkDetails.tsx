import { useState } from "react";
import Link from "next/link";
import { ArtworkWithRelations } from "../../types/api";
import { Heart } from "lucide-react";

interface ArtworkDetailsProps {
  artwork: ArtworkWithRelations;
}

const ArtworkDetails = ({ artwork }: ArtworkDetailsProps) => {
  const [likes, setLikes] = useState(artwork.likes);

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

  const canBuy =
    artwork.isAvailable &&
    artwork.status === "AVAILABLE" &&
    (artwork.price ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-light text-gray-900 mb-2">
          {artwork.title}
        </h3>
        <p className="text-gray-600">{artwork.artist}</p>
        {artwork.series && (
          <p className="text-sm text-gray-500 mt-1">
            Series: {artwork.series.name}
          </p>
        )}
      </div>
      <p className="text-gray-600 leading-relaxed">{artwork.description}</p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Medium</p>
            <p className="text-gray-900">{artwork.medium}</p>
          </div>
          <div>
            <p className="text-gray-500">Dimensions</p>
            <p className="text-gray-900">{artwork.dimensions}</p>
          </div>
          <div>
            <p className="text-gray-500">Year</p>
            <p className="text-gray-900">{artwork.year}</p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="text-gray-900">{artwork.category}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            className="flex items-center text-gray-500 hover:text-pink-500 transition-colors"
          >
            <Heart className="w-5 h-5 mr-2" />
            {likes} likes
          </button>
        </div>
        <Link
          href={canBuy ? `/shop/${artwork.id}` : "/shop"}
          className="inline-block border border-neutral-900 bg-neutral-900 px-5 py-3 font-display text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-neutral-900"
        >
          {canBuy ? "Acquire in Studio Shop →" : "Browse Studio Shop →"}
        </Link>
      </div>
    </div>
  );
};

export default ArtworkDetails;
