import { Artwork } from "../../types/api";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  artwork: Artwork;
  className?: string;
  variant?: "default" | "minimal" | "acquire";
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

  if (variant === "acquire") {
    return (
      <button
        onClick={handleClick}
        disabled={isInCart}
        className={`w-full border border-neutral-900 bg-neutral-900 py-5 text-xs font-normal uppercase tracking-[0.28em] text-white transition-colors duration-500 hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300 disabled:text-white ${className}`}
      >
        {isInCart ? "Reserved" : "Acquire Artwork"}
      </button>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={handleClick}
        disabled={isInCart}
        className={`w-full bg-gray-900 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:bg-gray-400 ${className}`}
      >
        {isInCart ? "Added" : "Add to Cart"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isInCart}
      className={`rounded-lg bg-gray-900 px-6 py-3 text-white transition-colors duration-200 hover:bg-gray-800 disabled:bg-gray-400 ${className}`}
    >
      {isInCart ? "Added" : "Add to Cart"}
    </button>
  );
};

export default AddToCartButton;
