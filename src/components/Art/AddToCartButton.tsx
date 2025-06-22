import { ShoppingCart } from "lucide-react";
import { Artwork } from "../../types/api";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  artwork: Artwork;
  className?: string;
  variant?: "default" | "minimal";
}

const AddToCartButton = ({
  artwork,
  className = "",
  variant = "default",
}: AddToCartButtonProps) => {
  const { addItem, items } = useCart();
  const isInCart = items.some((item) => item.id === artwork.id);

  const handleClick = () => {
    if (!isInCart) {
      addItem(artwork);
    }
  };

  if (variant === "minimal") {
    return (
      <button
        onClick={handleClick}
        disabled={isInCart}
        className={`w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium py-2 flex items-center justify-center transition-colors duration-200 ${className}`}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {isInCart ? "Added" : "Add to Cart"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isInCart}
      className={`rounded-lg bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white px-6 py-3 flex items-center justify-center transition-colors duration-200 ${className}`}
    >
      <ShoppingCart className="w-5 h-5 mr-2" />
      {isInCart ? "Added" : "Add to Cart"}
    </button>
  );
};

export default AddToCartButton;
