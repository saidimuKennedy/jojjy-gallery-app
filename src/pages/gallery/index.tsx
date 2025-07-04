import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  ExternalLink,
  Image,
  Mic,
  Video,
  ChevronUp,
  FileText,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import useSWR from "swr";
import { APIResponse, MediaBlogEntryWithRelations } from "@/types/api";
import { MediaBlogEntryType, MediaFileType } from "@prisma/client";

interface TransformedMediaItem {
  id: number;
  type:
    | "video"
    | "images"
    | "audio"
    | "blog_post"
    | "external_link"
    | "unknown";
  title: string;
  shortDesc: string;
  thumbnail?: string;
  images?: string[];
  duration?: string;
  externalLink?: string;
  content?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch data");
  }
  return res.json();
};

const MediaBlogPage = () => {
  const [currentImageSet, setCurrentImageSet] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<{
    [key: number]: boolean;
  }>({});

  const {
    data: apiResponse,
    error,
    isLoading,
  } = useSWR<APIResponse<MediaBlogEntryWithRelations[]>>(
    "/api/media-blog",
    fetcher
  );

  const fetchedMediaEntries = apiResponse?.data || [];

  const mediaItems: TransformedMediaItem[] = fetchedMediaEntries
    .map((entry) => {
      const transformedItem: TransformedMediaItem = {
        id: entry.id,
        title: entry.title,
        shortDesc: entry.shortDesc || "",
        externalLink: entry.externalLink || "",
        type: "unknown",
      };

      switch (entry.type) {
        case MediaBlogEntryType.VIDEO:
          transformedItem.type = "video";
          transformedItem.thumbnail =
            entry.thumbnailUrl ||
            entry.mediaFiles?.find((f) => f.type === MediaFileType.VIDEO)
              ?.url ||
            "/api/placeholder/600/400";
          transformedItem.duration = entry.duration || "";
          break;
        case MediaBlogEntryType.IMAGES:
          transformedItem.type = "images";
          transformedItem.images = (entry.mediaFiles ?? [])
            .filter((f) => f.type === MediaFileType.IMAGE)
            .map((f) => f.url);
          if (transformedItem.images.length === 0) {
            transformedItem.images = ["/api/placeholder/600/400"];
          }
          break;
        case MediaBlogEntryType.AUDIO:
          transformedItem.type = "audio";
          transformedItem.duration = entry.duration || "";
          transformedItem.thumbnail =
            entry.thumbnailUrl || "/api/placeholder/600/400";
          break;
        case MediaBlogEntryType.BLOG_POST:
          transformedItem.type = "blog_post";
          transformedItem.content = entry.content || "";
          transformedItem.thumbnail =
            entry.thumbnailUrl || "/api/placeholder/600/400";
          break;
        case MediaBlogEntryType.EXTERNAL_LINK:
          transformedItem.type = "external_link";
               transformedItem.thumbnail =
            entry.thumbnailUrl || "/api/placeholder/600/400";
          break;
        default:
          transformedItem.type = "unknown";
          break;
      }
      return transformedItem;
    })
      .filter((item) =>
      ["video", "images", "audio", "blog_post", "external_link"].includes(
        item.type
      )
    );

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate image sets - now depends on the fetched `mediaItems`
  useEffect(() => {
    const imageItems = mediaItems.filter((item) => item.type === "images");
    if (imageItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageSet((prev) => (prev + 1) % imageItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
    // Clear interval if no image items, or if component unmounts
    return () => {};
  }, [mediaItems]); // Add mediaItems to dependency array

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleVideo = useCallback((id: number) => {
    setIsVideoPlaying((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Updated to accept the string type from transformed mediaItems
  const getMediaIcon = useCallback((type: TransformedMediaItem["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "images":
        return <Image className="w-5 h-5" />;
      case "audio":
        return <Mic className="w-5 h-5" />;
      case "blog_post":
        return <FileText className="w-5 h-5" />; // New icon for blog post
      case "external_link":
        return <ExternalLink className="w-5 h-5" />; // New icon for external link
      default:
        return <Image className="w-5 h-5" />;
    }
  }, []);

  // Render loading/error states before attempting to map data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
        <p className="text-xl font-semibold">Loading media content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-white text-black flex flex-col items-center justify-center"
        style={{ fontFamily: "Ubuntu, sans-serif" }}
      >
        <p className="text-xl font-semibold text-red-500">
          Error:{" "}
          {typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error)}
        </p>
        <p className="text-gray-600 mt-2">
          Failed to load media entries. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      {/* Header */}
      <div className="border-b border-gray-300 bg-white sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold mb-2">Media Archive</h1>
          <p className="text-gray-600">
            A curated collection of visual stories and experiences
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {mediaItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No media entries found.
          </div>
        ) : (
          mediaItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex items-center gap-12 mb-24 ${
                index % 2 === 1 ? "flex-row-reverse" : ""
              }`}
            >
              {/* Media Side */}
              <div className="flex-1">
                {/* Video Items */}
                {item.type === "video" && (
                  <div className="relative bg-gray-100 aspect-video">
                    {/* Placeholder for actual video embed */}
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleVideo(item.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-20 transition-all"
                    >
                      <Play className="w-20 h-20 text-white" fill="white" />
                    </motion.button>
                    {isVideoPlaying[item.id] && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        <p className="text-white text-2xl">Video Playing</p>
                        {/* Here you would embed the actual video player */}
                      </div>
                    )}
                  </div>
                )}

                {/* Image Items */}
                {item.type === "images" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <img
                        src={item.images?.[0]} // Use optional chaining
                        alt={item.title}
                        className="w-full h-80 object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 col-span-2">
                      {item.images?.slice(1, 4).map(
                        (
                          image,
                          idx // Use optional chaining
                        ) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`${item.title} ${idx + 2}`}
                            className="w-full h-32 object-cover"
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Items */}
                {item.type === "audio" && (
                  <div className="bg-gray-100 aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Mic className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-gray-600">
                        {item.duration}
                      </p>
                      <p className="text-gray-500 mt-2">Audio Recording</p>
                      {/* Here you would embed the actual audio player */}
                    </div>
                  </div>
                )}

                {/* Blog Post / External Link - Basic display if no primary media */}
                {(item.type === "blog_post" ||
                  item.type === "external_link") && (
                  <div className="bg-gray-100 aspect-video flex items-center justify-center flex-col p-4 text-center">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt="Entry thumbnail"
                        className="w-full h-48 object-cover mb-4 rounded-md"
                      />
                    )}
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      {item.type === "blog_post"
                        ? "Blog Post"
                        : "External Link"}
                    </h3>
                    <p className="text-gray-500 text-sm">{item.shortDesc}</p>
                  </div>
                )}
              </div>

              {/* Description Side */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  {getMediaIcon(item.type)}
                  <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                    {item.type.replace(/_/g, " ")}{" "}
                    {/* Display type name nicely */}
                  </span>
                </div>

                <h2 className="text-3xl font-bold leading-tight">
                  {item.title}
                </h2>

                <p className="text-gray-600 text-lg leading-relaxed">
                  {item.shortDesc}
                </p>

                <div className="pt-4">
                  <motion.a
                    href={item.externalLink}
                    target="_blank" // Open external links in new tab
                    rel="noopener noreferrer" // Security best practice
                    whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors font-medium"
                  >
                    <span>
                      {item.type === "blog_post"
                        ? "Read Full Post"
                        : "View Content"}
                    </span>
                    <ExternalLink className="w-5 h-5" />
                    {/* The "chevron right" text might be redundant if using icon */}
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -10, 0],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              y: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-black text-white p-4 hover:bg-gray-800 transition-colors z-20"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
      {/* Footer Space */}
      <div className="h-20 bg-gray-50 border-t border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-sm">End of media archive</p>
      </div>
    </div>
  );
};

export default MediaBlogPage;
