"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { Home, Search, Plus, Folder, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { setIsSaveModalOpen, setIsCommandPaletteOpen } = useReels();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-borderSubtle-light dark:border-borderSubtle-dark px-3 py-2 flex items-center justify-around text-xs text-primaryText-light dark:text-primaryText-dark shadow-rd-modal">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center space-y-1 p-1 ${
          pathname === "/dashboard" ? "text-brand-500 font-semibold" : "text-secondaryText-light dark:text-secondaryText-dark"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </Link>

      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="flex flex-col items-center space-y-1 p-1 text-secondaryText-light dark:text-secondaryText-dark cursor-pointer"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px]">Search</span>
      </button>

      {/* Prominent Save Button */}
      <button
        onClick={() => setIsSaveModalOpen(true)}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-brand-500 text-white shadow-rd-card active:scale-95 transition-transform cursor-pointer -mt-4"
        title="Save Reel"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Link
        href="/categories"
        className={`flex flex-col items-center space-y-1 p-1 ${
          pathname === "/categories" ? "text-brand-500 font-semibold" : "text-secondaryText-light dark:text-secondaryText-dark"
        }`}
      >
        <Folder className="w-5 h-5" />
        <span className="text-[10px]">Categories</span>
      </Link>

      <Link
        href="/settings"
        className={`flex flex-col items-center space-y-1 p-1 ${
          pathname === "/settings" ? "text-brand-500 font-semibold" : "text-secondaryText-light dark:text-secondaryText-dark"
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </Link>
    </div>
  );
}
