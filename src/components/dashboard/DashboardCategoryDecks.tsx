'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Folder } from 'lucide-react';
import { Reel } from '@/types/reel';

interface SmartCategory {
  name: string;
  count: number;
  id?: string;
  slug?: string;
}

interface DashboardCategoryDecksProps {
  categories: SmartCategory[];
  reels: Reel[];
  onCategoryClick?: (categoryName: string) => void;
}

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

function CategoryPreviewDeck({
  previews,
  index,
}: {
  previews: string[];
  index: number;
}) {
  const positions = [
    'left-[9%] top-[17%] z-10 -rotate-[8deg] group-hover:left-[6%] group-hover:-rotate-[12deg]',
    'left-[49%] top-[17%] z-20 rotate-[8deg] group-hover:left-[52%] group-hover:rotate-[12deg]',
    'left-[29%] top-[10%] z-30 rotate-0 group-hover:-translate-y-1.5',
  ];

  return (
    <div className="relative isolate aspect-[1.42/1] overflow-hidden rounded-[20px] bg-[#F3F2F5] dark:bg-[#191A20]">
      {/* Soft background glow */}
      <div
        className={`absolute inset-0 ${
          index % 2 === 0
            ? 'bg-[radial-gradient(ellipse_at_50%_70%,rgba(203,181,253,0.25),transparent_72%)]'
            : 'bg-[radial-gradient(ellipse_at_50%_70%,rgba(128,207,160,0.2),transparent_72%)]'
        }`}
      />

      {/* Shadow underneath center card */}
      <div className="absolute inset-x-[15%] bottom-[10%] h-6 rounded-[50%] bg-black/[0.08] blur-xl dark:bg-black/30" />

      {/* 3 Angled Overlapping Cards */}
      {positions.map((posClass, slot) => {
        // Slot 2 is front (center), slot 0 is left, slot 1 is right
        const previewIndex = slot === 2 ? 0 : slot + 1;
        const thumbUrl = previews[previewIndex] || previews[0] || '';

        return (
          <div
            key={slot}
            className={`absolute aspect-[3/4] w-[42%] overflow-hidden rounded-xl border border-white/70 bg-[#EAECE5] shadow-[0_8px_24px_-8px_rgba(26,18,48,0.3)] transition-all duration-300 ease-out dark:border-white/[0.12] dark:bg-[#24232D] dark:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.65)] ${posClass}`}
          >
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-zinc-800 dark:to-zinc-900">
                <Folder className="size-6 text-purple-400 opacity-60" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/[0.05]" />
          </div>
        );
      })}

      {/* Smart collection badge */}
      <div className="absolute bottom-3 left-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-black/[0.05] bg-white/90 px-2.5 py-1 text-[10px] font-medium text-zinc-700 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-[#121316]/90 dark:text-zinc-200">
        <Sparkles className="size-3 text-[#9276BD] dark:text-[#CBB5FD]" />
        <span>Smart collection</span>
      </div>
    </div>
  );
}

export function DashboardCategoryDecks({
  categories,
  reels,
  onCategoryClick,
}: DashboardCategoryDecksProps) {
  // Select top 3 categories by reel count (clean valid non-hashtag categories)
  const topCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    return categories
      .filter((cat) => cat.name && !cat.name.startsWith('#'))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [categories]);

  // Compute 3 preview thumbnails for each top category
  const decksData = useMemo(() => {
    return topCategories.map((cat, idx) => {
      const catLower = cat.name.toLowerCase();
      const matchedReels = reels.filter((r) => {
        const allAssigned = r.categories && r.categories.length > 0 ? r.categories : [r.category || ''];
        return (
          allAssigned.some((c) => String(c || '').toLowerCase() === catLower) ||
          (Array.isArray(r.tags) && r.tags.some((t) => String(t || '').toLowerCase() === catLower))
        );
      });

      const previews = matchedReels
        .map(getMediaUrl)
        .filter(Boolean)
        .slice(0, 3);

      return {
        cat,
        previews,
        index: idx,
      };
    });
  }, [topCategories, reels]);

  if (decksData.length === 0) return null;

  return (
    <section aria-labelledby="dashboard-categories-title">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2
            id="dashboard-categories-title"
            className="text-[15px] font-semibold leading-5 tracking-[-0.015em] text-[#20211F] dark:text-white"
          >
            Categories
          </h2>
        </div>
        <Link
          href="/categories"
          className="flex items-center gap-1 text-xs font-medium text-[#656760] transition-colors hover:text-[#20211F] dark:text-zinc-400 dark:hover:text-white"
        >
          <span>View all</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 3 Category Cards Grid matching reference screenshot */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {decksData.map(({ cat, previews, index }) => (
          <div
            key={cat.id || cat.name}
            onClick={() => onCategoryClick?.(cat.name)}
            className="group relative cursor-pointer rounded-[28px] border border-black/[0.07] bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-[0_16px_40px_-20px_rgba(41,31,63,0.25)] dark:border-white/[0.08] dark:bg-[#121316] dark:hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* 3D Preview Deck */}
            <CategoryPreviewDeck previews={previews} index={index} />

            {/* Title & Count Row */}
            <div className="px-3.5 pb-2 pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  className="truncate text-xl font-bold leading-tight tracking-[-0.035em] text-zinc-900 dark:text-white sm:text-[22px]"
                  title={cat.name}
                >
                  {cat.name}
                </h3>
                <span className="shrink-0 text-xs font-medium font-bricolage tabular-nums text-zinc-500 dark:text-zinc-400">
                  {cat.count} {cat.count === 1 ? 'reel' : 'reels'}
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-white">
                <span>Explore Collection</span>
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
