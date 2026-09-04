"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { Home, Search, Plus, Folder, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { setIsSaveModalOpen } = useReels();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-light/90 dark:bg-[#0c0e14]/90 backdrop-blur-xl border-t border-borderSubtle-light dark:border-white/[0.08] px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] flex items-center justify-around text-xs text-primaryText-light dark:text-primaryText-dark shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <Link
        href="/dashboard"
        className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all active:scale-95 ${
          pathname === "/dashboard"
            ? "text-brand-500 font-semibold bg-brand-500/10 dark:bg-brand-500/15"
            : "text-secondaryText-light dark:text-zinc-400 hover:text-white"
        }`}
      >
        <Home className="w-[18px] h-[18px]" strokeWidth={2} />
        <span className="text-[10px] tracking-tight">Home</span>
      </Link>

      <Link
        href="/search"
        className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all active:scale-95 ${
          pathname === "/search"
            ? "text-brand-500 font-semibold bg-brand-500/10 dark:bg-brand-500/15"
            : "text-secondaryText-light dark:text-zinc-400 hover:text-white"
        }`}
      >
        <Search className="w-[18px] h-[18px]" strokeWidth={2} />
        <span className="text-[10px] tracking-tight">Search</span>
      </Link>

      {/* Prominent Save Button */}
      <button
        onClick={() => setIsSaveModalOpen(true)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30 border-2 border-surface-light dark:border-[#0c0e14] active:scale-90 transition-transform cursor-pointer -mt-5 shrink-0"
        title="Save Reel"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <Link
        href="/categories"
        className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all active:scale-95 ${
          pathname === "/categories"
            ? "text-brand-500 font-semibold bg-brand-500/10 dark:bg-brand-500/15"
            : "text-secondaryText-light dark:text-zinc-400 hover:text-white"
        }`}
      >
        <Folder className="w-[18px] h-[18px]" strokeWidth={2} />
        <span className="text-[10px] tracking-tight">Categories</span>
      </Link>

      <Link
        href="/settings"
        className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all active:scale-95 ${
          pathname === "/settings"
            ? "text-brand-500 font-semibold bg-brand-500/10 dark:bg-brand-500/15"
            : "text-secondaryText-light dark:text-zinc-400 hover:text-white"
        }`}
      >
        <User className="w-[18px] h-[18px]" strokeWidth={2} />
        <span className="text-[10px] tracking-tight">Profile</span>
      </Link>
    </div>
  );
}
