import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

interface CardButtonProps {
  className?: string;
}

export default function CardButton({ className = "" }: CardButtonProps) {
  const { items, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className={`relative p-2 text-gray-500 hover:text-gray-900 transition-colors duration-200 ${className}`}
      aria-label={`Shopping cart with ${items.length} items`}
    >
      <ShoppingCart className="w-6 h-6" />
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {items.length}
        </span>
      )}
    </button>
  );
}
