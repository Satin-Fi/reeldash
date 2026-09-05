"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Reel, ViewMode } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import { ReelPlayer } from "@/components/reels/ReelPlayer";
import {
  Heart,
  MoreVertical,
  ExternalLink,
  Trash2,
  Copy,
  Images,
  Music2,
  Play,
  FileText,
  Image as ImageIcon,
  Film,
  Tag,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReelCardProps {
  reel: Reel;
  viewMode?: ViewMode;
}

export function ReelCard({ reel, viewMode = "grid" }: ReelCardProps) {
  const { toggleFavorite, deleteReel, smartCategories, updateCategory, showToast } = useReels();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const didHoldRef = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const startHold = (e: React.TouchEvent | React.MouseEvent) => {
    if ("button" in e && e.button !== 0) return;

    // Show three-dot menu button on touch
    setIsTouched(true);
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    didHoldRef.current = false;
    if ("touches" in e && e.touches[0]) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      setIsPeeking(true);
    }, 280);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // CRITICAL FIX: If peek is already active, finger movement MUST NOT close it!
    if (isPeeking || didHoldRef.current) return;
    if (touchStartPosRef.current && e.touches[0]) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      // Cancel peek activation if user is scrolling/swiping
      if (dx > 25 || dy > 25) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    }
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    touchStartPosRef.current = null;
    if (didHoldRef.current) {
      setIsPeeking(false);
    }
    // Keep 3-dot button visible for 2.5 seconds on touch release
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => {
      setIsTouched(false);
    }, 2500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(reel.id);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Link copied to clipboard");
    setIsMenuOpen(false);
  };

  const handleCardClick = () => {
    if (didHoldRef.current) {
      didHoldRef.current = false;
      return;
    }
    if (!isMenuOpen) {
      setIsPlayerOpen(true);
    }
  };

  const isCarouselPost =
    !!reel.isCarousel ||
    (typeof reel.duration === "string" && reel.duration.toLowerCase().includes("carousel")) ||
    (Array.isArray(reel.carouselImages) && reel.carouselImages.length > 1) ||
    (Array.isArray(reel.carouselSlides) && reel.carouselSlides.length > 1);

  const carouselCount =
    reel.carouselImages?.length ||
    reel.carouselSlides?.length ||
    (reel.duration?.match(/Carousel\s*\(([0-9]+)\)/i)?.[1]
      ? parseInt(reel.duration.match(/Carousel\s*\(([0-9]+)\)/i)![1], 10)
      : null);

  const mediaType = isCarouselPost ? "post" : (reel.mediaType || "reel");

  const resolvedShortcode =
    reel.shortcode ||
    reel.instagramUrl?.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/)?.[1] ||
    "";
  const rawHandle = reel.creatorUsername
    ? reel.creatorUsername.replace(/^@/, "").trim()
    : "";
  const isGenericCreator =
    !rawHandle ||
    rawHandle.toLowerCase() === "instagram" ||
    rawHandle.toLowerCase() === "creator" ||
    rawHandle.startsWith("ig_");
  const cleanUsername = isGenericCreator ? "" : rawHandle;
  const hasValidCreator = !!cleanUsername;

  let imageSrc = reel.thumbnailUrl;
  if (!imageError && imageSrc) {
    if (imageSrc.startsWith("/api/proxy-image")) {
      try {
        const parsed = new URL(imageSrc, "http://localhost");
        if (!parsed.searchParams.has("shortcode") && resolvedShortcode) {
          parsed.searchParams.set("shortcode", resolvedShortcode);
        }
        if (!parsed.searchParams.has("creator") && cleanUsername) {
          parsed.searchParams.set("creator", cleanUsername);
        }
        imageSrc = `${parsed.pathname}${parsed.search}`;
      } catch {
        // Keep as is
      }
    } else if (imageSrc.startsWith("http")) {
      imageSrc = `/api/proxy-image?url=${encodeURIComponent(imageSrc)}${
        resolvedShortcode ? `&shortcode=${encodeURIComponent(resolvedShortcode)}` : ""
      }${cleanUsername ? `&creator=${encodeURIComponent(cleanUsername)}` : ""}`;
    }
  } else {
    imageSrc =
      reel.creatorAvatar ||
      (cleanUsername
        ? `/api/proxy-image?username=${encodeURIComponent(cleanUsername)}`
        : resolvedShortcode
        ? `/api/proxy-image?shortcode=${resolvedShortcode}`
        : "");
  }

  const creatorDisplay = hasValidCreator
    ? `@${cleanUsername}`
    : reel.creatorFullName &&
      !reel.creatorFullName.includes("Instagram Creator") &&
      !reel.creatorFullName.startsWith("Ig_")
    ? reel.creatorFullName
    : "Instagram Post";
  const creatorName = creatorDisplay;

  const displayCaption = reel.caption?.trim()
    ? reel.caption.replace(/<[^>]*>?/gm, "").slice(0, 80)
    : "";

  const formattedDate = reel.createdAt
    ? new Date(reel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  const displayCategories =
    reel.aiKeywords && reel.aiKeywords.length > 0
      ? reel.aiKeywords
      : reel.category && reel.category !== "General"
      ? [reel.category]
      : [];

  const availableCategories = Array.from(
    new Set([
      ...smartCategories.map((c) => c.name).filter(Boolean),
      "General",
      "Tech",
      "Humor",
      "Motivation",
      "Recipes",
      "Fitness",
      "Design",
      "Travel",
      "Business",
      "Lifestyle",
      "Music & Audio",
    ])
  );

  /* ───────── Compact List View (unchanged) ───────── */
  if (viewMode === "compact") {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="group relative flex items-center justify-between p-3 bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.07] hover:border-borderDefault-light dark:hover:border-white/[0.16] rounded-rd-md transition-all cursor-pointer shadow-rd-card"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-12 h-16 rounded-md overflow-hidden bg-surfaceSecondary-light dark:bg-black shrink-0 border border-borderSubtle-light dark:border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={displayCaption || "Saved reel"}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs text-primaryText-light dark:text-white truncate">
                  {creatorName}
                </span>
                <span className="text-[10px] text-mutedText-light dark:text-zinc-500">
                  {formattedDate}
                </span>
              </div>
              <p className="text-xs text-secondaryText-light dark:text-zinc-400 truncate max-w-md mt-0.5">
                {displayCaption || `Saved ${mediaType}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 text-secondaryText-light dark:text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteReel(reel.id); }}
              className="p-1.5 text-secondaryText-light dark:text-zinc-500 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isPlayerOpen && (
          <ReelPlayerModal isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} reel={reel} />
        )}
      </>
    );
  }

  /* ───────── Social Feed View (Facebook / Instagram Feed format) ───────── */
  if (viewMode === "feed") {
    return (
      <>
        <div className="w-full max-w-xl mx-auto bg-surface-light dark:bg-[#0e1016] border border-borderSubtle-light dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-md transition-all">
          {/* 1. Header: Creator info + options */}
          <div className="p-3.5 px-4 flex items-center justify-between border-b border-borderSubtle-light dark:border-white/[0.06]">
            {hasValidCreator ? (
              <Link
                href={`/creator/${cleanUsername}`}
                className="flex items-center space-x-3 min-w-0 group/creator"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reel.creatorAvatar || `/api/proxy-image?username=${encodeURIComponent(cleanUsername)}`}
                    alt={cleanUsername}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-primaryText-light dark:text-white group-hover/creator:text-brand-500 truncate transition-colors">
                      @{cleanUsername}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-surfaceSecondary-light dark:bg-white/[0.06] text-secondaryText-light dark:text-zinc-400">
                      {mediaType}
                    </span>
                  </div>
                  <p className="text-[10px] text-secondaryText-light dark:text-zinc-400">
                    {formattedDate || "Saved reel"}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0 flex items-center justify-center text-zinc-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-primaryText-light dark:text-white truncate">
                      {creatorDisplay}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-surfaceSecondary-light dark:bg-white/[0.06] text-secondaryText-light dark:text-zinc-400">
                      {mediaType}
                    </span>
                  </div>
                  <p className="text-[10px] text-secondaryText-light dark:text-zinc-400">
                    {formattedDate || "Saved post"}
                  </p>
                </div>
              </div>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1.5 rounded-full hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.08] text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-8 right-0 z-30 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-1 text-xs text-zinc-200 space-y-0.5"
                  >
                    <button
                      onClick={() => {
                        setIsPlayerOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
                    >
                      <Film className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Watch in Reels Mode</span>
                    </button>
                    <button
                      onClick={handleFavoriteClick}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
                    >
                      <Heart className={`w-3.5 h-3.5 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-500"}`} />
                      <span>{reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copy Instagram Link</span>
                    </button>
                    <a
                      href={reel.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Open on Instagram</span>
                    </a>
                    <div className="my-0.5 border-t border-white/[0.08]" />
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteReel(reel.id); setIsMenuOpen(false); }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-rose-500/15 text-rose-400 transition-colors text-left cursor-pointer font-medium text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove from Library</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 2. Media Player: Full-width media */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[9/16] max-h-[580px] bg-black overflow-hidden flex items-center justify-center">
            <ReelPlayer reel={reel} autoPlay={false} className="w-full h-full" />
          </div>

          {/* 3. Action Bar */}
          <div className="p-3 px-4 flex items-center justify-between border-t border-borderSubtle-light dark:border-white/[0.06]">
            <div className="flex items-center space-x-4">
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={handleFavoriteClick}
                className="flex items-center space-x-1.5 text-xs font-semibold text-primaryText-light dark:text-white hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                {reel.likes && <span className="text-xs">{reel.likes}</span>}
              </motion.button>

              <button
                onClick={() => setIsPlayerOpen(true)}
                className="flex items-center space-x-1.5 text-xs font-medium text-secondaryText-light dark:text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Watch full-screen Reel"
              >
                <Film className="w-4 h-4" />
                <span className="text-[11px]">Reels View</span>
              </button>

              <button
                onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                className="text-secondaryText-light dark:text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Assign Category"
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-full hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.08] text-secondaryText-light dark:text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={reel.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-full hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.08] text-secondaryText-light dark:text-zinc-400 hover:text-white transition-colors"
                title="Open on Instagram"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Category Picker in Feed View */}
          {isCategoryPickerOpen && (
            <div className="p-3 border-t border-borderSubtle-light dark:border-white/[0.06] bg-surfaceSecondary-light/50 dark:bg-black/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primaryText-light dark:text-white">Assign Category:</span>
                <button
                  onClick={() => setIsCategoryPickerOpen(false)}
                  className="text-secondaryText-light dark:text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                >
                  Done
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      updateCategory(reel.id, cat);
                      setIsCategoryPickerOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      reel.category?.toLowerCase() === cat.toLowerCase()
                        ? "bg-brand-500 text-white"
                        : "bg-surfaceSecondary-light dark:bg-white/[0.08] text-secondaryText-light dark:text-zinc-300 hover:bg-brand-500/20"
                    }`}
                  >
                    #{cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Caption, Tags & Notes */}
          <div className="px-4 pb-4 space-y-2 text-xs">
            {displayCaption && (
              <p className="text-xs text-primaryText-light dark:text-zinc-200 leading-relaxed">
                <span className="font-bold mr-1.5 text-primaryText-light dark:text-white">@{cleanUsername}</span>
                {displayCaption}
              </p>
            )}

            {reel.notes && (
              <div className="p-2.5 rounded-xl bg-surfaceSecondary-light dark:bg-white/[0.04] border border-borderSubtle-light dark:border-white/[0.06] text-xs">
                <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider block mb-0.5">Note</span>
                <p className="text-xs text-secondaryText-light dark:text-zinc-300">{reel.notes}</p>
              </div>
            )}

            {displayCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {displayCategories.map((cat) => (
                  <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-medium">
                    #{cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {isPlayerOpen && (
          <ReelPlayerModal isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} reel={reel} />
        )}
      </>
    );
  }

  /* ───────── Instagram-Style Grid Tile ───────── */
  return (
    <>
      <div
        onClick={handleCardClick}
        onTouchStart={startHold}
        onTouchMove={handleTouchMove}
        onTouchEnd={endHold}
        onTouchCancel={endHold}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="group relative aspect-[9/16] w-full overflow-hidden bg-black cursor-pointer select-none active:scale-[0.98] transition-transform"
      >
        {/* Full-bleed thumbnail or crisp centered audio/avatar tile */}
        {mediaType === "audio" || (imageSrc && imageSrc.includes("username=")) || imageError ? (
          <div className="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-b from-zinc-900 via-[#10131a] to-[#08090d] relative overflow-hidden select-none">
            {/* Ambient blurred glow */}
            {imageSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125 pointer-events-none"
              />
            )}

            {/* Top Bar: Archived tag + Category Badge */}
            <div className="relative z-10 w-full flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                {mediaType === "audio" ? "Audio Track" : "Archived Post"}
              </span>
              {reel.category && reel.category !== "General" && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 truncate max-w-[105px]">
                  {reel.category}
                </span>
              )}
            </div>

            {/* Center: Crisp 1:1 circular avatar badge */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/15 shadow-xl bg-zinc-800 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc || reel.creatorAvatar || `/api/proxy-image?username=${encodeURIComponent(cleanUsername || "creator")}`}
                  alt={creatorName}
                  draggable={false}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-white/90 text-center truncate max-w-[90%] drop-shadow-sm font-mono">
                {creatorName}
              </p>
            </div>

            {/* Bottom: Preserved caption / what was happening in it */}
            <div className="relative z-10 w-full pt-2 border-t border-white/[0.08]">
              <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                {displayCaption || reel.aiSummary || (reel.audioTitle ? `🎵 ${reel.audioTitle}` : "Saved Instagram Reel")}
              </p>
            </div>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageSrc}
            alt={displayCaption || "Saved reel"}
            referrerPolicy="no-referrer"
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.015] pointer-events-none"
          />
        )}

        {/* ─── Hover overlay gradient (bottom) ─── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none" />

        {/* ─── Default state: subtle play indicator (bottom-left) ─── */}
        {!isCarouselPost && mediaType === "reel" && (
          <div className="absolute bottom-2 left-2 z-10 opacity-60 group-hover:opacity-0 transition-opacity duration-150 pointer-events-none">
            <Play className="w-3.5 h-3.5 fill-white text-white drop-shadow-sm" />
          </div>
        )}

        {/* ─── Default state: carousel indicator (top-left) ─── */}
        {isCarouselPost && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white/90">
              <Images className="w-3 h-3" />
              {carouselCount ? <span className="tabular-nums">{carouselCount}</span> : null}
            </span>
          </div>
        )}

        {/* ─── Default state: audio indicator (top-left) ─── */}
        {mediaType === "audio" && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white/90">
              <Music2 className="w-3 h-3" />
            </span>
          </div>
        )}

        {/* ─── Hover state: center disk ─── */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-200">
            {mediaType === "audio" ? (
              <Music2 className="w-5 h-5 text-white" />
            ) : isCarouselPost ? (
              <Images className="w-5 h-5 text-white" />
            ) : mediaType === "post" ? (
              <ImageIcon className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* ─── TOP-RIGHT CONTROL: Three-dot overflow menu (30-32px) ─── */}
        <div className="absolute top-2 right-2 z-20 pointer-events-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`w-[30px] h-[30px] rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/80 transition-all duration-200 cursor-pointer active:scale-90 ${
              isTouched || isMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-90 pointer-events-none sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:pointer-events-auto"
            }`}
            title="Options"
            aria-label="Reel options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ─── BOTTOM-RIGHT CONTROL: Favorite heart button (30-32px) ─── */}
        <div className="absolute bottom-2 right-2 z-20 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 1.3 }}
            onClick={handleFavoriteClick}
            className={`w-[30px] h-[30px] rounded-full backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer ${
              reel.isFavorite
                ? "bg-black/60 text-rose-500 opacity-100"
                : "bg-black/50 text-white/80 hover:text-rose-400 hover:bg-black/70 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            }`}
            title={reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            aria-label={reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                reel.isFavorite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </motion.button>
        </div>

        {/* ─── Hover state: bottom-left metadata (padded right so it never overlaps the heart) ─── */}
        <div className="absolute bottom-0 left-0 right-10 z-10 p-2.5 pb-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-[13px] font-semibold text-white leading-tight truncate drop-shadow-sm">
            {creatorName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {displayCategories.length > 0 && (
              <span className="text-[11px] text-white/70 truncate">
                {displayCategories.slice(0, 2).join(" · ")}
              </span>
            )}
            {displayCategories.length > 0 && formattedDate && (
              <span className="text-[11px] text-white/40">·</span>
            )}
            {formattedDate && (
              <span className="text-[11px] text-white/50 shrink-0">{formattedDate}</span>
            )}
          </div>
        </div>

        {/* ─── Desktop context menu dropdown (hidden on mobile) ─── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:block absolute top-12 right-1.5 z-30 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-1 text-xs text-zinc-200 space-y-0.5"
            >
              <Link
                href={`/reel/${reel.id}`}
                className="flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>Open Reel</span>
              </Link>
              <button
                onClick={handleFavoriteClick}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
              >
                <Heart className={`w-3.5 h-3.5 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-500"}`} />
                <span>{reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsCategoryPickerOpen(!isCategoryPickerOpen); }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
              >
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span>Assign Category</span>
              </button>

              {isCategoryPickerOpen && (
                <div className="my-0.5 pl-3 border-l border-white/10 space-y-0.5 max-h-36 overflow-y-auto">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCategory(reel.id, cat);
                        setIsMenuOpen(false);
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-[11px] transition-colors truncate flex items-center space-x-1.5 cursor-pointer rounded ${
                        reel.category?.toLowerCase() === cat.toLowerCase()
                          ? "text-brand-400 font-semibold bg-brand-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Tag className="w-3 h-3 shrink-0 text-zinc-500" />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Instagram Link</span>
              </button>
              <a
                href={reel.instagramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                <span>Open on Instagram</span>
              </a>

              <div className="my-0.5 border-t border-white/[0.08]" />

              <button
                onClick={(e) => { e.stopPropagation(); deleteReel(reel.id); setIsMenuOpen(false); }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-rose-500/15 text-rose-400 transition-colors text-left cursor-pointer font-medium text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Library</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Mobile Action Sheet Drawer (sm:hidden) ─── */}
      {isMenuOpen && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <div
            className="sm:hidden fixed inset-0 z-[250] flex flex-col justify-end"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              setIsCategoryPickerOpen(false);
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full bg-zinc-900 border-t border-white/10 rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom,1rem))] z-10 shadow-2xl space-y-3"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto" />

              {/* Reel Header Info */}
              <div className="flex items-center space-x-3 pb-3 border-b border-white/[0.08]">
                <div className="w-10 h-14 rounded-md overflow-hidden bg-black shrink-0 border border-white/10">
                  <img
                    src={imageSrc}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {creatorDisplay}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {displayCaption || `Instagram ${mediaType}`}
                  </p>
                  <span className="inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 mt-1">
                    {mediaType}
                  </span>
                </div>
              </div>

              {/* Action Buttons List */}
              <div className="space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayerOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] text-zinc-200 text-sm cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4 text-brand-400 shrink-0" />
                  <span className="font-medium">Open Reel / Player</span>
                </button>

                <button
                  onClick={(e) => {
                    handleFavoriteClick(e);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] text-zinc-200 text-sm cursor-pointer transition-colors"
                >
                  <Heart className={`w-4 h-4 shrink-0 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
                  <span className="font-medium">{reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryPickerOpen(!isCategoryPickerOpen);
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] text-zinc-200 text-sm cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Tag className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="font-medium">Assign Category</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isCategoryPickerOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoryPickerOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 max-h-40 overflow-y-auto">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCategory(reel.id, cat);
                          setIsMenuOpen(false);
                          setIsCategoryPickerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          reel.category?.toLowerCase() === cat.toLowerCase()
                            ? "bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30"
                            : "bg-white/[0.04] active:bg-white/[0.08] text-zinc-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Tag className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate">{cat}</span>
                        </div>
                        {reel.category?.toLowerCase() === cat.toLowerCase() && (
                          <span className="text-[10px] text-brand-400 font-medium">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    handleCopyLink(e);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] text-zinc-200 text-sm cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-medium">Copy Instagram Link</span>
                </button>

                <a
                  href={reel.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] text-zinc-200 text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="font-medium">Open on Instagram</span>
                </a>

                <div className="pt-1 border-t border-white/[0.08]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReel(reel.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl bg-rose-500/10 active:bg-rose-500/20 text-rose-400 text-sm cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">Remove from Library</span>
                  </button>
                </div>
              </div>

              {/* Close / Cancel Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs active:bg-zinc-700 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Hold and Play (Peek Preview) */}
      {isPeeking && typeof document !== "undefined" && createPortal(
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-none animate-in fade-in duration-150 select-none"
        >
          <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <ReelPlayer reel={reel} autoPlay={true} className="w-full h-full rounded-2xl" />
            
            {/* Top Overlay Creator Badge */}
            {cleanUsername && (
              <div className="absolute top-3 left-3 z-30 pointer-events-none drop-shadow-md">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold">
                  <span>@{cleanUsername}</span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ReelPlayer Modal */}
      {isPlayerOpen && (
        <ReelPlayerModal isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} reel={reel} />
      )}
    </>
  );
}
