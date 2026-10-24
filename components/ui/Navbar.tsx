
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import OptimizedImage from "./OptimizedImage";
import { SITE_LOGO_URL } from "@/lib/cloudinary";

interface NavbarProps {
  /** "transparent" renders the nav over a dark hero. Routing is unchanged. */
  variant?: "default" | "transparent";
}

export default function Navbar({ variant = "default" }: NavbarProps = {}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isTransparent = variant === "transparent";

  const user = session?.user;
  const isLoadingAuth = status === "loading";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!accountMenuRef.current?.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isAccountMenuOpen]);

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
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
      setIsAccountMenuOpen(false);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("routeChangeError", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("routeChangeError", handleRouteChange);
    };
  }, [router.events]);

  const isActive = (path: string) => router.pathname === path;

  // V1 primary navigation: Art (portfolio/artworks/series), Music, Events,
  // Gallery (editorial journal), Shop, About, Contact. Home is reached via
  // the brand/logo. Music Studio membership and Updates stay contextual.
  const navItems = [
    { label: "Art", path: "/portfolio" },
    { label: "Music", path: "/music" },
    { label: "Events", path: "/events" },
    { label: "Gallery", path: "/gallery" },
    { label: "Shop", path: "/shop" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const isNavActive = (path: string) => {
    if (path === "/gallery") {
      return (
        router.pathname === "/gallery" ||
        router.pathname.startsWith("/gallery/")
      );
    }
    if (path === "/music") {
      return (
        router.pathname === "/music" ||
        (router.pathname.startsWith("/music/") &&
          router.pathname !== "/music/studio" &&
          router.pathname !== "/music/library")
      );
    }
    if (path === "/events") {
      return (
        router.pathname === "/events" || router.pathname.startsWith("/events/")
      );
    }
    if (path === "/shop") {
      return (
        router.pathname === "/shop" || router.pathname.startsWith("/shop/")
      );
    }
    if (path === "/portfolio") {
      return (
        router.pathname === "/portfolio" ||
        router.pathname.startsWith("/portfolio/")
      );
    }
    return isActive(path);
  };

  const navLinkClass = (path: string) =>
    `text-sm tracking-wide transition-colors duration-200 ${
      isNavActive(path)
        ? isTransparent
          ? "text-white"
          : "text-gray-900"
        : isTransparent
          ? "text-white/70 hover:text-white"
          : "text-gray-500 hover:text-gray-900"
    }`;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={
          isTransparent
            ? "absolute inset-x-0 top-0 z-50 bg-transparent"
            : "bg-white border-b border-gray-100"
        }
      >
        <div className="w-full">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center">
              {isTransparent ? (
                <span className="font-display text-2xl font-light tracking-[0.3em] text-white sm:text-3xl">
                  JENGA
                </span>
              ) : (
                <div className="h-14 w-28 flex items-center justify-center sm:h-16 sm:w-32">
                  <OptimizedImage
                    src={SITE_LOGO_URL}
                    alt="Njenga Ngugi Logo"
                    width={128}
                    height={64}
                    preset="thumb"
                    priority
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </Link>

            <div className="hidden md:flex md:items-center md:space-x-8 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={navLinkClass(item.path)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex md:items-center md:space-x-4">
              {!isLoadingAuth &&
                (user ? (
                  <div ref={accountMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAccountMenuOpen((open) => !open)}
                      aria-haspopup="menu"
                      aria-expanded={isAccountMenuOpen}
                      className={`flex items-center gap-3 rounded-full py-1 pl-1 pr-3 text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 ${
                        isTransparent
                          ? "text-white/80 hover:text-white"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                          isTransparent
                            ? "bg-white text-neutral-900"
                            : "bg-neutral-900 text-white"
                        }`}
                        aria-hidden="true"
                      >
                        {(user.username || user.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      Account
                    </button>
                    {isAccountMenuOpen && (
                      <div
                        role="menu"
                        className={`absolute right-0 top-full z-50 mt-2 w-60 border py-2 shadow-lg ${
                          isTransparent
                            ? "border-neutral-800 bg-black text-white"
                            : "border-gray-100 bg-white text-gray-700"
                        }`}
                      >
                        <p
                          className={`truncate px-4 py-2 text-xs ${
                            isTransparent ? "text-white/60" : "text-gray-500"
                          }`}
                        >
                          {user.username || user.email}
                        </p>
                        <Link
                          href="/music/library"
                          role="menuitem"
                          className={`block px-4 py-2 text-sm ${
                            isTransparent
                              ? "hover:bg-white/10"
                              : "hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          Your Library
                        </Link>
                        <Link
                          href="/account"
                          role="menuitem"
                          className={`block px-4 py-2 text-sm ${
                            isTransparent
                              ? "hover:bg-white/10"
                              : "hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          Account
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className={`block w-full px-4 py-2 text-left text-sm ${
                            isTransparent
                              ? "hover:bg-white/10"
                              : "hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isTransparent
                        ? "text-white/70 hover:text-white"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Login
                  </Link>
                ))}
            </div>

            <div className="flex md:hidden items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 ${
                  isTransparent
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
                aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
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
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!isMobileMenuOpen}
        className={`fixed inset-0 bg-white z-[999] md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-100">
          <span className="font-display text-2xl font-light text-gray-900 tracking-tight">
            Menu
          </span>
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
                  isNavActive(item.path)
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
                  <Link
                    href="/music/library"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-medium py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    Your Library
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-medium py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    Account
                  </Link>
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
    </>
  );
}
