"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Reel, ViewMode } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { ReelPlayerModal } from "@/components/reels/ReelPlayerModal";
import {
  Heart,
  MoreVertical,
  ExternalLink,
  Trash2,
  Copy,
  Images,
  Music2,
  FolderPlus,
  Play,
  FileText,
  Image as ImageIcon,
  Folder,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReelCardProps {
  reel: Reel;
  viewMode?: ViewMode;
}

export function ReelCard({ reel, viewMode = "grid" }: ReelCardProps) {
  const { toggleFavorite, deleteReel, collections, addReelToCollection, showToast } = useReels();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

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
    setIsPlayerOpen(true);
  };

  const mediaType = reel.mediaType || "reel";
  const isMultiCarousel =
    mediaType === "post" && reel.carouselImages && reel.carouselImages.length > 1;
  const carouselCount = isMultiCarousel ? reel.carouselImages?.length : null;

  // Clean, fallback image source
  const imageSrc =
    !imageError && reel.thumbnailUrl
      ? reel.thumbnailUrl
      : reel.creatorAvatar ||
        `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`;

  const creatorName = reel.creatorUsername
    ? `@${reel.creatorUsername.replace(/^@/, "")}`
    : "Creator";

  const displayCaption = reel.caption?.trim()
    ? reel.caption.replace(/<[^>]*>?/gm, "").slice(0, 160)
    : `Saved ${mediaType === "audio" ? "Audio Track" : mediaType === "post" ? "Post" : "Reel"}`;

  const formattedDate = reel.createdAt
    ? new Date(reel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Recently";

  // Category tags
  const displayCategories = reel.aiKeywords && reel.aiKeywords.length > 0
    ? reel.aiKeywords
    : reel.category && reel.category !== "General"
    ? [reel.category]
    : [];

  return (
    <>
      {viewMode === "compact" ? (
        /* Compact List View */
        <div
          onClick={handleCardClick}
          className="group relative flex items-center justify-between p-3 bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.07] hover:border-borderDefault-light dark:hover:border-white/[0.16] rounded-rd-md transition-all cursor-pointer shadow-rd-card"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-12 h-16 rounded-md overflow-hidden bg-surfaceSecondary-light dark:bg-black shrink-0 border border-borderSubtle-light dark:border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={displayCaption}
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
                {displayCaption}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 text-secondaryText-light dark:text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteReel(reel.id);
              }}
              className="p-1.5 text-secondaryText-light dark:text-zinc-500 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Standard 9:16 Grid Card View */
        <div
          onClick={handleCardClick}
          className="reel-card group relative flex flex-col bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.07] hover:border-brand-500/20 dark:hover:border-brand-500/25 rounded-[10px] sm:rounded-[12px] overflow-hidden shadow-rd-card hover:-translate-y-0.5 transition-all duration-300 ease-premium cursor-pointer select-none active:scale-[0.98]"
        >
          {/* 9:16 Clean Image Thumbnail Container */}
          <div className="relative aspect-reel w-full overflow-hidden bg-surfaceSecondary-light dark:bg-[#0D0F12]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={displayCaption}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-premium"
            />
            {/* Subtle Clean Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25 opacity-50 group-hover:opacity-75 transition-opacity" />

            {/* ─── 1. TOP HEADER (Systematic & Balanced) ───────────────────────── */}
            <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 right-1.5 sm:right-2.5 flex items-center justify-between z-20 pointer-events-none">
              {/* Left Context Pill (Only for Multi-Image Carousel > 1 or Audio) */}
              <div>
                {isMultiCarousel && carouselCount && carouselCount > 1 ? (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] sm:text-[11px] font-semibold text-white shadow-sm border border-white/10">
                    <Images className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90" />
                    <span className="tabular-nums">{carouselCount}</span>
                  </span>
                ) : mediaType === "audio" ? (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] sm:text-[11px] font-semibold text-white shadow-sm border border-white/10">
                    <Music2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/90" />
                  </span>
                ) : null}
              </div>

              {/* Right Action: More Options Trigger */}
              <div className="pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Options"
                >
                  <MoreVertical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>

            {/* ─── 2. CENTER ACTION DISK (Desktop Hover Action) ──────── */}
            <div className="hidden sm:flex absolute inset-0 items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-200">
                {mediaType === "audio" ? (
                  <Music2 className="w-5 h-5 text-white" />
                ) : isMultiCarousel ? (
                  <Images className="w-5 h-5 text-white" />
                ) : mediaType === "post" ? (
                  <ImageIcon className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                )}
              </div>
            </div>

            {/* ─── 3. BOTTOM CORNER CONTROLS (Heart Like) ──────── */}
            <div className="absolute bottom-1.5 sm:bottom-2.5 right-1.5 sm:right-2.5 z-20 flex items-center gap-1.5 pointer-events-auto">
              <motion.button
                whileTap={{ scale: 1.25 }}
                onClick={handleFavoriteClick}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-rose-400 transition-colors cursor-pointer shadow-sm"
                title={reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-150 ${
                    reel.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""
                  }`}
                />
              </motion.button>
            </div>

            {/* Context Menu Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-9 sm:top-11 right-1.5 sm:right-2.5 z-30 w-44 sm:w-48 bg-surface-light dark:bg-[#161920] border border-borderSubtle-light dark:border-white/[0.08] rounded-[10px] shadow-2xl p-1 text-xs text-primaryText-light dark:text-[#E7E8EC] space-y-0.5"
                >
                  <Link
                    href={`/reel/${reel.id}`}
                    className="flex items-center space-x-2 px-2.5 py-1.5 sm:py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors text-[11px] sm:text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                    <span>Open Detail Page</span>
                  </Link>
                  <a
                    href={reel.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 px-2.5 py-1.5 sm:py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors text-[11px] sm:text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                    <span>Open on Instagram</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollectionPickerOpen(!isCollectionPickerOpen);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors text-left cursor-pointer text-[11px] sm:text-xs"
                  >
                    <span className="flex items-center space-x-2">
                      <FolderPlus className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                      <span>Add to Collection</span>
                    </span>
                  </button>

                  {isCollectionPickerOpen && (
                    <div className="my-1 pl-3 border-l border-borderSubtle-light dark:border-white/[0.08] space-y-0.5">
                      {collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            addReelToCollection(reel.id, col.id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1 text-[11px] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors truncate flex items-center space-x-1.5"
                        >
                          <Folder className="w-3 h-3 shrink-0 text-secondaryText-light dark:text-zinc-400" />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 sm:py-2 rounded-[6px] hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.06] text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-colors text-left cursor-pointer text-[11px] sm:text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-secondaryText-light dark:text-[#777C89]" />
                    <span>Copy Link</span>
                  </button>

                  <div className="my-1 border-t border-borderSubtle-light dark:border-white/[0.06]" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReel(reel.id);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 sm:py-2 rounded-[6px] hover:bg-rose-500/10 text-rose-500 transition-colors text-left cursor-pointer font-medium text-[11px] sm:text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Library</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Metadata Info Area */}
          <div className="p-2 sm:p-3 flex flex-col justify-between flex-1 bg-surface-light dark:bg-[#111419] border-t border-borderSubtle-light dark:border-white/[0.05]">
            <div>
              <div className="flex items-center justify-between text-xs mb-0.5 sm:mb-1">
                <span className="font-semibold text-[11px] sm:text-xs text-primaryText-light dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-[70%]">
                  {creatorName}
                </span>
                <span className="text-[10px] sm:text-[11px] text-mutedText-light dark:text-[#747987] shrink-0 font-normal">
                  {formattedDate}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-secondaryText-light dark:text-[#9AA0AC] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed font-normal">
                {displayCaption}
              </p>
            </div>

            {displayCategories && displayCategories.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1 mt-2.5">
                {displayCategories.slice(0, 2).map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-[5px] bg-surfaceSecondary-light dark:bg-white/[0.04] text-secondaryText-light dark:text-[#A0A5B2] border border-borderSubtle-light dark:border-white/[0.05]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Featured ReelPlayer Modal View */}
      {isPlayerOpen && (
        <ReelPlayerModal
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          reel={reel}
        />
      )}
    </>
  );
}
