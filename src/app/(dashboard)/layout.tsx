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
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-rd-md bg-brand-500 flex items-center justify-center text-white font-bold animate-pulse">
            ⚡
          </div>
          <span className="text-xs text-secondaryText-light">Loading your Reel memory...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark overflow-hidden">
      {/* 240px Desktop Left Sidebar (STORAGE METER REMOVED) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pb-16 md:pb-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Touch Bottom Bar for Mobile (<768px) */}
      <MobileNav />

      {/* Global Modals & Notifications */}
      <SaveReelModal />
      <CreateCollectionModal />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
