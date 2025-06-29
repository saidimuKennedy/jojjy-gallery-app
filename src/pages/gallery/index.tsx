import { useState } from "react";
import { useArtworks } from "@/hooks/useArtWorks";
import Head from "next/head";
import GalleryLayout from "@/components/Layout/GalleryLayout";
import SeriesNav from "@/components/ui/SeriesNav";
import ArtworkCard from "@/components/Art/ArtworkCard";

export default function GalleryPage() {
  const [currentFocusedImageUrl, setCurrentFocusedImageUrl] = useState<
    string | undefined
  >(undefined);

  const [searchTerm, setSearchTerm] = useState<string>("");

  const { artworks, isLoading, error } = useArtworks({
    search: searchTerm,
  });

  const handleFocusArtwork = (imageUrl: string) => {
    setCurrentFocusedImageUrl(imageUrl);
  };

  return (
    <GalleryLayout currentFocusedImageUrl={currentFocusedImageUrl}>
      <Head>
        <title>All Artworks - [Artist Name] Gallery</title>
        <meta
          name="description"
          content="Explore all artworks by [Artist Name]."
        />
      </Head>
      {/* Series Navigation (now SeriesNav) */}
      <SeriesNav activeSlug="all" onSearch={setSearchTerm} initialSearchQuery={searchTerm}/>{" "}
      {/* 'all' slug for the All Artworks view */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-light text-gray-900">All Artworks</h1>
        </div>

        {isLoading && (
          <div className="h-64 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 animate-spin rounded-full"></div>
          </div>
        )}

        {error && (
          <div className="h-64 flex items-center justify-center">
            <p className="text-red-600">Error loading artworks: {error}</p>
          </div>
        )}

        {!isLoading && !error && artworks.length === 0 && (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No artworks found.</p>
          </div>
        )}

        {!isLoading && !error && artworks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onFocus={handleFocusArtwork}
              />
            ))}
          </div>
        )}
      </div>
    </GalleryLayout>
  );
}
