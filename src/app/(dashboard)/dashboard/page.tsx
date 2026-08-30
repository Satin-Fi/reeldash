"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  Music2,
  Plus,
  X,
} from "lucide-react";

type DashboardCounts = { reels: number; posts: number; audio: number; favorites: number };

const libraryViews = [
  { label: "Reels", href: "/reels?type=reel", icon: Film, getValue: (counts: DashboardCounts) => counts.reels },
  { label: "Posts", href: "/reels?type=post", icon: ImageIcon, getValue: (counts: DashboardCounts) => counts.posts },
  { label: "Audio", href: "/reels?type=audio", icon: Music2, getValue: (counts: DashboardCounts) => counts.audio },
  { label: "Favorites", href: "/favorites", icon: Heart, getValue: (counts: DashboardCounts) => counts.favorites },
];

const greetings = [
  { text: "Good morning", textAfternoon: "Good afternoon", textEvening: "Good evening" },
  { text: "Bonjour", textAfternoon: "Bonjour", textEvening: "Bonsoir" },
  { text: "¡Buenos días", textAfternoon: "¡Buenas tardes", textEvening: "¡Buenas noches" },
  { text: "Namaste", textAfternoon: "Namaste", textEvening: "Namaste" },
  { text: "Ohayō", textAfternoon: "Konnichiwa", textEvening: "Konbanwa" },
  { text: "Buongiorno", textAfternoon: "Buon pomeriggio", textEvening: "Buonasera" },
  { text: "Guten Morgen", textAfternoon: "Guten Tag", textEvening: "Guten Abend" },
  { text: "Olá", textAfternoon: "Boa tarde", textEvening: "Boa noite" },
];

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    collections,
    selectedInstagramAccount,
  } = useReels();
  const { user } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    setGreetingIndex(Math.floor(Math.random() * greetings.length));
  }, []);

  const hour = new Date().getHours();
  const activeGreetingObj = greetings[greetingIndex] || greetings[0];
  const timeGreeting = hour < 12 
    ? activeGreetingObj.text 
    : hour < 17 
    ? activeGreetingObj.textAfternoon 
    : activeGreetingObj.textEvening;

  const displayName = user?.name
    ? user.name.split(" ")[0]
    : user?.instagramUsername
    ? `@${user.instagramUsername}`
    : selectedInstagramAccount
    ? `@${selectedInstagramAccount}`
    : "Creator";

  const connectedAccounts = user?.connectedAccounts || [];

  const recentlySaved = [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const previewItems = recentlySaved.slice(0, 3);
  const featuredItem = previewItems[0];

  const counts: DashboardCounts = {
    reels: reels.filter((reel) => !reel.mediaType || reel.mediaType === "reel").length,
    posts: reels.filter((reel) => reel.mediaType === "post").length,
    audio: reels.filter((reel) => reel.mediaType === "audio").length,
    favorites: favorites.length,
  };
  const thisWeekCount = reels.filter((reel) => {
    const savedAt = new Date(reel.createdAt).getTime();
    return Number.isFinite(savedAt) && Date.now() - savedAt < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const handleQuickSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputUrl.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await saveReel(inputUrl.trim());
      setInputUrl("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <main className="min-w-0 space-y-6">
        {/* Quick Ingest & Overview Bar */}
        <section className="overflow-hidden rounded-rd-xl border border-borderSubtle-light bg-surface-light shadow-rd-card dark:border-borderSubtle-dark dark:bg-surface-dark">
          <div className="grid min-h-[20rem] lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="flex min-w-0 flex-col p-5 sm:p-7">
              <div>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-primaryText-light dark:text-primaryText-dark sm:text-3xl">
                  {timeGreeting}, {displayName}.
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-secondaryText-light dark:text-secondaryText-dark">
                  Paste any Instagram link or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.08] text-[10px] font-mono">⌘K</kbd> to search and capture.
                </p>
              </div>

              <form onSubmit={handleQuickSave} className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="group relative block">
                  <span className="sr-only">Instagram URL</span>
                  <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedText-light group-focus-within:text-brand-500 dark:text-mutedText-dark" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(event) => setInputUrl(event.target.value)}
                    placeholder="Paste an Instagram reel, post, story, or audio link"
                    className="h-12 w-full rounded-rd-md border border-borderSubtle-light bg-background-light pl-11 pr-11 text-sm text-primaryText-light shadow-rd-inset transition-colors placeholder:text-mutedText-light focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-borderSubtle-dark dark:bg-background-dark dark:text-primaryText-dark dark:placeholder:text-mutedText-dark"
                  />
                  {inputUrl && (
                    <button
                      type="button"
                      onClick={() => setInputUrl("")}
                      aria-label="Clear Instagram URL"
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-rd-sm text-mutedText-light transition-colors hover:bg-surfaceSecondary-light hover:text-primaryText-light dark:text-mutedText-dark dark:hover:bg-surfaceSecondary-dark dark:hover:text-primaryText-dark"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </label>
                <button
                  type="submit"
                  disabled={!inputUrl.trim() || isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-rd-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 shadow-rd-glow cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                  <span>{isSubmitting ? "Saving" : "Save to library"}</span>
                </button>
              </form>

              <div className="mt-auto grid grid-cols-3 divide-x divide-borderSubtle-light pt-6 dark:divide-borderSubtle-dark">
                <div className="pr-4">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{reels.length}</p>
                  <p className="mt-0.5 text-xs text-secondaryText-light dark:text-secondaryText-dark">saved items</p>
                </div>
                <div className="px-4">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{thisWeekCount}</p>
                  <p className="mt-0.5 text-xs text-secondaryText-light dark:text-secondaryText-dark">saved this week</p>
                </div>
                <div className="pl-4">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{collections.length}</p>
                  <p className="mt-0.5 text-xs text-secondaryText-light dark:text-secondaryText-dark">collections</p>
                </div>
              </div>
            </div>

            <div className="relative hidden overflow-hidden border-l border-borderSubtle-light bg-surfaceSecondary-light p-5 dark:border-borderSubtle-dark dark:bg-surfaceSecondary-dark lg:block">
              <div className="absolute inset-x-0 top-0 h-1 bg-brand-500" />
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark">Latest capture</p>
                <Link href="/reels" aria-label="Open full library" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              {featuredItem ? (
                <div className="mt-5">
                  <div className="relative mx-auto h-56 w-40">
                    {previewItems.slice(1).reverse().map((item, index) => (
                      <div
                        key={item.id}
                        className="absolute inset-x-0 top-0 aspect-reel overflow-hidden rounded-rd-md border border-white/40 bg-surfaceTertiary-light shadow-rd-card dark:border-white/10 dark:bg-surfaceTertiary-dark"
                        style={{ transform: `translate(${(index + 1) * 12}px, ${(index + 1) * 10}px) rotate(${(index + 1) * 3}deg)` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    <Link href={`/reel/${featuredItem.id}`} className="group absolute inset-0 overflow-hidden rounded-rd-md border border-white/50 bg-surfaceTertiary-light shadow-rd-modal dark:border-white/10 dark:bg-surfaceTertiary-dark">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredItem.thumbnailUrl}
                        alt={`Open ${featuredItem.creatorUsername}'s saved item`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-9 text-white">
                        <p className="truncate text-xs font-semibold">@{featuredItem.creatorUsername || "creator"}</p>
                        <p className="mt-0.5 truncate text-[11px] text-white/75">{featuredItem.category || "Unsorted"}</p>
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-3 gap-2 px-2">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="aspect-reel rounded-rd-sm border border-borderDefault-light bg-surface-light p-2 dark:border-borderDefault-dark dark:bg-surface-dark">
                      <div className="h-full rounded-[3px] border border-dashed border-borderDefault-light dark:border-borderDefault-dark" />
                    </div>
                  ))}
                </div>
              )}
              <p className="absolute inset-x-5 bottom-5 text-xs leading-5 text-secondaryText-light dark:text-secondaryText-dark">
                {featuredItem ? "Your most recent saved reference." : "Your latest saved references will appear here."}
              </p>
            </div>
          </div>
        </section>

        {/* Seamless Library Pulse Views Strip */}
        <nav aria-label="Library views" className="grid grid-cols-2 border-y border-borderSubtle-light dark:border-borderSubtle-dark sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-borderSubtle-light dark:divide-borderSubtle-dark">
          {libraryViews.map((view) => {
            const Icon = view.icon;
            const value = view.getValue(counts);
            return (
              <Link
                key={view.label}
                href={view.href}
                className="group flex min-h-[4.5rem] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                <span className="min-w-0">
                  <span className="block font-mono text-xl font-bold tabular-nums text-primaryText-light dark:text-primaryText-dark">
                    {value}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-secondaryText-light dark:text-secondaryText-dark">
                    {view.label}
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Visual Inbox Reel Feed */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primaryText-light dark:text-primaryText-dark">
                Your visual inbox
              </h2>
            </div>
            <Link
              href="/reels"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ReelGrid
            reels={reels}
            emptyTitle={selectedInstagramAccount ? `No reels from @${selectedInstagramAccount}` : "No items saved yet"}
            emptySubtitle={selectedInstagramAccount ? `Send a Reel via DM from @${selectedInstagramAccount} or paste a link.` : "Paste any Instagram link above to start your library."}
          />
        </section>
      </main>

      {/* Right Rail Overview */}
      <aside className="space-y-5">
        <section className="rounded-rd-lg border border-borderSubtle-light bg-surface-light p-5 shadow-rd-subtle dark:border-borderSubtle-dark dark:bg-surface-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark">Library Summary</p>
              <p className="mt-1 text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
                {selectedInstagramAccount ? `@${selectedInstagramAccount}` : "What you have saved"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3.5">
            {libraryViews.slice(0, 3).map((view) => {
              const value = view.getValue(counts);
              const percentage = reels.length ? Math.max((value / reels.length) * 100, value ? 8 : 0) : 0;
              return (
                <Link key={view.label} href={view.href} className="group block">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondaryText-light group-hover:text-primaryText-light dark:text-secondaryText-dark dark:group-hover:text-primaryText-dark">
                      {view.label}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">
                      {value}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surfaceTertiary-light dark:bg-surfaceTertiary-dark">
                    <div className="h-full rounded-full bg-brand-500 transition-[width] duration-300" style={{ width: `${percentage}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}
