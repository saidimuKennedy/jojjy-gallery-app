import { useState } from "react";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  initialQuery = "",
  placeholder = "Search artworks, artist, series...",
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-grow px-4 py-2 border border-neutral-300 rounded-md text-neutral-800
                   focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent
                   transition-all duration-200 text-sm"
      />
      <button
        type="submit"
        className="bg-neutral-900 text-white p-2 rounded-md hover:bg-neutral-700
                   transition-colors duration-200 flex items-center justify-center
      "
        aria-label="Perform search"
      >
        <SearchIcon size={20} />
      </button>
    </form>
  );
}
