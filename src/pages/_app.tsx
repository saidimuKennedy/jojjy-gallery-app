import { CartProvider } from "@/context/CartContext";
import "@/styles/globals.css";
import Layout from "@/components/Layout/Layout";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </CartProvider>
      <Toaster />
    </SessionProvider>
  );
}
