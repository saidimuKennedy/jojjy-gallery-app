import { CartProvider } from "@/context/CartContext";
import "@/styles/globals.css";
import Layout from "@/components/Layout/Layout";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </CartProvider>
      <Toaster />
    </AuthProvider>
  );
}
