import { useState } from "react";
import { Artwork } from "../../types/api";
import { Heart } from "lucide-react";

interface ArtworkDetailsProps {
  artwork: Artwork;
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-light text-gray-900 mb-2">
          {artwork.title}
        </h3>
        <p className="text-gray-600">{artwork.artist}</p>
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
          <p className="text-2xl font-light text-gray-900">
            KSH {artwork.price.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetails;
