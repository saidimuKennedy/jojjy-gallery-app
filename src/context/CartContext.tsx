import { createContext, useContext, useReducer, ReactNode, useState } from "react";
import { Artwork } from "../types/api"; 

interface CartItem extends Artwork {
  // Add any cart-specific properties if necessary, e.g., quantity
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Artwork }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "CLEAR_CART" };

interface CartContextType extends CartState {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (artwork: Artwork) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM":
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        // If you want to handle quantity:
        // return {
        //   ...state,
        //   items: state.items.map(item =>
        //     item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
        //   ),
        //   total: state.total + parseFloat(String(action.payload.price)) // Ensure price is number
        // };
        // For now, since items are unique artworks, just return state if already in cart
        return state;
      }
      // Ensure action.payload.price is parsed as a float (number)
      const priceToAdd = parseFloat(String(action.payload.price));
      return {
        ...state,
        items: [...state.items, { ...action.payload }], // Add quantity if applicable
        total: state.total + (isNaN(priceToAdd) ? 0 : priceToAdd), // Add parsed price, handle NaN
      };
    case "REMOVE_ITEM":
      const itemToRemove = state.items.find(
        (item) => item.id === action.payload
      );
      // Ensure itemToRemove.price is parsed as a float (number)
      const priceToRemove = parseFloat(String(itemToRemove?.price || 0));
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
        total: state.total - (isNaN(priceToRemove) ? 0 : priceToRemove), // Subtract parsed price, handle NaN
      };
    case "CLEAR_CART":
      return { items: [], total: 0 };
    default:
      return state;
  }
};

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addItem = (artwork: Artwork) => {
    dispatch({ type: "ADD_ITEM", payload: artwork });
  };

  const removeItem = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };
  return (
    <CartContext.Provider
      value={{
        ...state,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}