import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "../ui/Footer";

interface GalleryLayoutProps {
  children: ReactNode;
  currentFocusedImageUrl?: string;
}

export default function GalleryLayout({
  children,
  currentFocusedImageUrl,
}: GalleryLayoutProps) {
  return (
    <div
      className="min-h-screen bg-white transition-background-image duration-500 ease-in-out"
      style={{
        backgroundImage: currentFocusedImageUrl
          ? `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${currentFocusedImageUrl})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {" "}
      <Navbar />
      <main className="container mx-auto  py-8">
        {/* Gallery Header */}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            View Collection
          </h1>
        </div>

        {/* Main Content */}
        {children}
      </main>
      <Footer/>
    </div>
  );
}
