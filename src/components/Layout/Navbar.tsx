// src/components/layout/Navbar.tsx

import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CartDrawer from "../ui/CartDrawer";
import CartButton from "../ui/CartButton";
export default function Navbar() {
  const router = useRouter();
  const { items, isCartOpen, closeCart } = useCart();
  const { user, isLoadingAuth, logout } = useAuth();

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

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
      closeCart(); // Also close cart drawer on route change for clean navigation
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
    await logout();
    router.push("/login");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/images/pics/logo.png"
                  alt="Njenga Ngugi Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-3xl font-light text-gray-900 hover:text-gray-700 transition-all duration-300">
                Njenga Ngugi
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
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
              {/* Desktop Auth Links */}
              {!isLoadingAuth &&
                (user ? (
                  <>
                    <span className="text-sm font-medium text-gray-700">
                      Welcome, {user.username}
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

            {/* Mobile Hamburger & Conditionally Rendered Cart Button */}
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
      {/* Mobile Menu Drawer */}
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
          {/* Mobile Navigation Items */}
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

          {/* Mobile Auth Links */}
          {!isLoadingAuth && (
            <div className="flex flex-col space-y-4 mt-6 border-t border-gray-100 pt-6">
              {user ? (
                <>
                  <span className="text-lg font-medium text-gray-700 px-3">
                    Welcome, {user.username}
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
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on login click
                  className="block text-lg font-medium py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}
