"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { SaveReelModal } from "@/components/reels/SaveReelModal";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ToastContainer } from "@/components/ui/Toast";
import { ReelProvider } from "@/context/ReelContext";
import { ReelDashLogo } from "@/components/ui/ReelDashLogo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-primaryText-light dark:text-primaryText-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-medium">Loading your library...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ReelProvider>
      <div className="flex h-screen bg-[#F5F5F5] dark:bg-surface-dark text-primaryText-light dark:text-primaryText-dark overflow-hidden">
        {/* Desktop Left Sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F5F5F5] dark:bg-surface-dark">
          {/* Mobile Top Header (<768px) */}
          <header className="md:hidden flex h-14 shrink-0 items-center justify-between border-b border-black/[0.05] bg-[#FAFAF9] px-4 dark:border-white/[0.05] dark:bg-[#121316] z-30">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 focus:outline-none"
              aria-label="ReelDash Home"
            >
              <ReelDashLogo />
            </Link>

            <Link
              href="/pricing"
              className="flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.1]"
            >
              <span>Plans</span>
            </Link>
          </header>

          <div className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0 scrollbar-thin">
            <main className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Touch Bottom Bar for Mobile (<768px) */}
        <MobileNav />

        {/* Global Modals */}
        <SaveReelModal />
        <CreateCollectionModal />
        <CommandPalette />
        <ToastContainer />
      </div>
    </ReelProvider>
  );
}
