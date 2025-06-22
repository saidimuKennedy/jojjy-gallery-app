import { ReactNode } from "react";

interface GalleryLayoutProps {
  children: ReactNode;
}

export default function GalleryLayout({ children }: GalleryLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        {/* Gallery Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            Gallery Collection
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection of unique artworks, each piece
            telling its own story through the artist's creative vision.
          </p>
        </div>

        {/* Main Content */}
        {children}
      </main>
    </div>
  );
}
