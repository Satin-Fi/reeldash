"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { Heart, Play, MoreVertical, ExternalLink, Trash2, FolderPlus, Copy, FileText, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReelCardProps {
  reel: Reel;
  viewMode?: "grid" | "compact";
}

export function ReelCard({ reel, viewMode = "grid" }: ReelCardProps) {
  const { toggleFavorite, deleteReel, collections, addReelToCollection, showToast } = useReels();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Shortcode extraction
  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : null;

  // Instagram Official Embed Source for REAL Reel Thumbnail & Video
  const embedSrc = reel.embedUrl || (shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null);

  let displayCreator = reel.creatorUsername;
  if (!displayCreator || displayCreator === "instagram_creator") {
    const userMatch = reel.instagramUrl.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|p)\//);
    if (userMatch && userMatch[1] && userMatch[1] !== "reel" && userMatch[1] !== "p") {
      displayCreator = userMatch[1];
    } else if (shortcode) {
      displayCreator = `reels_${shortcode.substring(0, 6)}`;
    } else {
      displayCreator = "instagram_reel";
    }
  }

  let displayCaption = reel.caption;
  if (!displayCaption || displayCaption.startsWith("Instagram Reel (")) {
    displayCaption = shortcode ? `Instagram Reel (${shortcode})` : "Saved Instagram Reel";
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Link copied to clipboard");
    setIsMenuOpen(false);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(reel.id);
  };

  if (viewMode === "compact") {
    return (
      <div className="group relative flex items-center justify-between p-3.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md hover:border-brand-500/30 transition-all duration-200 shadow-rd-subtle">
        <div className="flex items-center space-x-3 min-w-0">
          <Link href={`/reel/${reel.id}`} className="relative w-12 h-16 rounded-rd-sm overflow-hidden shrink-0 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark flex items-center justify-center">
            {embedSrc ? (
              <iframe
                src={embedSrc}
                title={displayCaption}
                className="w-full h-full border-0 pointer-events-none scale-125"
                allowTransparency
              />
            ) : (
              <Instagram className="w-5 h-5 text-brand-500" />
            )}
          </Link>
          <div className="min-w-0">
            <Link href={`/reel/${reel.id}`} className="hover:underline">
              <p className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
                @{displayCreator}
              </p>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark truncate max-w-md mt-0.5">
                {displayCaption}
              </p>
            </Link>
            <div className="flex items-center space-x-2 mt-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark font-medium text-secondaryText-light dark:text-secondaryText-dark">
                {reel.category}
              </span>
              <span className="text-mutedText-light dark:text-mutedText-dark">{reel.duration}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-3">
          <button
            onClick={handleFavoriteClick}
            className="p-1.5 text-secondaryText-light dark:text-secondaryText-dark hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                reel.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""
              }`}
            />
          </button>
          <button
            onClick={() => deleteReel(reel.id)}
            className="p-1.5 text-mutedText-light dark:text-mutedText-dark hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-card overflow-hidden shadow-rd-subtle hover:-translate-y-0.5 transition-all duration-200">
      {/* 9:16 REAL Instagram Reel Video & Thumbnail Container */}
      <div className="relative aspect-reel w-full overflow-hidden bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark">
        {embedSrc ? (
          /* REAL Instagram Live Embed displaying the exact cover image & video */
          <iframe
            src={embedSrc}
            title={displayCaption}
            className="w-full h-full border-0 pointer-events-none"
            allowTransparency
            allow="encrypted-media"
          />
        ) : reel.thumbnailUrl && !reel.thumbnailUrl.includes("unsplash.com") && !imageError ? (
          <Image
            src={reel.thumbnailUrl}
            alt={displayCaption}
            fill
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover group-hover:scale-102 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark flex flex-col items-center justify-center p-4 text-center space-y-2">
            <Instagram className="w-8 h-8 text-brand-500" />
            <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">@{displayCreator}</span>
          </div>
        )}

        {/* Clickable Overlay Link to Detail Page */}
        <Link href={`/reel/${reel.id}`} className="absolute inset-0 z-10" />

        {/* Favorite Toggle Button */}
        <motion.button
          whileTap={{ scale: 1.25 }}
          onClick={handleFavoriteClick}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-rose-400 transition-colors cursor-pointer z-20"
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              reel.isFavorite ? "fill-rose-500 text-rose-500 scale-110" : ""
            }`}
          />
        </motion.button>

        {/* Duration Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-rd-sm bg-black/60 backdrop-blur-md text-white text-[11px] font-medium z-20">
          <Play className="w-3 h-3 fill-white" />
          <span>{reel.duration}</span>
        </div>

        {/* More Options Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:text-white transition-colors cursor-pointer z-20 opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Hover Quick Action Bar */}
        <div className="absolute bottom-10 inset-x-2 flex items-center justify-center space-x-2 p-1.5 rounded-rd-md bg-black/75 backdrop-blur-md text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <Link
            href={`/reel/${reel.id}`}
            className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 font-medium transition-colors"
          >
            Open
          </Link>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 font-medium transition-colors cursor-pointer"
          >
            Copy
          </button>
        </div>

        {/* Context Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute top-10 left-2.5 z-30 w-48 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-modal p-1 text-xs text-primaryText-light dark:text-primaryText-dark"
            >
              <Link
                href={`/reel/${reel.id}`}
                className="flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                <span>Open Detail Page</span>
              </Link>
              <a
                href={reel.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                <span>Open Original</span>
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollectionPickerOpen(!isCollectionPickerOpen);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors text-left"
              >
                <span className="flex items-center space-x-2">
                  <FolderPlus className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                  <span>Add to Collection</span>
                </span>
              </button>

              {isCollectionPickerOpen && (
                <div className="my-1 pl-4 border-l border-borderSubtle-light dark:border-borderSubtle-dark space-y-1">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        addReelToCollection(reel.id, col.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 text-[11px] hover:text-brand-500 transition-colors truncate"
                    >
                      {col.icon} {col.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5 text-secondaryText-light dark:text-secondaryText-dark" />
                <span>Copy Instagram Link</span>
              </button>

              <div className="my-1 border-t border-borderSubtle-light dark:border-borderSubtle-dark" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteReel(reel.id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-rd-sm hover:bg-rose-500/10 text-rose-500 transition-colors text-left font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Reel</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Info Section */}
      <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <Link href={`/reel/${reel.id}`} className="group-hover:text-brand-500 transition-colors">
            <p className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate">
              @{displayCreator}
            </p>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark line-clamp-2 mt-0.5 leading-normal">
              {displayCaption}
            </p>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-borderSubtle-light/50 dark:border-borderSubtle-dark/50 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark font-medium text-secondaryText-light dark:text-secondaryText-dark">
            {reel.category}
          </span>
          <span className="text-mutedText-light dark:text-mutedText-dark font-mono text-[10px]">
            {new Date(reel.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}
