"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { SaveReelModal } from "@/components/reels/SaveReelModal";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ToastContainer } from "@/components/ui/Toast";
import { ReelProvider } from "@/context/ReelContext";

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
      <div className="flex h-screen bg-black text-primaryText-light dark:text-primaryText-dark overflow-hidden md:p-3 md:gap-3">
        {/* Floating Desktop Left Sidebar */}
        <Sidebar />

        {/* Main Content Area — Floating Island */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden md:rounded-[24px] md:border md:border-black/[0.04] md:dark:border-white/[0.06] bg-[#F5F5F5] dark:bg-surface-dark shadow-[0_4px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)]">
          <div className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0 scrollbar-thin">
            <main className="p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Touch Bottom Bar for Mobile (<768px) */}
        <MobileNav />

        {/* Global Modals & Notifications */}
        <SaveReelModal />
        <CreateCollectionModal />
        <CommandPalette />
        <ToastContainer />
      </div>
    </ReelProvider>
  );
}
