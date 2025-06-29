import React, { useState } from "react";
import { X, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import PaymentModal from "../Payment/PaymentModal"; // Corrected import path for PaymentModal
import toast from "react-hot-toast"; // Import toast
import { useRouter } from "next/router"; // Import useRouter for navigation
import { PaymentSuccessData } from "@/types/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, total, removeItem, clearCart, closeCart } = useCart();
  const { user, isLoadingAuth } = useAuth(); // Destructure user and isLoadingAuth from useAuth
  const router = useRouter(); // Initialize router for redirection

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<
    string | null
  >(null);

  if (!isOpen) return null;

  const overlayClasses = `
    fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300
    z-[900]
    ${isOpen ? "opacity-100" : "opacity-0"}
  `.trim();

  const drawerClasses = `
    fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl
    transition-transform duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "translate-x-full"}
    z-[901] flex flex-col
  `.trim();

  // Custom Toast Component for Login Prompt
  const LoginPromptToast: React.FC<{ t: any; message: string }> = ({
    t,
    message,
  }) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-md pointer-events-auto flex ring-1 ring-black ring-opacity-5 divide-x divide-gray-200`}
      // Styling for less rounded corners: Use rounded-md for a slight curve, or rounded-none for sharp.
      // rounded-md is good for a slightly less rounded appearance compared to rounded-lg or rounded-xl
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {/* Custom icon (example: a warning icon) - unchanged as it's functional */}
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.174 3.353 1.94 3.353h14.053c1.766 0 2.806-1.853 1.94-3.353L12 2.25 2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            <button
              onClick={() => {
                toast.dismiss(t.id); // Dismiss the toast
                router.push("/login"); // Redirect to login page
              }}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-sm shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" // Less rounded button, black background
            >
              Login
            </button>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {/* Custom black X icon for dismissal */}
          <X className="w-5 h-5 text-black" />{" "}
          {/* <--- Applied text-black here */}
        </button>
      </div>
    </div>
  );

  const handleCheckoutClick = () => {
    // --- AUTHENTICATION CHECK (Reinstated isLoadingAuth) ---
    // Prevent checkout if user is not authenticated and not currently loading auth state
    if (!user && !isLoadingAuth) {
      // Check both user status AND loading status
      toast.custom(
        (
          t // Use toast.custom for full control over rendering
        ) => (
          <LoginPromptToast
            t={t}
            message={"Please log in to proceed with payment."}
          />
        ),
        {
          duration: 4000, // Toast duration
          position: "top-center", // Position of the toast on the screen
        }
      );
      return; // Stop the function here
    }
    // --- END AUTHENTICATION CHECK ---

    if (items.length === 0) {
      toast.error("Your cart is empty. Add items to proceed.", {
        duration: 3000,
      });
      return;
    }

    // If authenticated and cart is not empty, proceed to payment modal
    const cartDetailsForPayment = {
      totalAmount: total,
      artworkIds: items.map((item) => item.id),
    };

    setIsPaymentModalOpen(true);
    setPaymentSuccessMessage(null);
  };

  const handlePaymentSuccess = (data: PaymentSuccessData) => {
    console.log("Payment successful:", data);
    setPaymentSuccessMessage(
      `Payment successful! Transaction ID: ${data.transactionId}`
    );
    clearCart();
    // closeCart(); // Optionally close the main cart drawer too
  };

  return (
    <>
      {/* Overlay */}
      <div className={overlayClasses} onClick={onClose} />

      {/* Main Drawer Container */}
      <div className={drawerClasses}>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-4 py-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center">
            <ShoppingCart className="w-6 h-6 text-gray-900 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              Your Collection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message - Fixed position */}
        {paymentSuccessMessage && (
          <div className="flex-shrink-0 bg-green-50 border-l-4 border-green-400 text-green-700 p-4 mx-4 mt-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Success!</p>
                <p className="text-sm">{paymentSuccessMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items - Scrollable with proper flex-grow */}
        <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Your collection is empty</p>
              <p className="text-gray-400 text-sm mt-2">
                Add some beautiful artworks to get started
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {item.artist}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 ml-4 flex-shrink-0">
                        $ {item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
                      >
                        Remove from collection
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-6">
          <div className="space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                $ {total.toLocaleString()}
              </span>
            </div>

            {/* Shipping info */}
            <p className="text-xs text-gray-500 text-center">
              Shipping and taxes calculated at checkout
            </p>

            {/* Checkout button */}
            <button
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                items.length === 0 || isLoadingAuth // Added isLoadingAuth to disable prop
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
              onClick={handleCheckoutClick}
              disabled={items.length === 0 || isLoadingAuth} // Added isLoadingAuth to disable prop
            >
              {items.length === 0
                ? "Cart is Empty"
                : `Checkout (${items.length} ${
                    items.length === 1 ? "item" : "items"
                  })`}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          cartDetails={{
            totalAmount: total,
            artworkIds: items.map((item) => item.id),
          }}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default CartDrawer;
