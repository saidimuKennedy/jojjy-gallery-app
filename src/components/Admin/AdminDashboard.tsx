import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  GalleryHorizontal,
  ListChecks,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

// Import the management components
import SeriesManagement from "@/components/Admin/SeriesManagement";
import MediaBlogManagement from "@/components/Admin/MediaBlogManagement";
import ArtworksManagement from "./ArtworkManagement";
// TODO
const SettingsManagement = () => (
  <div className="p-6">Settings Management Coming Soon!</div>
);

type AdminTab = "artworks" | "series" | "media-blog" | "settings";

const AdminDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("artworks");
  const isLoadingAuth = status === "loading";

  // Authentication and Authorization Check
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!session || session.user?.role !== UserRole.ADMIN) {
        router.push("/");
      }
    }
  }, [session, isLoadingAuth, router]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "artworks":
        return <ArtworksManagement />;
      case "series":
        return <SeriesManagement />;
      case "media-blog":
        return <MediaBlogManagement />;
      case "settings":
        return <SettingsManagement />;
      default:
        return null;
    }
  };

  // Show loading spinner while authentication status is being determined
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 animate-spin rounded-full"></div>
      </div>
    );
  }

  // Show access denied if not an admin after loading
  if (!session || session.user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg font-medium">
          Access Denied: You do not have permission to view this page.
        </p>
      </div>
    );
  }

  // Main dashboard layout for authenticated ADMIN users
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <motion.header
        className="border-b border-gray-200 bg-white shadow-sm"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center">
          {" "}
          <div className="flex flex-col md:flex-row md:items-center mb-4 md:mb-0">
            {" "}
            <h1 className="text-3xl font-light text-black md:mr-8 mb-4 md:mb-0">
              Admin Dashboard
            </h1>{" "}
            <nav className="flex flex-wrap gap-2 md:flex-nowrap md:space-x-6">
              {" "}
              <button
                onClick={() => setActiveTab("artworks")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "artworks"
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <GalleryHorizontal className="w-4 h-4 mr-2" /> Artworks
              </button>
              <button
                onClick={() => setActiveTab("series")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "series"
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <ListChecks className="w-4 h-4 mr-2" /> Series
              </button>
              <button
                onClick={() => setActiveTab("media-blog")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "media-blog"
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <FileText className="w-4 h-4 mr-2" /> Media & Blog
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "settings"
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <Settings className="w-4 h-4 mr-2" /> Settings
              </button>
            </nav>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-black transition-colors text-sm font-medium mt-4 md:mt-0"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout{" "}
          </button>
        </div>
      </motion.header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
