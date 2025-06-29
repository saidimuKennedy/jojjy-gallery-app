import { useRouter } from "next/router";
import { useState } from "react";
import { useSeries } from "@/hooks/useArtWorks";
import Head from "next/head";
import GalleryLayout from "@/components/Layout/GalleryLayout";
import SeriesNav from "@/components/ui/SeriesNav";
import ArtworkCard from "@/components/Art/ArtworkCard";

export default function SeriesPage() {
  const router = useRouter(); 
  const { slug } = router.query; 

  const [currentFocusedImageUrl, setCurrentFocusedImageUrl] = useState<
    string | undefined
  >(undefined);

  const { series, isLoading, error } = useSeries(slug as string); 

  const handleFocusArtwork = (imageUrl: string) => {
    setCurrentFocusedImageUrl(imageUrl);
  };

  if (!slug || isLoading) {
    return (
      <GalleryLayout currentFocusedImageUrl={currentFocusedImageUrl}>
        <div className="h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 animate-spin rounded-full"></div>
        </div>
      </GalleryLayout>
    );
  }

  if (error) {
    return (
      <GalleryLayout currentFocusedImageUrl={currentFocusedImageUrl}>
        <div className="h-screen flex items-center justify-center">
          <p className="text-red-600">Error loading series: {error}</p>
        </div>
      </GalleryLayout>
    );
  }

  if (!series) {
    return (
      <GalleryLayout currentFocusedImageUrl={currentFocusedImageUrl}>
        <div className="h-screen flex items-center justify-center">
          <p className="text-gray-500">Series not found.</p>
        </div>
      </GalleryLayout>
    );
  }

  return (
    <GalleryLayout currentFocusedImageUrl={currentFocusedImageUrl}>
      <Head>
        <title>{series.name} - [Artist Name] Gallery</title>
        <meta
          name="description"
          content={
            series.description ||
            `Explore artworks from the ${series.name} series by [Artist Name].`
          }
        />
      </Head>

      {/* Series Navigation (now SeriesNav) */}
      <SeriesNav activeSlug={series.slug} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            {series.name}
          </h1>
          {series.description && (
            <p className="text-gray-600 max-w-3xl leading-relaxed">
              {series.description}
            </p>
          )}
        </div>

        {series.artworks.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No artworks found in this series.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {series.artworks.map((artwork) => (
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
