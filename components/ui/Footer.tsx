import React from "react";
import { Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50/50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Brand Section */}
          <div className="space-y-4 max-w-md">
            <h2 className="text-xl font-medium text-gray-900">Njenga Ngugi</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Based in Nairobi, I use charcoal, bleach, and pastel to explore
              the quiet battles and small victories that shape who we are and
              who we're becoming.
            </p>
          </div>

          {/* Social Media Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Njenga Ngugi. All rights
              reserved.
            </p>
            <div className="flex space-x-6">
              <a
                href="mailto:contact@njenangugi.art"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Contact
              </a>
              <a
                href="#"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
