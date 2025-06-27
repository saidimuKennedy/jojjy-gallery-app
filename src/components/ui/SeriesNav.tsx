import { useState, useEffect } from "react";
import { useSeriesList } from "@/hooks/useArtWorks";
import CartButton from "./CartButton";
import Link from "next/link";

interface SeriesNavProps {
  activeSlug?: string;
}

export default function SeriesNav({ activeSlug }: SeriesNavProps) {
  const { seriesList, isLoading, error } = useSeriesList();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const show = window.scrollY > 100;
      setIsScrolled(show);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 animate-spin rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 flex items-center justify-center py-4">
        <p className="text-red-600">Error loading series.</p>
      </div>
    );
  }

  const navItems = [
    { name: "All Artworks", slug: "all" },
    ...(seriesList || []).map((series) => ({
      name: series.name,
      slug: series.slug,
    })),
  ];

  return (
    <div
      className={`sticky top-0 z-50 bg-white border-b border-gray-100 transition-all duration-200 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.slug}
                href={item.slug === "all" ? "/gallery" : `/series/${item.slug}`}
                passHref
              >
                <button
                  className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeSlug === item.slug
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </button>
              </Link>
            ))}
          </div>
          <div className="flex-shrink-0 ml-4">
            <CartButton />
          </div>
        </div>
      </div>
    </div>
  );
}
