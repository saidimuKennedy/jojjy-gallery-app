// components/ui/SearchBar.tsx
import { ChangeEvent } from "react"; // [cite: 454]
import { Search } from "lucide-react"; // Import Search icon

export default function SearchBar() {
  // [cite: 454]
  return (
    <div className="relative w-full max-w-sm">
      {" "}
      {/* Added wrapper for icon positioning */}
      <input
        type="search"
        placeholder="Search artworks..."
        className="pl-12 pr-4 py-2.5 rounded bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-full transition-all duration-200"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          // [cite: 454]
          // TODO: Implement search functionality
          console.log(e.target.value); // [cite: 454]
        }}
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>
  );
} // [cite: 455]
