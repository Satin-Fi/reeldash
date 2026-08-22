"use client";

import React from "react";
import Link from "next/link";
import { INITIAL_REELS } from "@/lib/mockData";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Info, ArrowRight, Plus } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner indicating explicit Demo Mode as required by Section 5 & Section 73 */}
      <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-rd-md text-xs text-amber-600 dark:text-amber-400">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>DEMO MODE</strong> — Displaying sample library fixtures for feature exploration. No data will be saved to a personal account.
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Link
            href="/signup"
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-rd-sm transition-all"
          >
            Create Your Real Account
          </Link>
        </div>
      </div>

      {/* Demo Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demo Reel Library</h1>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
            Explore sample saved Reels with auto-categorization and AI summaries.
          </p>
        </div>
        <Link
          href="/signup"
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 text-white text-xs font-semibold rounded-rd-md shadow-rd-subtle"
        >
          <Plus className="w-4 h-4" />
          <span>Start Saving Real Reels</span>
        </Link>
      </div>

      {/* Reel Grid featuring sample fixtures */}
      <ReelGrid reels={INITIAL_REELS} viewMode="grid" />
    </div>
  );
}
