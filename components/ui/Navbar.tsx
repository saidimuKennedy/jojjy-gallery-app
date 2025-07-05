
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSession, signOut } from "next-auth/react";

import CartDrawer from "./CartDrawer";
import CartButton from "./CartButton";

export default function Navbar() {
  const router = useRouter();
  const { items, isCartOpen, closeCart } = useCart();
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoadingAuth = status === "loading";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
      closeCart();
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("routeChangeError", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("routeChangeError", handleRouteChange);
    };
  }, [router.events, closeCart]);

  const isActive = (path: string) => router.pathname === path;

  const shouldShowCart =
    router.pathname.startsWith("/artworks/") &&
    router.pathname.length > "/artworks/".length;

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Gallery", path: "/gallery" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="w-full">
          <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center py-2">
              <div className="w-24 h-16 flex items-center justify-center">
                <img
                  src="https://res.cloudinary.com/dq3wkbgts/image/upload/v1751641327/logo_v51aad.png"
                  alt="Njenga Ngugi Logo"
                  className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                />
              </div>
            </Link>

            <div className="hidden md:flex md:items-center md:space-x-8 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-medium ${
                    isActive(item.path)
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  } transition-colors duration-200`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex md:items-center md:space-x-4">
              {!isLoadingAuth &&
                (user ? (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      Welcome, {user.username || user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    Login
                  </Link>
                ))}
              {shouldShowCart && <CartButton />}
            </div>

            <div className="flex md:hidden items-center space-x-4">
              {shouldShowCart && <CartButton />}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div
        className={`fixed inset-0 bg-white z-[999] md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between h-20 px-4 sm:px-6 border-b border-gray-100">
          <span className="text-2xl font-light text-gray-900">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
            aria-label="Close mobile menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-6">
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-xl font-medium py-2 px-3 rounded-lg ${
                  isActive(item.path)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } transition-colors duration-200`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {!isLoadingAuth && (
            <div className="flex flex-col space-y-4 mt-6 border-t border-gray-100 pt-6">
              {user ? (
                <>
                  <span className="text-lg font-medium text-gray-700 px-3">
                    Welcome, {user.username || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="block text-lg font-medium py-2 px-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-lg font-medium py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}