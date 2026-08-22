"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Search, Bookmark, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Header Bar */}
      <header className="max-w-6xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-rd-md bg-brand-500 flex items-center justify-center text-white font-bold shadow-rd-subtle">
            ⚡
          </div>
          <span className="text-lg font-bold tracking-tight">ReelDash</span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <Link
            href="/demo"
            className="px-3.5 py-2 text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors"
          >
            Explore Demo
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-2 text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-rd-md shadow-rd-subtle transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl w-full mx-auto px-6 py-16 text-center space-y-8 my-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-medium border border-brand-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Personal Visual Memory System for Instagram Reels</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          You don&apos;t have to organize your Reels anymore.{" "}
          <span className="text-brand-500">Just save them.</span>
        </h1>

        <p className="text-sm sm:text-base text-secondaryText-light dark:text-secondaryText-dark max-w-2xl mx-auto leading-relaxed">
          Stop struggling to find saved workout routines, coding tutorials, or recipes. ReelDash automatically understands, categorizes, and indexes your saved Instagram content so you can retrieve anything instantly.
        </p>

        {/* CTA Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-semibold rounded-rd-md shadow-rd-card flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Start Your Library Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto px-6 py-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/50 text-sm font-medium rounded-rd-md shadow-rd-subtle transition-all"
          >
            Try Demo Mode
          </Link>
        </div>

        {/* Value Prop Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-2">
            <div className="w-8 h-8 rounded-rd-sm bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">Auto Categorization</h3>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              AI analyzes captions, hashtags, and creator metadata to organize saved Reels without manual folders.
            </p>
          </div>

          <div className="p-5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-2">
            <div className="w-8 h-8 rounded-rd-sm bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">Smart Memory Retrieval</h3>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              Search by concept, creator, topic, or personal notes. Retrieve what you remember in seconds.
            </p>
          </div>

          <div className="p-5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-2">
            <div className="w-8 h-8 rounded-rd-sm bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">Data Ownership & Privacy</h3>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-normal">
              Your library is yours. Export metadata as CSV or JSON anytime with zero platform lock-in.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-borderSubtle-light dark:border-borderSubtle-dark py-6 text-center text-xs text-mutedText-light dark:text-mutedText-dark">
        <p>© 2026 ReelDash. Personal Visual Memory System for Short-Form Content.</p>
      </footer>
    </div>
  );
}
