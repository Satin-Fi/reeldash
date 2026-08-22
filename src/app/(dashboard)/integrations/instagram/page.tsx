"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Instagram, CheckCircle2, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useReels } from "@/context/ReelContext";

export default function InstagramIntegrationPage() {
  const { showToast } = useReels();
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
    showToast("✓ Connected Instagram account @piyush_kumar");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Settings</span>
      </Link>

      {/* Header */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-rd-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-rd-subtle">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
              Instagram DM Integration
            </h1>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
              Save Reels directly while browsing Instagram on mobile by sending them to @ReelDash.
            </p>
          </div>
        </div>

        {/* Connection Box */}
        <div className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-borderSubtle-light dark:border-borderSubtle-dark">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
                {isConnected ? "Connected: @piyush_kumar" : "Instagram Account Status"}
              </span>
              {isConnected && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
              {isConnected
                ? "Your Instagram account is linked to your ReelDash library."
                : "Connect your Instagram account to enable automatic DM saving."}
            </p>
          </div>

          <button
            onClick={handleConnect}
            className={`px-4 py-2 text-xs font-semibold rounded-rd-md transition-all cursor-pointer ${
              isConnected
                ? "bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light"
                : "bg-gradient-to-r from-purple-600 to-rose-500 text-white shadow-rd-subtle hover:opacity-90"
            }`}
          >
            {isConnected ? "Disconnect Account" : "Connect Instagram"}
          </button>
        </div>
      </div>

      {/* 4-Step DM Workflow Instructions */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-4">
        <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark flex items-center space-x-2">
          <Zap className="w-4 h-4 text-brand-500" />
          <span>How Instagram DM Saving Works</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md space-y-2 border border-borderSubtle-light dark:border-borderSubtle-dark">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs font-bold">Discover Reel</h3>
            <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              Find an interesting Reel while browsing on the official Instagram app.
            </p>
          </div>

          <div className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md space-y-2 border border-borderSubtle-light dark:border-borderSubtle-dark">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs font-bold">Send to @ReelDash</h3>
            <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              Tap the Share button on Instagram and DM the Reel link to @ReelDash.
            </p>
          </div>

          <div className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md space-y-2 border border-borderSubtle-light dark:border-borderSubtle-dark">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs font-bold">AI Auto-Organizes</h3>
            <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              Our webhook receives the link, analyzes the content, and assigns smart categories.
            </p>
          </div>

          <div className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md space-y-2 border border-borderSubtle-light dark:border-borderSubtle-dark">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
              4
            </div>
            <h3 className="text-xs font-bold">Find in Library</h3>
            <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              Open your ReelDash dashboard on any device to find and search your saved Reel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
