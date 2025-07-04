import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Play, ExternalLink, Image, Mic, Video, FileText } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import { APIResponse, MediaBlogEntryWithRelations } from "@/types/api";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch data");
  }
  return res.json();
};

const getMediaIcon = (type: string) => {
  switch (type) {
    case "VIDEO":
      return <Video className="w-6 h-6" />;
    case "IMAGES":
      return <Image className="w-6 h-6" />;
    case "AUDIO":
      return <Mic className="w-6 h-6" />;
    case "BLOG_POST":
      return <FileText className="w-6 h-6" />;
    case "EXTERNAL_LINK":
      return <ExternalLink className="w-6 h-6" />;
    default:
      return <Image className="w-6 h-6" />;
  }
};

const SingleMediaBlogEntryPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const shouldFetch = typeof id === "string";
  const {
    data: apiResponse,
    error,
    isLoading,
  } = useSWR<APIResponse<MediaBlogEntryWithRelations>>(
    shouldFetch ? `/api/media-blog/${id}` : null,
    fetcher
  );

  const mediaBlogEntry = apiResponse?.data;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
        <Navbar />
        <p className="text-xl font-semibold">Loading media blog entry...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
        <Navbar />
        <p className="text-xl font-semibold text-red-500">
          Error: {error.message}
        </p>
        <p className="text-gray-600 mt-2">Failed to load media blog entry.</p>
      </div>
    );
  }

  // Not found state
  if (!mediaBlogEntry) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
        <Navbar />
        <p className="text-xl font-semibold text-gray-500">
          Media blog entry not found.
        </p>
      </div>
    );
  }

  // Determine main media for display
  const mainMediaFile = mediaBlogEntry.mediaFiles?.[0];
  const isVideoOrAudio =
    mediaBlogEntry.type === "VIDEO" || mediaBlogEntry.type === "AUDIO";

  // Function to render media content based on type
  const renderMediaContent = () => {
    switch (mediaBlogEntry.type) {
      case "VIDEO":
        // For YouTube/Vimeo, you'd typically extract the video ID and use an iframe
        if (
          mediaBlogEntry.externalLink &&
          (mediaBlogEntry.externalLink.includes("youtube.com") ||
            mediaBlogEntry.externalLink.includes("youtu.be"))
        ) {
          const videoId =
            mediaBlogEntry.externalLink.split("v=")[1] ||
            mediaBlogEntry.externalLink.split("/").pop();
          return (
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={mediaBlogEntry.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          );
        }
        // Fallback for other video links or if no proper embed link
        return (
          <div className="relative bg-gray-100 aspect-video w-full flex items-center justify-center">
            {mediaBlogEntry.thumbnailUrl && (
              <img
                src={mediaBlogEntry.thumbnailUrl}
                alt={mediaBlogEntry.title}
                className="w-full h-full object-cover absolute inset-0"
              />
            )}
            <Play className="w-24 h-24 text-white z-10" fill="white" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <p className="text-white text-xl">
                Video content (Click external link below)
              </p>
            </div>
          </div>
        );

      case "IMAGES":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaBlogEntry.mediaFiles &&
            mediaBlogEntry.mediaFiles.length > 0 ? (
              mediaBlogEntry.mediaFiles.map((file) => (
                <motion.img
                  key={file.id}
                  src={file.url}
                  alt={file.description || mediaBlogEntry.title}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              ))
            ) : (
              // Optional: Display a message if no images are found
              <p className="col-span-full text-center text-gray-500">
                No images available for this entry.
              </p>
            )}
          </div>
        );

      case "AUDIO":
        // For audio, you might embed an <audio> tag or link to a player
        return (
          <div className="bg-gray-100 aspect-video w-full flex items-center justify-center flex-col p-8 rounded-lg shadow-md">
            <Mic className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              Audio Entry
            </h3>
            {mediaBlogEntry.duration && (
              <p className="text-xl text-gray-600 mb-4">
                Duration: {mediaBlogEntry.duration}
              </p>
            )}
            {mainMediaFile?.url && (
              <audio controls className="w-full max-w-md">
                <source src={mainMediaFile.url} type="audio/mpeg" />{" "}
                {/* Adjust type if necessary */}
                Your browser does not support the audio element.
              </audio>
            )}
            {!mainMediaFile?.url && (
              <p className="text-gray-500">
                Audio file not directly embedded. Click external link to listen.
              </p>
            )}
          </div>
        );

      case "BLOG_POST":
        return (
          <div className="prose max-w-none lg:prose-lg p-4 bg-gray-50 rounded-lg shadow-inner">
            {mediaBlogEntry.thumbnailUrl && (
              <img
                src={mediaBlogEntry.thumbnailUrl}
                alt="Blog Post Cover"
                className="w-full h-auto max-h-96 object-cover mb-6 rounded-lg"
              />
            )}
            <div
              dangerouslySetInnerHTML={{ __html: mediaBlogEntry.content || "" }}
            />
          </div>
        );

      case "EXTERNAL_LINK":
        return (
          <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
            <ExternalLink className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              External Content
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              {mediaBlogEntry.shortDesc}
            </p>
            {mediaBlogEntry.thumbnailUrl && (
              <img
                src={mediaBlogEntry.thumbnailUrl}
                alt="External Link Thumbnail"
                className="w-full h-48 object-cover mb-4 rounded-lg"
              />
            )}
            <motion.a
              href={mediaBlogEntry.externalLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium text-lg"
            >
              Go to External Content
              <ExternalLink className="w-6 h-6" />
            </motion.a>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center text-gray-500">
            No media content to display for this entry type.
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen bg-white text-black"
      style={{ fontFamily: "Ubuntu, sans-serif" }}
    >
      <Navbar />
      <div className="border-b border-gray-300 bg-white pt-8 pb-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            {getMediaIcon(mediaBlogEntry.type)}
            <span className="text-lg text-gray-500 uppercase tracking-wider font-medium">
              {mediaBlogEntry.type.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            {mediaBlogEntry.title}
          </h1>
          <p className="text-gray-600 text-xl leading-relaxed">
            {mediaBlogEntry.shortDesc}
          </p>
          {mediaBlogEntry.externalLink && (
            <motion.a
              href={mediaBlogEntry.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 5 }}
              className="inline-flex items-center gap-2 text-black hover:text-gray-600 transition-colors font-medium mt-4"
            >
              <span>View Original Source</span>
              <ExternalLink className="w-5 h-5" />
            </motion.a>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          {renderMediaContent()}
        </motion.div>

        {/* Display main content for all types, especially for BLOG_POST */}
        {mediaBlogEntry.content &&
          mediaBlogEntry.type !== "BLOG_POST" && ( // Blog post content is handled in renderMediaContent
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose max-w-none lg:prose-lg text-gray-700"
            >
              <div
                dangerouslySetInnerHTML={{ __html: mediaBlogEntry.content }}
              />
            </motion.div>
          )}
      </div>

      <div className="h-20 bg-gray-50 border-t border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-sm">End of entry</p>
      </div>
    </div>
  );
};

export default SingleMediaBlogEntryPage;
