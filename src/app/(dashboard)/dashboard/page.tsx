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
  Folder,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  Music2,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
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
  const activeAccounts = connectedAccounts.filter((a) => a.status === "active");

  const activeAccount = selectedInstagramAccount
    ? activeAccounts.find(
        (a) => a.username.toLowerCase() === selectedInstagramAccount.toLowerCase()
      )
    : null;

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

  const pastelConfig = [
    { bg: "bg-[#F0EAFF]", fill: "bg-[#B8A4E8]", darkBg: "dark:bg-[#1E1A2E]", darkFill: "dark:bg-[#9B7FD4]", iconBg: "bg-[#EDE5FF]", darkIconBg: "dark:bg-[#2A2440]", iconColor: "text-[#8B6FC0]", darkIconColor: "dark:text-[#B899E8]" },
    { bg: "bg-[#FFF0F3]", fill: "bg-[#E8A4B8]", darkBg: "dark:bg-[#2E1A22]", darkFill: "dark:bg-[#D47F9B]", iconBg: "bg-[#FFE4EB]", darkIconBg: "dark:bg-[#3A2030]", iconColor: "text-[#C06F8B]", darkIconColor: "dark:text-[#E899B3]" },
    { bg: "bg-[#EEFFF5]", fill: "bg-[#7DD4A4]", darkBg: "dark:bg-[#132E1E]", darkFill: "dark:bg-[#5CB882]", iconBg: "bg-[#DEFFEC]", darkIconBg: "dark:bg-[#1A3A26]", iconColor: "text-[#4CA87A]", darkIconColor: "dark:text-[#7FD4A0]" },
    { bg: "bg-[#FFF5E6]", fill: "bg-[#E8C87D]", darkBg: "dark:bg-[#2E2518]", darkFill: "dark:bg-[#D4A85C]", iconBg: "bg-[#FFF0D6]", darkIconBg: "dark:bg-[#3A2E1A]", iconColor: "text-[#B8860B]", darkIconColor: "dark:text-[#E8C260]" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
        }}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs hover:border-black/[0.08] transition-all w-full max-w-sm cursor-pointer group"
      >
        <Search className="w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark group-hover:text-primaryText-light transition-colors" />
        <span className="font-normal text-mutedText-light dark:text-mutedText-dark">Search anything...</span>
        <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-white/[0.06] text-mutedText-light">⌘ F</kbd>
      </button>

      {/* Hero + Right Panel */}
      <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Hero Card */}
        <section className="animate-fade-up delay-0 overflow-hidden rounded-[22px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-rd-card">
          <div className="flex flex-col p-5 sm:p-6">
            {/* Greeting */}
            <h1 className="font-bricolage text-[1.7rem] font-bold leading-[1.15] tracking-[-0.03em] text-primaryText-light dark:text-primaryText-dark sm:text-[1.95rem]">
              {timeGreeting}, {displayName}.
            </h1>

            {/* Quick Save */}
            <form onSubmit={handleQuickSave} className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="group relative block">
                <span className="sr-only">Instagram URL</span>
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedText-light group-focus-within:text-brand-500 dark:text-mutedText-dark" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(event) => setInputUrl(event.target.value)}
                  placeholder="Paste link or add /<category>"
                  className="h-11 w-full rounded-[12px] border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F5] dark:bg-background-dark pl-11 pr-11 text-sm text-primaryText-light shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] transition-colors placeholder:text-mutedText-light focus:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:border-white/20 dark:focus:ring-white/5 dark:text-primaryText-dark dark:placeholder:text-mutedText-dark"
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl("")}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-mutedText-light hover:bg-black/5 hover:text-primaryText-light dark:text-mutedText-dark dark:hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </label>
              <button
                type="submit"
                disabled={!inputUrl.trim() || isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#171615] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-zinc-200 px-5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" strokeWidth={2} />}
                <span>{isSubmitting ? "Saving" : "Save"}</span>
              </button>
            </form>

            {/* Latest Capture — Inline */}
            {featuredItem && (
              <div className="mt-5 flex items-center gap-3 p-3 rounded-[14px] bg-[#FAFAFA] dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04]">
                <Link href={`/reel/${featuredItem.id}`} className="group relative h-14 w-10 shrink-0 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredItem.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                    @{featuredItem.creatorUsername || "creator"}
                  </p>
                  <p className="text-[11px] text-mutedText-light dark:text-mutedText-dark truncate">
                    {featuredItem.category || "Unsorted"}
                  </p>
                </div>
                <Link href="/reels" className="text-mutedText-light hover:text-primaryText-light dark:text-mutedText-dark dark:hover:text-primaryText-dark transition-colors">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel — Premium Pastel */}
        <aside className="hidden lg:block animate-fade-up delay-1">
          <section className="h-full rounded-[22px] border border-black/[0.03] dark:border-white/[0.06] bg-gradient-to-b from-[#FDFAFF] via-white to-[#FFF9FC] dark:from-[#12111A] dark:via-surface-dark dark:to-[#130F14] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-rd-card flex flex-col">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="rounded-xl bg-[#F8F5FF] dark:bg-[#1A182A] py-3 px-2">
                <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-primaryText-dark">{reels.length}</p>
                <p className="text-[10px] text-mutedText-light dark:text-mutedText-dark mt-0.5">saved</p>
              </div>
              <div className="rounded-xl bg-[#FFF5F7] dark:bg-[#2A181E] py-3 px-2">
                <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-primaryText-dark">{thisWeekCount}</p>
                <p className="text-[10px] text-mutedText-light dark:text-mutedText-dark mt-0.5">this week</p>
              </div>
              <div className="rounded-xl bg-[#F0FFF5] dark:bg-[#14261A] py-3 px-2">
                <p className="font-mono text-lg font-bold tabular-nums text-primaryText-light dark:text-primaryText-dark">{collections.length}</p>
                <p className="text-[10px] text-mutedText-light dark:text-mutedText-dark mt-0.5">collections</p>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-black/[0.04] dark:bg-white/[0.06]" />

            {/* Category Breakdown */}
            <div className="space-y-3 flex-1">
              {libraryViews.map((view, i) => {
                const colors = pastelConfig[i];
                const value = view.getValue(counts);
                const percentage = reels.length ? Math.max((value / reels.length) * 100, value ? 10 : 0) : 0;
                const Icon = view.icon;
                return (
                  <Link key={view.label} href={view.href} className="group block">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-md ${colors.iconBg} ${colors.darkIconBg} flex items-center justify-center shrink-0 transition-transform duration-300 ease-premium group-hover:scale-110`}>
                        <Icon className={`w-3 h-3 ${colors.iconColor} ${colors.darkIconColor}`} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-secondaryText-light group-hover:text-primaryText-light dark:text-secondaryText-dark dark:group-hover:text-primaryText-dark transition-colors">
                            {view.label}
                          </span>
                          <span className="font-mono text-[11px] font-bold tabular-nums text-primaryText-light dark:text-primaryText-dark">
                            {value}
                          </span>
                        </div>
                        <div className={`mt-1 h-1 overflow-hidden rounded-full ${colors.bg} ${colors.darkBg}`}>
                          <div className={`h-full rounded-full ${colors.fill} ${colors.darkFill} transition-[width] duration-500 ease-premium`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* View All */}
            <Link
              href="/reels"
              className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark transition-all duration-200"
            >
              <span>View library</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </section>
        </aside>
      </div>

      {/* Recently Saved Feed */}
      <section className="animate-fade-up delay-2 rounded-[22px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-rd-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
            Recently Saved
          </h2>
          <Link
            href="/reels"
            className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F5F5F5] hover:bg-[#EAEAEA] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark transition-all"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-[14px]">
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
