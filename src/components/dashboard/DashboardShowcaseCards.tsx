"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, ArrowRight, Search, ScanText } from "lucide-react";
import Link from "next/link";
import {
  AvatarFox,
  AvatarBunny,
  AvatarGirl,
  AvatarBoy,
  OverlappingAvatarStack,
  ReelMemoryNucleus,
  InstagramVaultIcon,
  AudioSpectrumIcon,
  SmartCategorizeIcon,
  SparkleStar,
} from "./DashboardGraphics";

/* ========================================================================== */
/* 1. ORBITAL REEL MEMORY HUB (Pure visual craft — Reference Image 2)         */
/* ========================================================================== */

interface OrbitalReelMemoryHubProps {
  className?: string;
  onLaunchMemory?: () => void;
}

export function OrbitalReelMemoryHub({
  className = "",
  onLaunchMemory,
}: OrbitalReelMemoryHubProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const headingId = useId();

  return (
    <div
      className={`relative isolate flex flex-col justify-between overflow-hidden rounded-[32px] border border-purple-200/60 bg-gradient-to-br from-[#E0F2FE]/55 via-[#EDE9FE]/50 to-[#FFE4E6]/50 p-6 sm:p-7 backdrop-blur-xl shadow-[0_12px_40px_-16px_rgba(167,139,250,0.22)] dark:border-purple-800/35 dark:from-[#0B0F19]/90 dark:via-[#16122E]/85 dark:to-[#2A0F38]/70 ${className}`}
      aria-labelledby={headingId}
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 size-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-900/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -bottom-16 size-72 rounded-full bg-pink-200/40 blur-3xl dark:bg-pink-900/15"
        aria-hidden="true"
      />

      {/* Minimal Header — No subtext fluff */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-purple-100/90 text-purple-700 shadow-sm dark:bg-purple-900/50 dark:text-purple-300">
            <SparkleStar color="#8B5CF6" size={14} />
          </span>
          <h2
            id={headingId}
            className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white"
          >
            Reel Memory
          </h2>
        </div>

        <button
          type="button"
          onClick={onLaunchMemory}
          className="group inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-purple-700 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow dark:border-purple-800/50 dark:bg-purple-950/70 dark:text-purple-300"
          title="Search Reel Memory (⌘K)"
        >
          <Search className="size-3 text-purple-600 dark:text-purple-400" />
          <span className="font-mono text-[10px]">⌘K</span>
        </button>
      </div>

      {/* Orbit Canvas (Reference Image 2) */}
      <div className="relative mx-auto my-4 flex h-[290px] w-full max-w-[460px] items-center justify-center">
        {/* Soft concentric orbital rings */}
        <div
          className="pointer-events-none absolute size-[270px] rounded-full border border-purple-300/35 dark:border-purple-400/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute size-[195px] rounded-full border border-dashed border-sky-300/50 dark:border-sky-400/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute size-[120px] rounded-full bg-purple-200/30 blur-xl dark:bg-purple-600/15"
          aria-hidden="true"
        />

        {/* Center Nucleus */}
        <motion.div
          animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-20 cursor-pointer"
          onClick={onLaunchMemory}
          title="Open Reel Memory (⌘K)"
        >
          <ReelMemoryNucleus size={86} />
        </motion.div>

        {/* Node 1: Top-Left (AvatarGirl + Instagram capsule) */}
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-3 top-2 z-20 flex flex-col items-center"
        >
          <div className="size-11 rounded-full shadow-[0_6px_20px_rgba(196,181,253,0.45)] ring-2 ring-white/90 dark:ring-purple-950">
            <AvatarGirl size={44} />
          </div>
          <div className="relative mt-1.5 flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-[#EDE9FE]/95 px-3 py-1 shadow-sm backdrop-blur-md dark:border-purple-800/80 dark:bg-[#2E1065]/90">
            <span
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-[#EDE9FE] dark:border-b-[#2E1065]"
              aria-hidden="true"
            />
            <InstagramVaultIcon size={15} />
            <span className="text-[11px] font-semibold text-purple-900 dark:text-purple-100">
              Instagram
            </span>
          </div>
        </motion.div>

        {/* Node 2: Top-Right (AvatarFox + Categories capsule) */}
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
          transition={{
            duration: 5.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute right-3 top-2 z-20 flex flex-col items-center"
        >
          <div className="size-11 rounded-full shadow-[0_6px_20px_rgba(251,146,60,0.35)] ring-2 ring-white/90 dark:ring-amber-950">
            <AvatarFox size={44} />
          </div>
          <div className="relative mt-1.5 flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-[#FEF3C7]/95 px-3 py-1 shadow-sm backdrop-blur-md dark:border-amber-800/80 dark:bg-[#451A03]/90">
            <span
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-[#FEF3C7] dark:border-b-[#451A03]"
              aria-hidden="true"
            />
            <SmartCategorizeIcon size={15} />
            <span className="text-[11px] font-semibold text-amber-950 dark:text-amber-100">
              Categories
            </span>
          </div>
        </motion.div>

        {/* Node 3: Bottom-Left (AvatarBunny + Audio capsule) */}
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
          className="absolute bottom-2 left-3 z-20 flex flex-col items-center"
        >
          <div className="size-11 rounded-full shadow-[0_6px_20px_rgba(110,231,183,0.35)] ring-2 ring-white/90 dark:ring-emerald-950">
            <AvatarBunny size={44} />
          </div>
          <div className="relative mt-1.5 flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#ECFDF5]/95 px-3 py-1 shadow-sm backdrop-blur-md dark:border-emerald-800/80 dark:bg-[#064E3B]/90">
            <span
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-[#ECFDF5] dark:border-b-[#064E3B]"
              aria-hidden="true"
            />
            <AudioSpectrumIcon size={15} />
            <span className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-100">
              Audio
            </span>
          </div>
        </motion.div>

        {/* Node 4: Bottom-Right (AvatarBoy + Creators capsule) */}
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, 5, 0] }}
          transition={{
            duration: 4.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.1,
          }}
          className="absolute bottom-2 right-3 z-20 flex flex-col items-center"
        >
          <div className="size-11 rounded-full shadow-[0_6px_20px_rgba(251,113,133,0.35)] ring-2 ring-white/90 dark:ring-rose-950">
            <AvatarBoy size={44} />
          </div>
          <div className="relative mt-1.5 flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-[#FFE4E6]/95 px-3 py-1 shadow-sm backdrop-blur-md dark:border-rose-800/80 dark:bg-[#4C0519]/90">
            <span
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-[#FFE4E6] dark:border-b-[#4C0519]"
              aria-hidden="true"
            />
            <ScanText className="size-3.5 text-rose-600 dark:text-rose-300" />
            <span className="text-[11px] font-semibold text-rose-950 dark:text-rose-100">
              Creators
            </span>
          </div>
        </motion.div>

        {/* Floating Sparkle Stars */}
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-24 top-6 z-10"
        >
          <SparkleStar color="#FBBF24" size={19} />
        </motion.div>
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, -12, 0] }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
          className="absolute bottom-10 left-28 z-10"
        >
          <SparkleStar color="#38BDF8" size={18} />
        </motion.div>
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, 8, 0] }}
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.4,
          }}
          className="absolute left-20 top-24 z-10"
        >
          <SparkleStar color="#C084FC" size={15} />
        </motion.div>
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, -8, 0] }}
          transition={{
            duration: 5.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.9,
          }}
          className="absolute bottom-8 right-24 z-10"
        >
          <SparkleStar color="#F43F5E" size={17} />
        </motion.div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 2. STACKED HIGHLIGHTS CARD (Pure visual craft — Reference Image 3)         */
