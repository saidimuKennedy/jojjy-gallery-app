import { useState } from "react";
import { Phone, X, Loader, CreditCard, ShieldCheck } from "lucide-react";
import {
  PaymentSuccessData,
  PaymentResponse,
  CartPaymentRequestData,
} from "../../types/api";

interface CartDetailsForPayment {
  totalAmount: number;
  artworkIds: number[];
}

interface PaymentModalProps {
  cartDetails: CartDetailsForPayment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: PaymentSuccessData) => void;
}

export default function PaymentModal({
  cartDetails,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: CartPaymentRequestData = {
        phoneNumber,
        artworkIds: cartDetails.artworkIds,
      };

      const response = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: PaymentResponse = await response.json();

      if (data.success && data.data) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || "An unknown error occurred.");
      }
    } catch (err) {
      console.error("Payment fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[950] p-4">
      <div className="bg-white shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">MPESA Payment</h3>
              <p className="text-sm text-gray-500">Secure checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Cart Summary */}
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-800">Order Summary</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Items</span>
                <span className="font-medium text-gray-800">
                  {cartDetails.artworkIds.length} artwork{cartDetails.artworkIds.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">
                  KSH {cartDetails.totalAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">
                    KSH {cartDetails.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-6">
            <form onSubmit={handlePayment} className="space-y-6">
              {/* Phone Number Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                    pattern="[0-9]{10}"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter your Safaricom number to receive payment prompt
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Secure Payment</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your payment is processed securely through MPESA. You'll receive a prompt on your phone to complete the transaction.
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-block">
                🔧 Demo Mode: Payment simulation enabled
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}