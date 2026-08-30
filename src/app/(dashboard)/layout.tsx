"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
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
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark">
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
      <div className="flex h-screen bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark overflow-hidden">
        {/* 240px Desktop Left Sidebar (STORAGE METER REMOVED) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto pb-16 md:pb-0 scrollbar-thin">
            <main className="p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