/* ========================================================================== */

export interface HighlightCategory {
  name: string;
  count: number;
  icon?: string;
  slug?: string;
}

interface StackedHighlightsCardProps {
  className?: string;
  categories?: HighlightCategory[];
  onCategoryClick?: (categoryName: string) => void;
}

export function StackedHighlightsCard({
  className = "",
  categories,
  onCategoryClick,
}: StackedHighlightsCardProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const headingId = useId();

  // Dynamically compute display rows from real categories
  const displayRows = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      return [
        { id: "tech", title: "Tech & Dev", count: 0, tone: "violet" as const, avatars: ["girl", "bunny", "fox", "boy"] as const },
        { id: "travel", title: "Travel & Places", count: 0, tone: "slate" as const, avatars: ["boy", "girl", "bunny"] as const },
        { id: "design", title: "Design & Art", count: 0, tone: "violet" as const, avatars: ["girl", "fox"] as const },
        { id: "comedy", title: "Entertainment & Comedy", count: 0, tone: "slate" as const, avatars: ["bunny"] as const },
      ];
    }

    // Filter valid categories (ignore hashtag tags)
    const valid = categories
      .filter((c) => c.name && !c.name.startsWith("#"))
      .sort((a, b) => b.count - a.count);

    // Prioritize non-General if we have enough distinctive categories, else include all
    const nonGeneral = valid.filter((c) => c.name.toLowerCase() !== "general");
    const chosen = nonGeneral.length >= 4 ? nonGeneral.slice(0, 4) : valid.slice(0, 4);

    const tones = ["violet", "slate", "violet", "slate"] as const;
    const avatarSets = [
      ["girl", "bunny", "fox", "boy"] as const,
      ["boy", "girl", "bunny"] as const,
      ["girl", "fox"] as const,
      ["bunny"] as const,
    ];

    return chosen.map((cat, idx) => ({
      id: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      title: cat.name,
      count: cat.count,
      tone: tones[idx % tones.length],
      avatars: avatarSets[idx % avatarSets.length],
    }));
  }, [categories]);

  return (
    <div
      className={`relative isolate flex flex-col justify-between overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[#FAFAFE] p-6 sm:p-7 dark:border-zinc-800/80 dark:bg-[#12131A] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.06)] ${className}`}
      aria-labelledby={headingId}
    >
      {/* Background: Organic multi-lobed petal/cloud silhouette (Image 3) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 520 440"
          className="size-[480px] max-w-none opacity-40 dark:opacity-15 text-purple-300 dark:text-purple-600"
          fill="currentColor"
        >
          <path d="M259 37C293 2 353 16 363 64C405 42 459 72 453 119C505 127 517 183 480 217C521 254 501 311 452 320C460 368 415 401 371 385C351 431 295 436 266 397C225 426 171 405 164 359C116 378 70 342 80 295C30 291 10 235 46 199C7 163 29 107 78 101C73 51 122 20 165 43C185 2 234 2 259 37Z" />
        </svg>
      </div>

      {/* Minimal Header — No subtext fluff */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <h2
          id={headingId}
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          Categories
        </h2>
        <Link
          href="/categories"
          className="group flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400"
        >
          <span>View all</span>
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 4 Stacked White Pill Capsules (Direct Image 3 Replication) */}
      <div className="relative z-10 flex flex-col gap-2.5">
        {displayRows.map((row) => (
          <motion.div
            key={row.id}
            initial={false}
            whileHover={reducedMotion ? undefined : { y: -2, scale: 1.012 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={() => onCategoryClick?.(row.title)}
            className="group flex cursor-pointer items-center justify-between rounded-full border border-white/95 bg-white px-4 py-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-md dark:border-zinc-700/60 dark:bg-[#1A1B26] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.35)]"
          >
            {/* Left: Trend indicator arrow circle */}
            <div className="flex items-center gap-3">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-white shadow-sm transition-transform group-hover:scale-105 ${
                  row.tone === "violet"
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-500"
                    : "bg-gradient-to-tr from-slate-600 to-zinc-700 dark:from-zinc-600 dark:to-zinc-700"
                }`}
              >
                <ArrowUp className="size-3.5 stroke-[2.5]" />
              </span>

              {/* Middle: Title and counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-800 transition-colors group-hover:text-purple-600 dark:text-zinc-100 dark:group-hover:text-purple-300">
                  {row.title}
                </span>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {row.count}
                </span>
              </div>
            </div>

            {/* Right: Overlapping Avatars */}
            <div className="flex items-center">
              <OverlappingAvatarStack avatars={[...row.avatars]} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Perimeter Sparkle Stars (Image 3) */}
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-1 top-10 z-20"
      >
        <SparkleStar color="#38BDF8" size={19} />
      </motion.div>
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, 7, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="pointer-events-none absolute right-2 top-24 z-20"
      >
        <SparkleStar color="#818CF8" size={17} />
      </motion.div>
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute left-3 bottom-8 z-20"
      >
        <SparkleStar color="#F97316" size={16} />
      </motion.div>
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="pointer-events-none absolute right-4 bottom-3 z-20"
      >
        <SparkleStar color="#A855F7" size={18} />
      </motion.div>
    </div>
  );
}
