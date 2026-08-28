"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  Film,
  Heart,
  Bookmark,
  Music2,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Plus,
  Loader2,
  Link2,
  X,
  Layers,
} from "lucide-react";
import Link from "next/link";

type DashboardCounts = {
  reels: number;
  posts: number;
  audio: number;
  favorites: number;
};

const metricItems = [
  {
    label: "Reels",
    href: "/reels?type=reel",
    icon: Film,
    getValue: (counts: DashboardCounts) => counts.reels,
  },
  {
    label: "Posts",
    href: "/reels?type=post",
    icon: Bookmark,
    getValue: (counts: DashboardCounts) => counts.posts,
  },
  {
    label: "Audio",
    href: "/reels?type=audio",
    icon: Music2,
    getValue: (counts: DashboardCounts) => counts.audio,
  },
  {
    label: "Favorites",
    href: "/favorites",
    icon: Heart,
    getValue: (counts: DashboardCounts) => counts.favorites,
  },
];

export default function DashboardPage() {
  const { reels, favorites, saveReel, collections } = useReels();
  const { user } = useAuth();

  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = user?.name ? user.name.split(" ")[0] : "there";

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveReel(inputUrl.trim());
      setInputUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reelsCount = reels.filter((r) => !r.mediaType || r.mediaType === "reel").length;
  const postsCount = reels.filter((r) => r.mediaType === "post").length;
  const audioCount = reels.filter((r) => r.mediaType === "audio").length;
  const favsCount = favorites.length;
  const totalItems = reels.length;

  const recentlySaved = [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestItem = recentlySaved[0];
  const counts: DashboardCounts = {
    reels: reelsCount,
    posts: postsCount,
    audio: audioCount,
    favorites: favsCount,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="relative overflow-hidden rounded-rd-xl border border-borderSubtle-light bg-surface-light p-5 shadow-rd-card transition-colors duration-200 dark:border-borderSubtle-dark dark:bg-surface-dark md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-28 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-rd-sm bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Creator library</span>
                </div>
                <div>
                  <h1 className="text-balance text-2xl font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark md:text-4xl">
                    {greeting}, {displayName}
                  </h1>
                  <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-secondaryText-light dark:text-secondaryText-dark">
                    Capture Instagram posts before they disappear into saved folders, then sort them into a library you can actually use.
                  </p>
                </div>
              </div>

              <Link
                href="/integrations/instagram"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-rd-md border border-borderSubtle-light bg-surfaceSecondary-light px-3.5 py-2 text-xs font-semibold text-primaryText-light transition-all hover:border-brand-500/40 hover:text-brand-600 active:translate-y-px dark:border-borderSubtle-dark dark:bg-surfaceSecondary-dark dark:text-primaryText-dark dark:hover:text-brand-400"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Connect DM sync</span>
              </Link>
            </div>

            <form onSubmit={handleQuickSave} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="group relative block">
                <span className="sr-only">Instagram URL</span>
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedText-light transition-colors group-focus-within:text-brand-500 dark:text-mutedText-dark" />
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste an Instagram reel, post, story, or audio link"
                  className="h-12 w-full rounded-rd-md border border-borderSubtle-light bg-background-light pl-11 pr-11 text-sm text-primaryText-light shadow-rd-inset transition-all placeholder:text-mutedText-light focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-borderSubtle-dark dark:bg-background-dark dark:text-primaryText-dark dark:placeholder:text-mutedText-dark"
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl("")}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-rd-sm text-mutedText-light transition-colors hover:bg-surfaceSecondary-light hover:text-primaryText-light active:translate-y-[calc(-50%+1px)] dark:text-mutedText-dark dark:hover:bg-surfaceSecondary-dark dark:hover:text-primaryText-dark"
                    aria-label="Clear Instagram URL"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </label>

              <button
                type="submit"
                disabled={!inputUrl.trim() || isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-rd-md bg-brand-500 px-5 text-sm font-semibold text-white shadow-rd-glow transition-all hover:bg-brand-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    <span>Save to library</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <aside className="rounded-rd-xl border border-borderSubtle-light bg-surface-light p-5 shadow-rd-subtle dark:border-borderSubtle-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">At a glance</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-primaryText-light dark:text-primaryText-dark">
                {totalItems}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-rd-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-borderSubtle-light pt-4 dark:border-borderSubtle-dark">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-secondaryText-light dark:text-secondaryText-dark">Collections</span>
              <span className="font-mono font-semibold text-primaryText-light dark:text-primaryText-dark">{collections.length}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-secondaryText-light dark:text-secondaryText-dark">Last save</span>
              <span className="max-w-40 truncate text-right text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">
                {latestItem ? `@${latestItem.creatorUsername || "creator"}` : "No saves yet"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-secondaryText-light dark:text-secondaryText-dark">DM sync</span>
              <Link
                href="/integrations/instagram"
                className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                Set up
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="group rounded-rd-lg border border-borderSubtle-light bg-surface-light p-4 shadow-rd-subtle transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-rd-card active:translate-y-px dark:border-borderSubtle-dark dark:bg-surface-dark"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-rd-md bg-brand-500/10 text-brand-600 transition-transform group-hover:scale-105 dark:text-brand-400">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <ArrowRight className="h-4 w-4 text-mutedText-light opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-mutedText-dark" />
              </div>
              <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight text-primaryText-light dark:text-primaryText-dark">
                {item.getValue(counts)}
              </p>
              <p className="mt-1 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">
                {item.label}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="space-y-4">
        {reels.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark">
                  Latest captures
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
                  Recently saved
                </h2>
              </div>
              <Link
                href="/reels"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                <span>Open full library</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ReelGrid reels={recentlySaved} />
          </>
        ) : (
          <div className="overflow-hidden rounded-rd-xl border border-borderSubtle-light bg-surface-light shadow-rd-card dark:border-borderSubtle-dark dark:bg-surface-dark">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1fr)]">
              <div className="flex flex-col justify-between gap-10 p-6 md:p-8">
                <div className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-rd-md bg-brand-500 text-white shadow-rd-glow">
                    <Film className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
                      Build your first useful save.
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-secondaryText-light dark:text-secondaryText-dark">
                      Start with one Instagram URL. ReelDash will keep the source link, creator, thumbnail, category, and notes together.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="url"]')?.focus()}
                    className="inline-flex items-center justify-center gap-2 rounded-rd-md bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-rd-glow transition-all hover:bg-brand-600 active:translate-y-px"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Paste a link</span>
                  </button>
                  <Link
                    href="/integrations/instagram"
                    className="inline-flex items-center justify-center gap-2 rounded-rd-md border border-borderSubtle-light bg-surfaceSecondary-light px-4 py-2.5 text-sm font-semibold text-primaryText-light transition-all hover:border-brand-500/40 hover:text-brand-600 active:translate-y-px dark:border-borderSubtle-dark dark:bg-surfaceSecondary-dark dark:text-primaryText-dark dark:hover:text-brand-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Use DM sync</span>
                  </Link>
                </div>
              </div>

              <div className="border-t border-borderSubtle-light bg-background-light/80 p-5 dark:border-borderSubtle-dark dark:bg-background-dark/60 lg:border-l lg:border-t-0">
                <div className="grid h-full gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    {
                      title: "Paste",
                      body: "Drop a reel, post, story, or audio link into the save bar.",
                      icon: Link2,
                    },
                    {
                      title: "Enrich",
                      body: "Metadata fills in while your item appears instantly.",
                      icon: Sparkles,
                    },
                    {
                      title: "Organize",
                      body: "Mark favorites, create collections, and return to ideas faster.",
                      icon: Bookmark,
                    },
                  ].map((step) => {
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.title}
                        className="rounded-rd-lg border border-borderSubtle-light bg-surface-light p-4 dark:border-borderSubtle-dark dark:bg-surface-dark"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-rd-sm bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <StepIcon className="h-4 w-4" />
                          </div>
                          <h4 className="text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
                            {step.title}
                          </h4>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-secondaryText-light dark:text-secondaryText-dark">
                          {step.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
