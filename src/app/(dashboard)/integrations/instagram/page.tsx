"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Zap,
  Instagram,
  ShieldCheck,
} from "lucide-react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";

const REELDASH_IG_HANDLE = "@ReelDash_app";

const steps = [
  {
    n: "1",
    title: "Link your Instagram Username",
    desc: "Enter your Instagram handle below. When you send a reel to our bot, we match your username to your ReelDash account.",
  },
  {
    n: "2",
    title: "Send Reel to @ReelDash_app",
    desc: "Open any Reel on the Instagram app → tap Share → Send to @ReelDash_app. Or DM the reel link directly.",
  },
  {
    n: "3",
    title: "Instant AI Extraction & Organization",
    desc: "Our server parses the video URL, thumbnail, creator info, audio track, and caption automatically.",
  },
  {
    n: "4",
    title: "Saved to your ReelDash Gallery",
    desc: "View your saved content on desktop, mobile, or anywhere with full search and offline capabilities.",
  },
];

export default function InstagramIntegrationPage() {
  const { showToast } = useReels();
  const { user, updateUser } = useAuth();
  const [igUsername, setIgUsername] = useState(user?.instagramUsername || "");
  const [isSaved, setIsSaved] = useState(!!user?.instagramUsername);
  const [copied, setCopied] = useState(false);

  const webhookUrl = "https://reeldash-nine.vercel.app/api/instagram/webhook";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    showToast("Webhook URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = igUsername.replace("@", "").trim();
    if (!clean) return;

    updateUser({ instagramUsername: clean });
    setIsSaved(true);
    showToast(`Linked Instagram account @${clean}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Settings</span>
      </Link>

      {/* Main Header Card */}
      <div className="p-6 md:p-8 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6 transition-colors duration-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-rd-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-rd-glow shrink-0">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
              Instagram DM Sync
            </h1>
            <p className="text-xs sm:text-sm text-secondaryText-light dark:text-secondaryText-dark mt-1">
              Save Reels directly while browsing Instagram on your phone by sending them to{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">{REELDASH_IG_HANDLE}</span>.
            </p>
          </div>
        </div>

        {/* Username Linking Box */}
        <form onSubmit={handleSaveUsername} className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
              Your Instagram Handle
            </label>
            {isSaved && user?.instagramUsername && (
              <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Linked (@{user.instagramUsername})</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondaryText-light dark:text-secondaryText-dark text-xs">
                @
              </span>
              <input
                type="text"
                value={igUsername}
                onChange={(e) => {
                  setIgUsername(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="your_instagram_handle"
                className="w-full pl-7 pr-3 py-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={!igUsername.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs rounded-rd-md shadow-rd-subtle transition-all cursor-pointer shrink-0"
            >
              {isSaved ? "Update Handle" : "Link Account"}
            </button>
          </div>

          <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
            We use your handle solely to route DMs to your private library. No login or password required.
          </p>
        </form>
      </div>

      {/* 4-Step How It Works Grid */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-4">
        <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark flex items-center space-x-2">
          <Zap className="w-4 h-4 text-brand-500" />
          <span>How DM Saving Works</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {steps.map((step) => (
            <div
              key={step.n}
              className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-2"
            >
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
                {step.n}
              </div>
              <h3 className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
                {step.title}
              </h3>
              <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Configuration for Meta Developers */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
              Meta Webhook Endpoint (API Integration)
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            Live Endpoint
          </span>
        </div>

        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
          If you are configuring your Meta / Instagram Messenger bot in developer console, set your Callback URL to:
        </p>

        <div className="flex items-center space-x-2 p-2.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md font-mono text-xs text-primaryText-light dark:text-primaryText-dark">
          <span className="flex-1 truncate">{webhookUrl}</span>
          <button
            onClick={handleCopyWebhook}
            className="px-2 py-1 bg-surface-light dark:bg-surface-dark hover:bg-brand-500/10 hover:text-brand-500 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-[11px] font-semibold transition-colors flex items-center space-x-1"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark space-y-1">
          <p>
            • Verification Token: <code className="px-1 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded text-brand-600 dark:text-brand-400 font-mono">reeldash_webhook_2026</code>
          </p>
          <p>
            • Required Webhook fields: <code className="px-1 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded font-mono">messages</code>, <code className="px-1 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded font-mono">messaging_postbacks</code>
          </p>
        </div>
      </div>
    </div>
  );
}
