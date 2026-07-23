import { CartProvider } from "@/context/CartContext";
import "@/styles/globals.css";
import Layout from "@/components/Layout/Layout";
import AudienceCapture from "@/components/ui/AudienceCapture";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

/** Public Sans — toast copy needs weight/legibility; display serif stays on page chrome. */
const toastFont = '"Public Sans", system-ui, sans-serif';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <AudienceCapture />
      </CartProvider>
      <Toaster
        position="top-center"
        gutter={12}
        toastOptions={{
          duration: 3500,
          className: "gallery-toast",
          style: {
            borderRadius: 0,
            background: "#0a0a0a",
            color: "#fafafa",
            border: "1px solid #0a0a0a",
            boxShadow: "none",
            fontFamily: toastFont,
            fontSize: "0.8125rem",
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1.45,
            padding: "14px 18px",
            maxWidth: "420px",
          },
          success: {
            iconTheme: {
              primary: "#fafafa",
              secondary: "#0a0a0a",
            },
            style: {
              borderRadius: 0,
              background: "#0a0a0a",
              color: "#fafafa",
              border: "1px solid #0a0a0a",
              boxShadow: "none",
            },
          },
          error: {
            iconTheme: {
              primary: "#0a0a0a",
              secondary: "#fafafa",
            },
            style: {
              borderRadius: 0,
              background: "#fafafa",
              color: "#0a0a0a",
              border: "1px solid #0a0a0a",
              boxShadow: "none",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
