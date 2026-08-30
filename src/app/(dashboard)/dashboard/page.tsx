"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  Folder,
  Heart,
  Image as ImageIcon,
  Layers,
  Link2,
  Loader2,
  MessageCircle,
  Music2,
  Plus,
  X,
  Instagram,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

type DashboardCounts = { reels: number; posts: number; audio: number; favorites: number };

const libraryViews = [
  { label: "Reels", href: "/reels?type=reel", icon: Film, getValue: (counts: DashboardCounts) => counts.reels },
  { label: "Posts", href: "/reels?type=post", icon: ImageIcon, getValue: (counts: DashboardCounts) => counts.posts },
  { label: "Audio", href: "/reels?type=audio", icon: Music2, getValue: (counts: DashboardCounts) => counts.audio },
  { label: "Favorites", href: "/favorites", icon: Heart, getValue: (counts: DashboardCounts) => counts.favorites },
];

export default function DashboardPage() {
  const {
    reels,
    favorites,
    saveReel,
    collections,
    selectedInstagramAccount,
    setSelectedInstagramAccount,
  } = useReels();
  const { user } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = selectedInstagramAccount
    ? `@${selectedInstagramAccount}`
    : user?.name
    ? user.name.split(" ")[0]
    : "there";

  // Aggregate connected accounts + distinct reel accounts
  const connectedAccounts = user?.connectedAccounts || [];
  const accountHandles = Array.from(
    new Set([
      ...connectedAccounts.map((a) => a.username.toLowerCase()),
      ...(user?.instagramUsername ? [user.instagramUsername.toLowerCase()] : []),
    ])
  ).filter(Boolean);

  const recentlySaved = [...reels].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const previewItems = recentlySaved.slice(0, 3);
  const featuredItem = previewItems[0];
  const sortedCollections = [...collections].sort((a, b) => b.reelCount - a.reelCount).slice(0, 4);

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

        {/* Instagram Multi-Account Switcher Bar */}
        <section className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-rd-lg border border-borderSubtle-light dark:border-borderSubtle-dark bg-surface-light dark:bg-surface-dark shadow-rd-subtle">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark flex items-center gap-1.5 pl-1.5 mr-1">
              <Instagram className="w-3.5 h-3.5 text-brand-500" />
              <span>Library Account:</span>
            </span>

            {/* All Accounts Pill */}
            <button
              onClick={() => setSelectedInstagramAccount(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                !selectedInstagramAccount
                  ? "bg-brand-600 text-white shadow-rd-subtle"
                  : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All Accounts</span>
            </button>

            {/* Individual Instagram Account Pills */}
            {accountHandles.map((handle) => {
              const isSelected = selectedInstagramAccount?.toLowerCase() === handle.toLowerCase();
              return (
                <button
                  key={handle}
                  onClick={() => setSelectedInstagramAccount(handle)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand-600 text-white shadow-rd-subtle"
                      : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark"
                  }`}
                >
                  <span>@{handle}</span>
                </button>
              );
            })}
          </div>

          <Link
            href="/settings"
            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 pr-1.5"
          >
            <Plus className="w-3 h-3" />
            <span>Manage accounts</span>
          </Link>
        </section>

        {/* Quick Ingest & Overview Bar */}
        <section className="overflow-hidden rounded-rd-xl border border-borderSubtle-light bg-surface-light shadow-rd-card dark:border-borderSubtle-dark dark:bg-surface-dark">
          <div className="grid min-h-[20rem] lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="flex min-w-0 flex-col p-5 sm:p-7">
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-brand-600 dark:text-brand-400">
                  REELDASH CAPTURE DOCK
                </p>
                <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight tracking-tight text-primaryText-light dark:text-primaryText-dark sm:text-3xl">
                  {greeting}, {displayName}.
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-secondaryText-light dark:text-secondaryText-dark">
                  {selectedInstagramAccount ? (
                    <>Showing saved reels from <strong className="text-brand-500 font-mono">@{selectedInstagramAccount}</strong>. Paste links below or send DMs directly on Instagram.</>
                  ) : (
                    <>Showing unified feed across all connected accounts. Paste any Instagram link or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.08] text-[10px] font-mono">⌘K</kbd> to search and capture.</>
                  )}
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
                    <button type="button" onClick={() => setInputUrl("")} aria-label="Clear Instagram URL" className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-rd-sm text-mutedText-light transition-colors hover:bg-surfaceSecondary-light hover:text-primaryText-light dark:text-mutedText-dark dark:hover:bg-surfaceSecondary-dark dark:hover:text-primaryText-dark">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </label>
                <button type="submit" disabled={!inputUrl.trim() || isSubmitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-rd-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 shadow-rd-glow">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                  <span>{isSubmitting ? "Saving" : "Save to library"}</span>
                </button>
              </form>

              <div className="mt-auto grid grid-cols-3 divide-x divide-borderSubtle-light pt-6 dark:divide-borderSubtle-dark">
                <div className="pr-4"><p className="font-mono text-2xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{reels.length}</p><p className="mt-0.5 text-xs text-secondaryText-light dark:text-secondaryText-dark">saved items</p></div>
                <div className="px-4"><p className="font-mono text-2xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{thisWeekCount}</p><p className="mt-0.5 text-xs text-secondaryText-light dark:text-secondaryText-dark">saved this week</p></div>
                <div className="pl-4"><p className="font-mono text-2xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{collections.length}</p><p className="mt-0.5 text-xs text-secondaryText-light dark:text-secondaryText-dark">collections</p></div>
              </div>
            </div>

            <div className="relative hidden overflow-hidden border-l border-borderSubtle-light bg-surfaceSecondary-light p-5 dark:border-borderSubtle-dark dark:bg-surfaceSecondary-dark lg:block">
              <div className="absolute inset-x-0 top-0 h-1 bg-brand-500" />
              <div className="flex items-center justify-between"><p className="text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark">Latest capture</p><Link href="/reels" aria-label="Open full library" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"><ArrowUpRight className="h-4 w-4" /></Link></div>
              {featuredItem ? (
                <div className="mt-5"><div className="relative mx-auto h-56 w-40">
                  {previewItems.slice(1).reverse().map((item, index) => (
                    <div key={item.id} className="absolute inset-x-0 top-0 aspect-reel overflow-hidden rounded-rd-md border border-white/40 bg-surfaceTertiary-light shadow-rd-card dark:border-white/10 dark:bg-surfaceTertiary-dark" style={{ transform: `translate(${(index + 1) * 12}px, ${(index + 1) * 10}px) rotate(${(index + 1) * 3}deg)` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <Link href={`/reel/${featuredItem.id}`} className="group absolute inset-0 overflow-hidden rounded-rd-md border border-white/50 bg-surfaceTertiary-light shadow-rd-modal dark:border-white/10 dark:bg-surfaceTertiary-dark">
                    {/* eslint-disable-next-line @next/next/no-img-element */}<img src={featuredItem.thumbnailUrl} alt={`Open ${featuredItem.creatorUsername}'s saved item`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-9 text-white"><p className="truncate text-xs font-semibold">@{featuredItem.creatorUsername || "creator"}</p><p className="mt-0.5 truncate text-[11px] text-white/75">{featuredItem.category || "Unsorted"}</p></div>
                  </Link>
                </div></div>
              ) : (
                <div className="mt-7 grid grid-cols-3 gap-2 px-2">{[0, 1, 2].map((item) => <div key={item} className="aspect-reel rounded-rd-sm border border-borderDefault-light bg-surface-light p-2 dark:border-borderDefault-dark dark:bg-surface-dark"><div className="h-full rounded-[3px] border border-dashed border-borderDefault-light dark:border-borderDefault-dark" /></div>)}</div>
              )}
              <p className="absolute inset-x-5 bottom-5 text-xs leading-5 text-secondaryText-light dark:text-secondaryText-dark">{featuredItem ? "Your most recent saved reference." : "Your latest saved references will appear here."}</p>
            </div>
          </div>
        </section>

        <nav aria-label="Library views" className="grid grid-cols-2 border-y border-borderSubtle-light dark:border-borderSubtle-dark sm:grid-cols-4">
          {libraryViews.map((view) => {
            const Icon = view.icon;
            return <Link key={view.label} href={view.href} className="group flex min-h-24 items-center gap-3 border-b border-borderSubtle-light px-4 py-4 transition-colors hover:bg-surface-light dark:border-borderSubtle-dark dark:hover:bg-surface-dark sm:border-b-0 sm:border-r last:sm:border-r-0"><Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" /><span className="min-w-0"><span className="block font-mono text-xl font-semibold tabular-nums text-primaryText-light dark:text-primaryText-dark">{view.getValue(counts)}</span><span className="mt-0.5 flex items-center gap-1 text-xs text-secondaryText-light dark:text-secondaryText-dark">{view.label}<ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /></span></span></Link>;
          })}
        </nav>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-secondaryText-light dark:text-secondaryText-dark">
                RECENTLY SAVED {selectedInstagramAccount ? `• @${selectedInstagramAccount.toUpperCase()}` : "• ALL ACCOUNTS"}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
                Your visual inbox
              </h2>
            </div>
            {reels.length > 0 && (
              <Link href="/reels" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {reels.length > 0 ? (
            <ReelGrid reels={recentlySaved.slice(0, 8)} />
          ) : (
            <div className="border-y border-borderSubtle-light py-10 dark:border-borderSubtle-dark sm:py-14">
              <div className="grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-rd-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primaryText-light dark:text-primaryText-dark">
                    {selectedInstagramAccount ? `No reels saved from @${selectedInstagramAccount} yet.` : "Your inbox is ready for its first reference."}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-secondaryText-light dark:text-secondaryText-dark">
                    {selectedInstagramAccount ? (
                      <>Send any Reel, Post, or Story from <strong className="text-brand-500 font-mono">@{selectedInstagramAccount}</strong> via DM to <strong className="text-brand-500 font-mono">@reeldash_app</strong>.</>
                    ) : (
                      "Save one good post now. You can collect it, favorite it, and come back with context instead of hunting through Instagram later."
                    )}
                  </p>
                </div>
                <button
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="url"]')?.focus()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-rd-md border border-brand-500/30 px-4 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
                >
                  <Plus className="h-4 w-4" />Add a link
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <aside className="space-y-5 xl:pt-1">
        <section className="border-y border-borderSubtle-light py-5 dark:border-borderSubtle-dark xl:rounded-rd-lg xl:border xl:bg-surface-light xl:px-5 xl:shadow-rd-subtle xl:dark:border-borderSubtle-dark xl:dark:bg-surface-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-secondaryText-light dark:text-secondaryText-dark">LIBRARY PULSE</p>
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

        <section className="border-y border-borderSubtle-light py-5 dark:border-borderSubtle-dark xl:rounded-rd-lg xl:border xl:bg-surface-light xl:px-5 xl:shadow-rd-subtle xl:dark:border-borderSubtle-dark xl:dark:bg-surface-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-secondaryText-light dark:text-secondaryText-dark">COLLECTIONS</p>
              <p className="mt-1 text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">Places for your ideas</p>
            </div>
            <Link href="/collections" aria-label="Open collections" className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-borderSubtle-light dark:divide-borderSubtle-dark">
            {sortedCollections.length > 0 ? (
              sortedCollections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.id}`} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-rd-sm bg-surfaceSecondary-light text-sm dark:bg-surfaceSecondary-dark">
                    {collection.icon || <Folder className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-primaryText-light group-hover:text-brand-600 dark:text-primaryText-dark dark:group-hover:text-brand-400">
                    {collection.name}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-secondaryText-light dark:text-secondaryText-dark">
                    {collection.reelCount}
                  </span>
                </Link>
              ))
            ) : (
              <p className="py-2 text-sm leading-6 text-secondaryText-light dark:text-secondaryText-dark">
                Collections will help you turn saved posts into useful reference sets.
              </p>
            )}
          </div>
        </section>

        <Link
          href="/settings"
          className="group flex items-center gap-3 border-l-2 border-brand-500 bg-brand-500/5 p-4 transition-colors hover:bg-brand-500/10"
        >
          <Instagram className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
              Connected Instagram Accounts
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-secondaryText-light dark:text-secondaryText-dark">
              {connectedAccounts.length} account(s) synced. Click to add more.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-brand-600 transition-transform group-hover:translate-x-0.5 dark:text-brand-400" />
        </Link>
      </aside>
    </div>
  );
}
