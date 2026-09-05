"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Film,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  Mail,
  Music2,
  Plus,
  Search,
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
    smartCategories,
    activeCategory,
    setActiveCategory,
    selectedInstagramAccount,
    setIsNotificationOpen,
    unreadNotificationsCount,
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

  const connectedAccounts = user?.connectedAccounts || [];
  // SINGLE SOURCE OF TRUTH: strictly active accounts
  const activeAccounts = connectedAccounts.filter((a) => a.status === "active");

  const activeAccount = selectedInstagramAccount
    ? activeAccounts.find(
        (a) => a.username.toLowerCase() === selectedInstagramAccount.toLowerCase()
      )
    : null;

  // When a specific profile is selected, display that profile's name or handle.
  // When All Accounts is selected, display the account holder's primary name.
  const displayName = selectedInstagramAccount && activeAccount
    ? activeAccount.displayName && activeAccount.displayName.trim().length > 0
      ? activeAccount.displayName.trim()
      : `@${selectedInstagramAccount}`
    : user?.name
    ? user.name.split(" ")[0]
    : user?.email
    ? user.email.split("@")[0]
    : "Creator";

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
    <div className="w-full space-y-5">
      {/* Payflow-Style Top Search & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs text-secondaryText-light dark:text-secondaryText-dark hover:border-black/[0.08] transition-all w-full max-w-sm cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark group-hover:text-primaryText-light transition-colors" />
          <span className="font-normal text-mutedText-light dark:text-mutedText-dark">Search anything...</span>
          <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-white/[0.06] text-mutedText-light">⌘ F</kbd>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="w-9 h-9 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-center text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors relative cursor-pointer"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-surface-dark shadow-xs animate-in zoom-in-50">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>
          <Link
            href="/integrations/instagram"
            className="w-9 h-9 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-center text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors"
            title="Instagram Integration & DM Bot"
          >
            <Mail className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Top Layer: Quick Ingest & Overview Bar + Library Summary */}
      <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Quick Ingest & Overview Bar */}
        <section className="animate-fade-up delay-0 overflow-hidden rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-rd-card">
          <div className="grid min-h-[20rem] lg:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="flex min-w-0 flex-col p-5 sm:p-7">
                <div>
                  <h1 className="font-bricolage text-[1.85rem] font-bold leading-[1.15] tracking-[-0.03em] text-primaryText-light dark:text-primaryText-dark sm:text-[2.1rem]">
                    {timeGreeting}, {displayName}.
                  </h1>
                  <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-secondaryText-light dark:text-secondaryText-dark" style={{ textWrap: 'balance' } as React.CSSProperties}>
                    {activeAccounts.length === 0
                      ? `Paste any Instagram link below, or connect your Instagram to auto-save Reels via DM. Press `
                      : activeAccounts.length === 1
                      ? `Showing library for @${activeAccounts[0].username}. Paste any Instagram link or press `
                      : selectedInstagramAccount
                      ? `Showing library for @${selectedInstagramAccount}. Paste any Instagram link or press `
                      : `Showing unified library across all accounts. Paste any Instagram link or press `}
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.08] text-[10px] font-mono">⌘K</kbd>
                    {" to search and capture."}
                  </p>
                </div>

                <form onSubmit={handleQuickSave} className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="group relative block">
                    <span className="sr-only">Instagram URL</span>
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedText-light group-focus-within:text-brand-500 dark:text-mutedText-dark" />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(event) => setInputUrl(event.target.value)}
                      placeholder="Paste link or add /<category> (e.g. /yoga, /fitness, /saas)"
                      className="h-12 w-full rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F5] dark:bg-background-dark pl-11 pr-11 text-sm text-primaryText-light shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] transition-colors placeholder:text-mutedText-light focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:border-white/20 dark:focus:ring-white/5 dark:text-primaryText-dark dark:placeholder:text-mutedText-dark"
                    />
                    {inputUrl && (
                      <button
                        type="button"
                        onClick={() => setInputUrl("")}
                        aria-label="Clear Instagram URL"
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-mutedText-light transition-colors hover:bg-black/5 hover:text-primaryText-light dark:text-mutedText-dark dark:hover:bg-white/10 dark:hover:text-primaryText-dark"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                  <button
                    type="submit"
                    disabled={!inputUrl.trim() || isSubmitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#171615] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                    <span>{isSubmitting ? "Saving" : "Save to library"}</span>
                  </button>
                </form>

                <div className="mt-auto grid grid-cols-3 divide-x divide-black/[0.05] dark:divide-white/[0.06] pt-6">
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
                <div className="absolute inset-x-0 top-0 h-[3px] gradient-stripe" />
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

        {/* Right Rail Library Summary (Desktop Only) */}
        <aside className="hidden lg:block animate-fade-up delay-1">
          <section className="h-full rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-rd-card flex flex-col justify-between">
            <div>
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
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F0F0F0] dark:bg-surfaceTertiary-dark">
                        <div className="h-full rounded-full bg-[#171615] dark:bg-white transition-[width] duration-300" style={{ width: `${percentage}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Seamless Library Pulse Views Strip - Full Width */}
      <nav aria-label="Library views" className="animate-fade-up delay-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {libraryViews.map((view) => {
          const Icon = view.icon;
          const value = view.getValue(counts);
          return (
            <Link
              key={view.label}
              href={view.href}
              className="group flex min-h-[4.5rem] items-center gap-3.5 px-5 py-4 rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-black/[0.08] dark:hover:border-white/[0.12] transition-all duration-200 ease-out active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-full bg-[#F5F5F5] dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#171615] dark:text-[#E8E5E1]" strokeWidth={1.75} />
              </div>
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

      {/* Visual Inbox Reel Feed - Edge-to-Edge Wall */}
      <section className="animate-fade-up delay-2 rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-rd-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              Recently Saved
            </h2>
          </div>
          <Link
            href="/reels"
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F5F5] hover:bg-[#EAEAEA] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-primaryText-light dark:text-[#E8E5E1] transition-all"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-[16px]">
          <ReelGrid
            reels={(reels || []).filter((reel) => {
              if (activeCategory) {
                const catLower = activeCategory.trim().toLowerCase();
                const allAssigned = reel.categories && reel.categories.length > 0 ? reel.categories : [reel.category || ""];
                const matchCat = allAssigned.some((c) => c && c.toLowerCase() === catLower);
                const matchTags = (Array.isArray(reel.tags) && reel.tags.some((t) => t && t.toLowerCase() === catLower)) || (Array.isArray(reel.hashtags) && reel.hashtags.some((h) => h && h.toLowerCase() === catLower));
                const matchKeywords = Array.isArray(reel.aiKeywords) && reel.aiKeywords.some((k) => k && k.toLowerCase() === catLower);
                const matchSub = Array.isArray(reel.subcategories) && reel.subcategories.some((s) => s && s.toLowerCase() === catLower);
                if (!matchCat && !matchTags && !matchKeywords && !matchSub) {
                  return false;
                }
              }
              return true;
            })}
            limit={10}
            emptyTitle={activeCategory ? `No reels in #${activeCategory}` : selectedInstagramAccount ? `No reels from @${selectedInstagramAccount}` : "No items saved yet"}
            emptySubtitle={activeCategory ? `Save reels with /${activeCategory} or add this category in reel details.` : selectedInstagramAccount ? `Send a Reel via DM from @${selectedInstagramAccount} or paste a link.` : "Paste any Instagram link above to start your library."}
          />
        </div>
      </section>
    </div>
  );
}
