"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import {
  Heart,
  Play,
  MoreVertical,
  ExternalLink,
  Trash2,
  FolderPlus,
  Copy,
  FileText,
  MessageCircle,
  ThumbsUp,
  Music2,
  Images,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReelPlayerModal } from "./ReelPlayerModal";

interface ReelCardProps {
  reel: Reel;
  viewMode?: "grid" | "compact";
}

export function ReelCard({ reel, viewMode = "grid" }: ReelCardProps) {
  const { toggleFavorite, deleteReel, collections, addReelToCollection, showToast } = useReels();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const displayCaption = reel.caption || "Instagram Reel";
  const shortcode = reel.shortcode || (reel.instagramUrl ? reel.instagramUrl.split("/p/")[1]?.split("/")[0] || reel.instagramUrl.split("/reel/")[1]?.split("/")[0] : "");

  const mediaType = reel.mediaType || "reel";

  // Determine if it is TRULY a multi-item carousel (must have MORE than 1 image)
  const parsedCount = reel.carouselImages?.length || (typeof reel.duration === "string" ? parseInt(reel.duration.match(/\d+/)?.[0] || "0", 10) : 0);
  const isMultiCarousel = (reel.isCarousel && parsedCount > 1) || (reel.carouselImages && reel.carouselImages.length > 1) || (typeof reel.duration === "string" && reel.duration.toLowerCase().includes("carousel") && parsedCount > 1);
  const carouselCount = isMultiCarousel ? (reel.carouselImages?.length || parsedCount) : null;

  // Clean duration display (only if true video time, e.g. "0:30", "1:15", "12s")
  const isRealTimeDuration = reel.duration && 
    !reel.duration.toLowerCase().includes("carousel") && 
    !reel.duration.toLowerCase().includes("post") && 
    !reel.duration.toLowerCase().includes("photo");

  const creatorName = reel.creatorUsername || (reel as any).creator || "creator";
  const formattedDate = new Date(reel.createdAt || (reel as any).savedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const displayCategories = reel.subcategories?.length ? reel.subcategories : (reel.category ? [reel.category] : []);

  // Format thumbnail source with proxy fallback
  let imageSrc = reel.thumbnailUrl;
  if (imageError || !imageSrc || imageSrc.includes("placeholder")) {
    if (shortcode) {
      imageSrc = `/api/proxy-image?shortcode=${shortcode}`;
    } else {
      imageSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='700' viewBox='0 0 400 700'%3E%3Crect width='400' height='700' fill='%23111218'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236366f1' font-family='sans-serif' font-size='16'%3EInstagram Media%3C/text%3E%3C/svg%3E";
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMenuOpen || isCollectionPickerOpen) return;
    setIsPlayerOpen(true);
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

  return (
    <>
      {viewMode === "compact" ? (
        <div
          onClick={handleCardClick}
          className="group flex items-center justify-between p-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle hover:border-brand-500/40 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3.5 overflow-hidden">
            <div className="relative w-12 h-16 rounded-rd-sm overflow-hidden bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={displayCaption}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                {mediaType === "audio" ? (
                  <Music2 className="w-3.5 h-3.5 text-white" />
                ) : isMultiCarousel ? (
                  <Images className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                )}
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-primaryText-light dark:text-primaryText-dark truncate">
                {creatorName}
              </span>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark line-clamp-1">
                {displayCaption}
              </p>
              <div className="flex items-center space-x-2 mt-1 text-[10px] text-mutedText-light dark:text-mutedText-dark">
                {isRealTimeDuration && (
                  <span className="font-mono">{reel.duration}</span>
                )}
                {isMultiCarousel && carouselCount && (
                  <span className="text-brand-400">Carousel ({carouselCount})</span>
                )}
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={handleFavoriteClick}
              className="p-1.5 text-mutedText-light dark:text-mutedText-dark hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  reel.isFavorite ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
            </motion.button>
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-mutedText-light dark:text-mutedText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteReel(reel.id)}
              className="p-1.5 text-mutedText-light dark:text-mutedText-dark hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleCardClick}
          className="group relative flex flex-col bg-[#111419] border border-white/[0.07] hover:border-white/[0.16] rounded-[12px] overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none"
        >
          {/* 9:16 Clean Image Thumbnail Container */}
          <div className="relative aspect-reel w-full overflow-hidden bg-[#0D0F12]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={displayCaption}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
            />
            {/* Subtle Clean Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 opacity-60 group-hover:opacity-85 transition-opacity" />

            {/* ─── 1. TOP HEADER (Systematic & Balanced) ───────────────────────── */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
              {/* Left Context Pill (Only if Multi-Image Carousel > 1, Real Video Duration, or Audio) */}
              <div>
                {isMultiCarousel && carouselCount && carouselCount > 1 ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white shadow-sm border border-white/10">
                    <Images className="w-3 h-3 text-white/90" />
                    <span className="tabular-nums">{carouselCount}</span>
                  </span>
                ) : mediaType === "audio" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white shadow-sm border border-white/10">
                    <Music2 className="w-3 h-3 text-white/90" />
                  </span>
                ) : isRealTimeDuration ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-medium text-white shadow-sm border border-white/10">
                    <Play className="w-2.5 h-2.5 fill-white" />
                    <span>{reel.duration}</span>
                  </span>
                ) : null}
              </div>

              {/* Right Action Group (Horizontal Side-by-Side Pill Controls) */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Favorite Button */}
                <motion.button
                  whileTap={{ scale: 1.2 }}
                  onClick={handleFavoriteClick}
                  className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-rose-400 transition-colors cursor-pointer shadow-sm"
                  title={reel.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      reel.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""
                    }`}
                  />
                </motion.button>

                {/* More Options Trigger */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
                  title="Options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ─── 2. CENTER ACTION DISK (Contextual Hover Action) ──────── */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-200">
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

            {/* ─── 3. BOTTOM METRICS (Clean & Minimal) ────────────────────────── */}
            {reel.likes && (
              <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium shadow-sm">
                <ThumbsUp className="w-2.5 h-2.5 text-white/80" />
                <span>{reel.likes.replace(/likes/i, "").trim()}</span>
              </div>
            )}

            {/* Context Menu Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-11 right-2.5 z-30 w-48 bg-[#161920] border border-white/[0.08] rounded-[10px] shadow-2xl p-1 text-xs text-[#E7E8EC] space-y-0.5"
                >
                  <Link
                    href={`/reel/${reel.id}`}
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#777C89]" />
                    <span>Open Detail Page</span>
                  </Link>
                  <a
                    href={reel.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-2 px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#777C89]" />
                    <span>Open on Instagram</span>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollectionPickerOpen(!isCollectionPickerOpen);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <span className="flex items-center space-x-2">
                      <FolderPlus className="w-3.5 h-3.5 text-[#777C89]" />
                      <span>Add to Collection</span>
                    </span>
                  </button>

                  {isCollectionPickerOpen && (
                    <div className="my-1 pl-3 border-l border-white/[0.08] space-y-0.5">
                      {collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            addReelToCollection(reel.id, col.id);
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-2 py-1 text-[11px] text-[#AEB2BF] hover:text-white transition-colors truncate"
                        >
                          {col.icon} {col.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-[6px] hover:bg-white/[0.06] text-[#AEB2BF] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#777C89]" />
                    <span>Copy Link</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReel(reel.id);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-[6px] hover:bg-rose-500/10 text-rose-400 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Library</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Metadata Info Area */}
          <div className="p-3 flex flex-col justify-between flex-1 bg-[#111419]">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-white hover:text-brand-400 transition-colors truncate">
                  {creatorName}
                </span>
                <span className="text-[11px] text-[#747987] shrink-0 font-normal">
                  {formattedDate}
                </span>
              </div>
              <p className="text-xs text-[#9AA0AC] line-clamp-2 leading-relaxed font-normal">
                {displayCaption}
              </p>
            </div>

            {displayCategories && displayCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {displayCategories.slice(0, 2).map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-[5px] bg-white/[0.04] text-[#A0A5B2] border border-white/[0.05]"
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
