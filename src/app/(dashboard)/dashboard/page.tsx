'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  Play,
  ArrowRight,
  Bookmark,
  Users,
  Folder,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/context/ReelContext';
import { Reel } from '@/types/reel';
import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
import { DashboardCategoryDecks } from '@/components/dashboard/DashboardCategoryDecks';

/* ─── Helpers ─── */
function getMediaUrl(reel: any): string {
  if (!reel) return '';
  return (
    reel.thumbnailUrl ||
    reel.thumbnail ||
    reel.coverUrl ||
    reel.imageUrl ||
    reel.displayUrl ||
    ''
  );
}

function getCreator(reel: any): string {
  if (!reel) return 'instagram';
  return (
    reel.creatorUsername ||
    reel.creatorFullName ||
    (typeof reel.creator === 'string' ? reel.creator : reel.creator?.username) ||
    'instagram'
  );
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return 'recently';
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    reels,
    smartCategories,
    setActiveCategory,
  } = useReels();

  const [activePlayerReel, setActivePlayerReel] = useState<Reel | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    if (user?.name) return user.name.split(' ')[0];
    return 'Piyush';
  }, [user]);

  // Global ⌘K / Ctrl+K listener navigates directly to /search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const creators = useMemo(() => {
    const set = new Set<string>();
    reels.forEach((r) => {
      const c = getCreator(r);
      if (c && c !== 'instagram') set.add(c);
    });
    return Array.from(set);
  }, [reels]);

  const recentSaves = useMemo(() => {
    return [...reels]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [reels]);

  return (
    <div className="w-full space-y-8 pb-16 pt-2">

      {/* ─── 1. Header: compact two-column command area ─── */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Greeting */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#74776F]">
            Workspace
          </p>
          <h1 className="mt-1 text-[28px] font-semibold leading-9 tracking-[-0.035em] text-[#20211F] sm:text-[32px] dark:text-white">
            {greeting}, {userName}.
          </h1>
        </div>

        {/* Right: Search form redirecting to /search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchInput.trim()) {
              router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
            } else {
              router.push('/search');
            }
          }}
          className="group relative flex h-11 w-full items-center gap-3 rounded-full border border-[#E4E5DF] bg-white px-4 text-sm text-[#656760] shadow-[0_2px_5px_rgba(24,26,20,0.04)] transition-[border-color,box-shadow] duration-[160ms] hover:border-[#CFD1C8] hover:shadow-[0_3px_10px_rgba(24,26,20,0.06)] focus-within:border-[#6D4AFF] focus-within:ring-2 focus-within:ring-[#6D4AFF]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 lg:w-[420px]"
        >
          <Search className="size-[18px] shrink-0 text-[#74776F] dark:text-zinc-500" strokeWidth={1.75} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your Reel Memory (topic, creator, caption)…"
            className="w-full bg-transparent text-sm text-[#20211F] outline-none placeholder:text-[#74776F] dark:text-white dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="ml-auto hidden h-6 shrink-0 items-center gap-1 rounded-md border border-[#E4E5DF] bg-[#F7F7F5] px-1.5 font-mono text-[11px] text-[#656760] transition-colors hover:bg-[#EDE9FE] hover:text-[#6D4AFF] sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            title="Press Enter or ⌘K to search"
          >
            <Command className="size-3" />K
          </button>
        </form>
      </header>

      {/* ─── 2. Categories (3D Preview Deck Cards) ─── */}
      <DashboardCategoryDecks
        categories={smartCategories}
        reels={reels}
        onCategoryClick={(categoryTitle) => {
          setActiveCategory(categoryTitle);
          router.push(`/reels?category=${encodeURIComponent(categoryTitle)}`);
        }}
      />

      {/* ─── 3. Recent Saves ─── */}
      <section aria-labelledby="recent-saves-title">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2
              id="recent-saves-title"
              className="text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#20211F] dark:text-white"
            >
              Recent saves
            </h2>
            {recentSaves.length > 0 && (
              <span className="rounded-full bg-[#F2F2EF] px-2 py-0.5 text-[11px] font-medium font-bricolage tabular-nums text-[#74776F] dark:bg-zinc-800 dark:text-zinc-400">
                {recentSaves.length}
              </span>
            )}
          </div>
          <Link
            href="/reels"
            className="flex items-center gap-1 text-xs font-medium text-[#656760] transition-colors hover:text-[#20211F] dark:text-zinc-400 dark:hover:text-white"
          >
            View library
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {recentSaves.length > 0 ? (
          <div className="flex snap-x snap-proximity gap-4 overflow-x-auto px-px pb-4 pt-1 [scrollbar-width:thin]">
            {recentSaves.map((reel) => {
              const thumb = getMediaUrl(reel);
              const creator = getCreator(reel);
              return (
                <div
                  key={reel.id}
                  onClick={() => setActivePlayerReel(reel)}
                  className="group w-[140px] shrink-0 snap-start cursor-pointer sm:w-[160px]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-black/10 bg-[#EAECE5] shadow-[0_2px_5px_rgba(24,26,20,0.06)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-1 group-hover:shadow-[0_10px_24px_-10px_rgba(24,26,20,0.28)] motion-reduce:transition-none motion-reduce:transform-none dark:border-white/10 dark:bg-zinc-800">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={reel.caption || `Reel by @${creator}`}
                        className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:transform-none"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Play className="size-7 text-[#A3A69D]" />
                      </div>
                    )}
                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                        <Play className="size-4 fill-white" />
                      </span>
                    </div>
                  </div>

                  {/* Metadata below thumbnail */}
                  <p className="mt-2.5 truncate text-xs font-medium text-[#20211F] dark:text-zinc-100">
                    @{creator}
                  </p>
                  {reel.category && (
                    <p className="mt-0.5 truncate text-[11px] text-[#74776F] dark:text-zinc-500">
                      {reel.category}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E4E5DF] p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-[#74776F]">No saved reels yet.</p>
          </div>
        )}
      </section>

      {/* ─── 4. Library Vault Stats ─── */}
      <section aria-labelledby="library-stats-title">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="library-stats-title"
            className="text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#20211F] dark:text-white"
          >
            Library Vault
          </h2>
          <Link
            href="/reels"
            className="text-xs font-medium text-[#656760] transition-colors hover:text-[#20211F] dark:text-zinc-400 dark:hover:text-white"
          >
            Open Library
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Saved Reels */}
          <Link
            href="/reels?type=all"
            className="group flex items-center justify-between rounded-2xl border border-[#E4E5DF] bg-white p-5 shadow-[0_1px_2px_rgba(24,26,20,0.03),0_6px_20px_-16px_rgba(24,26,20,0.18)] transition-[border-color,shadow] duration-[160ms] hover:border-[#CFD1C8] hover:shadow-[0_4px_16px_-8px_rgba(24,26,20,0.16)] motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div>
              <span className="text-[32px] font-medium leading-none tracking-tight text-[#20211F] font-bricolage tabular-nums dark:text-white">
                {reels.length}
              </span>
              <p className="mt-1.5 text-xs font-medium text-[#74776F]">
                Saved Reels & Posts
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl border border-[#E4E5DF] bg-[#F2F2EF] text-[#656760] transition-colors group-hover:border-[#CFD1C8] group-hover:bg-[#F0ECFF] group-hover:text-[#6D4AFF] dark:border-zinc-700 dark:bg-zinc-800">
              <Bookmark className="size-4" />
            </span>
          </Link>

          {/* Creators */}
          <Link
            href="/reels"
            className="group flex items-center justify-between rounded-2xl border border-[#E4E5DF] bg-white p-5 shadow-[0_1px_2px_rgba(24,26,20,0.03),0_6px_20px_-16px_rgba(24,26,20,0.18)] transition-[border-color,shadow] duration-[160ms] hover:border-[#CFD1C8] hover:shadow-[0_4px_16px_-8px_rgba(24,26,20,0.16)] motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div>
              <span className="text-[32px] font-medium leading-none tracking-tight text-[#20211F] font-bricolage tabular-nums dark:text-white">
                {creators.length}
              </span>
              <p className="mt-1.5 text-xs font-medium text-[#74776F]">
                Creators Tracked
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl border border-[#E4E5DF] bg-[#F2F2EF] text-[#656760] transition-colors group-hover:border-[#CFD1C8] group-hover:bg-[#F0ECFF] group-hover:text-[#6D4AFF] dark:border-zinc-700 dark:bg-zinc-800">
              <Users className="size-4" />
            </span>
          </Link>

          {/* Categories */}
          <Link
            href="/categories"
            className="group flex items-center justify-between rounded-2xl border border-[#E4E5DF] bg-white p-5 shadow-[0_1px_2px_rgba(24,26,20,0.03),0_6px_20px_-16px_rgba(24,26,20,0.18)] transition-[border-color,shadow] duration-[160ms] hover:border-[#CFD1C8] hover:shadow-[0_4px_16px_-8px_rgba(24,26,20,0.16)] motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div>
              <span className="text-[32px] font-medium leading-none tracking-tight text-[#20211F] font-bricolage tabular-nums dark:text-white">
                {smartCategories.length || 0}
              </span>
              <p className="mt-1.5 text-xs font-medium text-[#74776F]">
                Active Categories
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl border border-[#E4E5DF] bg-[#F2F2EF] text-[#656760] transition-colors group-hover:border-[#CFD1C8] group-hover:bg-[#F0ECFF] group-hover:text-[#6D4AFF] dark:border-zinc-700 dark:bg-zinc-800">
              <Folder className="size-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* ─── 5. Recent Activity ─── */}
      {reels.length > 0 && (
        <section aria-labelledby="recent-activity-title">
          <h2
            id="recent-activity-title"
            className="mb-4 text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#20211F] dark:text-white"
          >
            Recent Activity
          </h2>

          <div className="rounded-2xl border border-[#E4E5DF] bg-white shadow-[0_1px_2px_rgba(24,26,20,0.03),0_6px_20px_-16px_rgba(24,26,20,0.18)] dark:border-zinc-800 dark:bg-zinc-900">
            <ul className="divide-y divide-[#F2F2EF] dark:divide-zinc-800">
              {reels.slice(0, 5).map((r, i) => {
                const creator = getCreator(r);
                const time = formatRelativeTime(r.createdAt);
                const thumb = getMediaUrl(r);
                return (
                  <li
                    key={r.id || i}
                    onClick={() => setActivePlayerReel(r)}
                    className="group flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors duration-[160ms] hover:bg-[#F7F7F5] dark:hover:bg-zinc-800/50"
                  >
                    {/* Tiny thumbnail */}
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-[#EAECE5] dark:border-white/10 dark:bg-zinc-800">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="size-4 text-[#A3A69D]" />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-[#20211F] group-hover:text-[#6D4AFF] dark:text-zinc-100 dark:group-hover:text-violet-400">
                        @{creator}
                      </span>
                      {r.category && (
                        <span className="truncate text-xs text-[#74776F] dark:text-zinc-500">
                          {r.category}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#A3A69D] dark:text-zinc-600">
                      <Clock className="size-3" />
                      <span className="font-mono">{time}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Reel Player Modal */}
      {activePlayerReel && (
        <ReelPlayerModal
          reel={activePlayerReel}
          isOpen={true}
          onClose={() => setActivePlayerReel(null)}
        />
      )}
    </div>
  );
}
