import { ArtworkWithRelations } from "../../types/api";
import { Heart, Eye, Sparkles, ChevronRightCircle } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ArtworkCardProps {
  artwork: ArtworkWithRelations;
  onFocus: (imageUrl: string) => void;
}

const ArtworkCard = ({ artwork, onFocus }: ArtworkCardProps) => {
  const [likes, setLikes] = useState(artwork.likes);
  const [views, setViews] = useState(artwork.views);
  const [isLiked, setIsLiked] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/artworks/${artwork.id}/like`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setLikes((prev) => prev + 1);
        setIsLiked(true);
        setTimeout(() => setIsLiked(false), 1000);
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

  // Animation variants
  const cardVariants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.03,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const overlayVariants = {
    initial: { opacity: 0, backdropFilter: "blur(0px)" },
    hover: {
      opacity: 1,
      backdropFilter: "blur(12px)",
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const contentVariants = {
    initial: { y: 8, opacity: 0 },
    hover: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, delay: 0.1, ease: "easeOut" },
    },
  };

  const statsVariants = {
    initial: { y: 8, opacity: 0 },
    hover: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, delay: 0.2, ease: "easeOut" },
    },
  };

  const likeButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
    liked: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const heartVariants = {
    initial: { scale: 1, rotate: 0 },
    liked: {
      scale: [1, 1.4, 1.1],
      rotate: [0, -10, 5, 0],
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const sparkleVariants = {
    initial: { scale: 0, opacity: 0, rotate: 0 },
    liked: {
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180, 360],
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const viewActionVariants = {
    initial: { x: 0 },
    hover: {
      x: 4,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const chevronVariants = {
    initial: { x: 0, rotate: 0 },
    hover: {
      x: 6,
      rotate: 5,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <Link href={`/artworks/${artwork.id}`} passHref>
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        className="relative group overflow-hidden shadow-lg hover:shadow-2xl transform transition-shadow duration-500 ease-out bg-white border border-gray-200/50 hover:border-gray-300/70 rounded-lg backdrop-blur-sm cursor-pointer"
        onMouseEnter={() => {
          setIsHovered(true);
          onFocus(artwork.imageUrl);
          handleView();
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle gradient border effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-100/20 via-transparent to-gray-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Artwork Image */}
        <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
          {/* Loading shimmer effect */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}

          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* Subtle image overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Basic Artwork Info */}
        <div className="p-6 bg-white rounded-b-lg">
          <div className="space-y-2">
            <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-200">
              {artwork.title}
            </h3>
            <p className="text-sm text-gray-600 font-light tracking-wide">
              {artwork.artist}
            </p>
          </div>
        </div>

        {/* Enhanced Gallery-style Hover Overlay */}
        <motion.div
          variants={overlayVariants}
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          className="fixed inset-0 bg-gradient-to-br from-white/97 via-white/95 to-white/93 flex flex-col justify-between p-6 rounded-lg pointer-events-none"
          style={{ pointerEvents: isHovered ? "auto" : "none" }}
        >
          <motion.div variants={contentVariants} className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xl font-light text-gray-900 leading-tight">
                {artwork.title}
              </h3>
              <p className="text-gray-900 text-sm leading-relaxed line-clamp-3 opacity-90">
                {artwork.description}
              </p>
            </div>
          </motion.div>

          <motion.div variants={statsVariants} className="space-y-4">
            <div className="flex justify-between items-center w-full text-sm text-gray-700">
              {/* Left side: Likes and Views */}
              <div className="flex items-center space-x-6">
                {/* Like Button */}
                <motion.button
                  variants={likeButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  animate={isLiked ? "liked" : "initial"}
                  onClick={handleLike}
                  className={`flex items-center relative transition-colors duration-300 ${
                    isLiked
                      ? "text-pink-500"
                      : "text-gray-500 hover:text-pink-500"
                  }`}
                >
                  <div className="relative">
                    <motion.div
                      variants={heartVariants}
                      animate={isLiked ? "liked" : "initial"}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 transition-all duration-300 ${
                          isLiked ? "fill-current" : ""
                        }`}
                      />
                    </motion.div>

                    {/* Sparkle effect */}
                    <AnimatePresence>
                      {isLiked && (
                        <motion.div
                          variants={sparkleVariants}
                          initial="initial"
                          animate="liked"
                          exit="initial"
                          className="absolute -top-1 -right-1"
                        >
                          <Sparkles className="w-3 h-3 text-pink-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.span
                    className="font-medium"
                    key={likes} // This will trigger re-render when likes change
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {likes}
                  </motion.span>
                </motion.button>

                {/* Views */}
                <motion.div
                  className="flex items-center text-gray-500"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  <motion.span
                    className="font-medium"
                    key={views}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {views}
                  </motion.span>
                </motion.div>
              </div>

              {/* Right side: View Action */}
              <motion.div
                variants={viewActionVariants}
                whileHover="hover"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-300 cursor-pointer group/action"
              >
                <span className="font-medium text-sm whitespace-nowrap">View Art</span>
                <motion.div variants={chevronVariants}>
                  <ChevronRightCircle className="w-5 h-5" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Link>
  );
};

export default ArtworkCard;
