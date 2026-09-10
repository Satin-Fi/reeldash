"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import {
  ArrowRight,
  ArrowUpRight,
  Link2,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

const greetings = [
  { text: "Good morning", textAfternoon: "Good afternoon", textEvening: "Good evening" },
  { text: "Namaste",      textAfternoon: "Namaste",         textEvening: "Namaste" },
  { text: "Ohayō",        textAfternoon: "Konnichiwa",       textEvening: "Konbanwa" },
  { text: "Bonjour",      textAfternoon: "Bonjour",          textEvening: "Bonsoir" },
];

export default function DashboardPage() {
  const {
    reels, favorites, saveReel, collections,
    activeCategory, selectedInstagramAccount,
  } = useReels();
  const { user } = useAuth();
  const [inputUrl, setInputUrl]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => { setGreetingIndex(Math.floor(Math.random() * greetings.length)); }, []);

  const hour = new Date().getHours();
  const g    = greetings[greetingIndex] || greetings[0];
  const timeGreeting = hour < 12 ? g.text : hour < 17 ? g.textAfternoon : g.textEvening;

  const connectedAccounts = user?.connectedAccounts || [];
  const activeAccounts    = connectedAccounts.filter((a) => a.status === "active");
  const activeAccount     = selectedInstagramAccount
    ? activeAccounts.find((a) => a.username.toLowerCase() === selectedInstagramAccount.toLowerCase())
    : null;

  const displayName = selectedInstagramAccount && activeAccount
    ? (activeAccount.displayName?.trim() || `@${selectedInstagramAccount}`)
    : user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Creator";

  const recentlySaved = [...reels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const featuredItem  = recentlySaved[0];
  const stackItems    = recentlySaved.slice(1, 3);

  const thisWeekCount = reels.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return Number.isFinite(t) && Date.now() - t < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try { await saveReel(inputUrl.trim()); setInputUrl(""); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="w-full space-y-4">

      {/* ── Search ── */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-xs hover:border-black/10 transition-all w-full max-w-xs cursor-pointer group"
      >
        <Search className="w-3.5 h-3.5 text-mutedText-light dark:text-mutedText-dark" />
        <span className="text-mutedText-light dark:text-mutedText-dark">Search...</span>
        <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-white/[0.06] text-mutedText-light">⌘K</kbd>
      </button>

      {/* ── Hero: full-width split ── */}
      <section className="overflow-hidden rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-rd-card">
        <div className="flex min-h-[13rem]">

          {/* Left: text + form + stats */}
          <div className="flex flex-col justify-between p-6 flex-1 min-w-0">
            {/* Greeting */}
            <div>
              <h1 className="font-bricolage text-[1.75rem] font-bold leading-[1.1] tracking-[-0.03em] text-primaryText-light dark:text-primaryText-dark">
                {timeGreeting}, {displayName}.
              </h1>
            </div>

            {/* Save form */}
            <form onSubmit={handleQuickSave} className="mt-5 flex gap-2">
              <label className="group relative flex-1">
                <span className="sr-only">Instagram URL</span>
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mutedText-light group-focus-within:text-brand-500 dark:text-mutedText-dark" />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste Instagram link..."
                  className="h-10 w-full rounded-[10px] border border-black/[0.07] dark:border-white/[0.08] bg-[#F8F8F8] dark:bg-background-dark pl-10 pr-9 text-sm text-primaryText-light placeholder:text-mutedText-light focus:border-black/20 focus:outline-none focus:bg-white transition-all dark:text-primaryText-dark dark:placeholder:text-mutedText-dark dark:focus:border-white/20 dark:focus:bg-surface-dark"
                />
                {inputUrl && (
                  <button type="button" onClick={() => setInputUrl("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-mutedText-light hover:text-primaryText-light">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </label>
              <button
                type="submit"
                disabled={!inputUrl.trim() || isSubmitting}
                className="h-10 px-4 rounded-[10px] bg-[#111] dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-black dark:hover:bg-zinc-200 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                Save
              </button>
            </form>

            {/* Stats row */}
            <div className="mt-5 flex items-center gap-5">
              <div>
                <span className="font-mono text-base font-bold text-primaryText-light dark:text-primaryText-dark">{reels.length}</span>
                <span className="ml-1.5 text-[11px] text-mutedText-light dark:text-mutedText-dark">saved</span>
              </div>
              <div className="w-px h-3 bg-black/[0.08] dark:bg-white/[0.08]" />
              <div>
                <span className="font-mono text-base font-bold text-primaryText-light dark:text-primaryText-dark">{thisWeekCount}</span>
                <span className="ml-1.5 text-[11px] text-mutedText-light dark:text-mutedText-dark">this week</span>
              </div>
              <div className="w-px h-3 bg-black/[0.08] dark:bg-white/[0.08]" />
              <div>
                <span className="font-mono text-base font-bold text-primaryText-light dark:text-primaryText-dark">{collections.length}</span>
                <span className="ml-1.5 text-[11px] text-mutedText-light dark:text-mutedText-dark">collections</span>
              </div>
            </div>
          </div>

          {/* Right: reel thumbnail stack */}
          {featuredItem ? (
            <div className="relative hidden sm:flex items-center justify-center bg-[#F7F6F4] dark:bg-white/[0.02] border-l border-black/[0.04] dark:border-white/[0.04] w-[10.5rem] shrink-0 overflow-hidden">
              {stackItems.slice(0).reverse().map((item, i) => (
                <div
                  key={item.id}
                  className="absolute w-[6.5rem] rounded-[10px] overflow-hidden shadow-rd-card border border-white/60 dark:border-white/10"
                  style={{ aspectRatio: "9/16", transform: `translate(${(i + 1) * 9}px, ${(i + 1) * 5}px) rotate(${(i + 1) * 4}deg)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
              <Link
                href={`/reel/${featuredItem.id}`}
                className="group relative z-10 w-[6.5rem] rounded-[10px] overflow-hidden shadow-rd-modal border border-white/70 dark:border-white/15"
                style={{ aspectRatio: "9/16" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredItem.thumbnailUrl}
                  alt={`@${featuredItem.creatorUsername}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-2 pb-2 pt-8">
                  <p className="text-white text-[10px] font-semibold truncate">@{featuredItem.creatorUsername || "creator"}</p>
                </div>
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <ArrowUpRight className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            /* Empty state: subtle dashed placeholder */
            <div className="hidden sm:flex items-center justify-center border-l border-black/[0.04] dark:border-white/[0.04] w-[10.5rem] shrink-0">
              <div className="w-[6.5rem] rounded-[10px] border-2 border-dashed border-black/[0.08] dark:border-white/[0.08]" style={{ aspectRatio: "9/16" }} />
            </div>
          )}
        </div>
      </section>

      {/* ── Recently Saved ── */}
      <section className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-surface-dark p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-rd-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">Recently Saved</h2>
          <Link
            href="/reels"
            className="group inline-flex items-center gap-1 text-[11px] font-medium text-mutedText-light hover:text-primaryText-light dark:text-mutedText-dark dark:hover:text-primaryText-dark transition-colors"
          >
            View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-[12px]">
          <ReelGrid
            reels={(reels || []).filter((reel) => {
              if (!activeCategory) return true;
              const cat = activeCategory.trim().toLowerCase();
              const assigned = reel.categories?.length ? reel.categories : [reel.category || ""];
              return (
                assigned.some((c) => c?.toLowerCase() === cat) ||
                reel.tags?.some((t) => t?.toLowerCase() === cat) ||
                reel.hashtags?.some((h) => h?.toLowerCase() === cat) ||
                reel.aiKeywords?.some((k) => k?.toLowerCase() === cat) ||
                reel.subcategories?.some((s) => s?.toLowerCase() === cat)
              );
            })}
            limit={10}
            emptyTitle={
              activeCategory ? `No reels in #${activeCategory}`
              : selectedInstagramAccount ? `No reels from @${selectedInstagramAccount}`
              : "No items saved yet"
            }
            emptySubtitle={
              activeCategory ? `Save reels with /${activeCategory} or add this category in reel details.`
              : selectedInstagramAccount ? `Send a Reel via DM from @${selectedInstagramAccount} or paste a link.`
              : "Paste any Instagram link above to start your library."
            }
          />
        </div>
      </section>
    </div>
  );
}
