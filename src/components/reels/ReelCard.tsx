"use client";

import React, { useState, useRef } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

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
    if (!isMenuOpen) {
      setIsPlayerOpen(true);
    }
  };

  const mediaType = reel.mediaType || "reel";
  const isMultiCarousel =
    mediaType === "post" && reel.carouselImages && reel.carouselImages.length > 1;
  const carouselCount = isMultiCarousel ? reel.carouselImages?.length : null;

  const imageSrc =
    !imageError && reel.thumbnailUrl
      ? reel.thumbnailUrl
      : reel.creatorAvatar ||
        `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`;

  const creatorName = reel.creatorUsername
    ? `@${reel.creatorUsername.replace(/^@/, "")}`
    : "Creator";

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

  /* ───────── Instagram-Style Grid Tile ───────── */
  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative aspect-[9/16] w-full overflow-hidden bg-black cursor-pointer select-none"
      >
        {/* Full-bleed thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={displayCaption || "Saved reel"}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.015]"
        />

        {/* ─── Hover overlay gradient (bottom) ─── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none" />

        {/* ─── Default state: subtle play indicator (bottom-left) ─── */}
        {(mediaType === "reel" || (!mediaType && !isMultiCarousel)) && (
          <div className="absolute bottom-2 left-2 z-10 opacity-60 group-hover:opacity-0 transition-opacity duration-150 pointer-events-none">
            <Play className="w-3.5 h-3.5 fill-white text-white drop-shadow-sm" />
          </div>
        )}

        {/* ─── Default state: carousel indicator (top-left) ─── */}
        {isMultiCarousel && carouselCount && carouselCount > 1 && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white/90">
              <Images className="w-3 h-3" />
              <span className="tabular-nums">{carouselCount}</span>
            </span>
          </div>
        )}

        {/* ─── Default state: audio indicator ─── */}
        {mediaType === "audio" && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-white/90">
              <Music2 className="w-3 h-3" />
            </span>
          </div>
        )}

        {/* ─── Default state: favorited heart (top-right, only if favorited) ─── */}
        {reel.isFavorite && (
          <div className="absolute top-2 right-2 z-10 group-hover:opacity-0 transition-opacity duration-150 pointer-events-none">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 drop-shadow-sm" />
          </div>
        )}

        {/* ─── Hover state: center play disk ─── */}
        <div className="absolute inset-0 hidden sm:flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-200">
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

        {/* ─── Hover state: top-right controls (fav + menu) — desktop only ─── */}
        <div className="absolute top-1.5 right-1.5 z-20 hidden sm:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 1.3 }}
            onClick={handleFavoriteClick}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-rose-400 transition-colors cursor-pointer"
            title={reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-all duration-150 ${
                reel.isFavorite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </motion.button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ─── Mobile: always-visible controls (top-right) ─── */}
        <div className="absolute top-1.5 right-1.5 z-20 flex flex-col gap-1 sm:hidden pointer-events-auto">
          <motion.button
            whileTap={{ scale: 1.3 }}
            onClick={handleFavoriteClick}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 ${reel.isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </motion.button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/80 cursor-pointer"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ─── Hover state: bottom metadata ─── */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-[13px] font-semibold text-white leading-tight truncate drop-shadow-sm">
            {creatorName}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {displayCategories.length > 0 && (
              <span className="text-[11px] text-white/70 truncate">
                {displayCategories.slice(0, 2).join(" \u00b7 ")}
              </span>
            )}
            {displayCategories.length > 0 && formattedDate && (
              <span className="text-[11px] text-white/40">\u00b7</span>
            )}
            {formattedDate && (
              <span className="text-[11px] text-white/50 shrink-0">{formattedDate}</span>
            )}
          </div>
        </div>

        {/* ─── Context menu dropdown ─── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-12 right-1.5 z-30 w-48 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-1 text-xs text-zinc-200 space-y-0.5"
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
                onClick={(e) => { e.stopPropagation(); setIsCollectionPickerOpen(!isCollectionPickerOpen); }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors text-left cursor-pointer text-xs"
              >
                <FolderPlus className="w-3.5 h-3.5 text-zinc-500" />
                <span>Move to Collection</span>
              </button>

              {isCollectionPickerOpen && (
                <div className="my-0.5 pl-3 border-l border-white/10 space-y-0.5">
                  {collections.length > 0 ? (
                    collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={(e) => { e.stopPropagation(); addReelToCollection(reel.id, col.id); setIsMenuOpen(false); }}
                        className="w-full text-left px-2 py-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors truncate flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Folder className="w-3 h-3 shrink-0 text-zinc-500" />
                        <span>{col.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] text-zinc-600 px-2 py-1">No collections yet</p>
                  )}
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

      {/* ReelPlayer Modal */}
      {isPlayerOpen && (
        <ReelPlayerModal isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} reel={reel} />
      )}
    </>
  );
}
