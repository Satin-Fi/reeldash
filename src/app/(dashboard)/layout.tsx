"use client";

import React from "react";
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
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark overflow-hidden">
      {/* 240px Desktop Left Sidebar */}
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
