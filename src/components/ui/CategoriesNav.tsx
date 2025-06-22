import { useState, useEffect } from "react";
import { useArtworks } from "@/hooks/useArtWorks";
import CartButton from "./CartButton";

interface CategoriesNavProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoriesNav({
  selectedCategory,
  onCategoryChange,
}: CategoriesNavProps) {
  const { artworks } = useArtworks(); 
  const [isScrolled, setIsScrolled] = useState(false);

  // Get unique categories from artworks
  const categories = [
    "All",
    ...Array.from(new Set(artworks?.map((art) => art.category))).filter(
      Boolean
    ),
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const show = window.scrollY > 100;
      setIsScrolled(show);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-50 bg-white border-b border-gray-100 transition-all duration-200 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
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
