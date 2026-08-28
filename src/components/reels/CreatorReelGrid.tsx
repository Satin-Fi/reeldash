"use client";

import React, { useState } from "react";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import {
  Play,
  Heart,
  MessageCircle,
  Loader2,
  Bookmark,
  Check,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { ReelPlayerModal } from "./ReelPlayerModal";

export interface CreatorReelItem {
  id: string;
  shortcode: string;
  instagramUrl: string;
  thumbnailUrl: string;
  rawThumbnailUrl?: string;
  caption: string;
  isVideo: boolean;
  isCarousel?: boolean;
  carouselImages?: string[];
  mediaType?: "reel" | "post" | "audio" | "story";
  likes: string | null;
  commentsCount: string | null;
  duration?: string;
}

/** A single discovered reel tile with ReelDash Save + play chrome. */
function CreatorReelTile({ item, creatorUsername }: { item: CreatorReelItem; creatorUsername?: string }) {
  const { saveReel, reels, showToast } = useReels();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.thumbnailUrl);

  const cleanItemUrl = item.instagramUrl.replace(/\/$/, "");
  const alreadySaved = reels.some(
    (r) =>
      r.instagramUrl.replace(/\/$/, "") === cleanItemUrl ||
      (item.shortcode && r.shortcode === item.shortcode) ||
      (item.shortcode && r.instagramUrl.includes(item.shortcode))
  );

  const isVideo = item.isVideo || item.mediaType === "reel" || item.instagramUrl.includes("/reel/");
  const mediaType = item.mediaType || (isVideo ? "reel" : item.isCarousel ? "post" : "post");

  const toReel = (): Reel => ({
    id: item.id,
    userId: "preview",
    shortcode: item.shortcode,
    instagramUrl: item.instagramUrl,
    creatorUsername: creatorUsername || "instagram",
    creatorFullName: creatorUsername ? creatorUsername.charAt(0).toUpperCase() + creatorUsername.slice(1) : "",
    creatorProfileUrl: `https://instagram.com/${creatorUsername || ""}`,
    creatorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorUsername || "IG")}&background=6366F1&color=fff`,
    thumbnailUrl: imgSrc,
    mediaUrl: isVideo && item.shortcode ? `/api/video-stream?shortcode=${item.shortcode}` : "",
    mediaType,
    isCarousel: !isVideo && !!item.isCarousel,
    carouselImages: !isVideo && item.isCarousel && item.carouselImages && item.carouselImages.length > 0 ? item.carouselImages : undefined,
    caption: item.caption || `Instagram ${mediaType.toUpperCase()} by @${creatorUsername || "creator"}`,
    category: "General",
    subcategories: [],
    collections: [],
    hashtags: [],
    likes: item.likes || undefined,
    commentsCount: item.commentsCount || undefined,
    isFavorite: false,
    duration: item.duration || (isVideo ? "0:30" : "Post"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadySaved || saving) return;
    setSaving(true);
    try {
      await saveReel(item.instagramUrl, {
        creator: creatorUsername,
        caption: item.caption,
        mediaType,
      });
      showToast(item.isCarousel ? "Saved Carousel to Library" : "Saved to Library");
    } catch {
      showToast("Could not save Reel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative aspect-reel w-full overflow-hidden rounded-rd-card bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark shadow-rd-subtle hover:-translate-y-0.5 hover:border-brand-500/40 transition-all duration-200 cursor-pointer"
      >
        {/* Thumbnail Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.caption || "Instagram Media"}
          referrerPolicy="no-referrer"
          onError={() => {
            if (item.shortcode) {
              setImgSrc(`/api/proxy-image?shortcode=${item.shortcode}`);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Media Type Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {item.isCarousel ? (
            <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 text-[10px] font-bold backdrop-blur-md flex items-center space-x-1">
              <Layers className="w-2.5 h-2.5" />
              <span>Carousel</span>
            </span>
          ) : isVideo ? (
            <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 text-[10px] font-bold backdrop-blur-md flex items-center space-x-1">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Reel</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/20 text-[10px] font-medium backdrop-blur-md flex items-center space-x-1">
              <ImageIcon className="w-2.5 h-2.5" />
              <span>Post</span>
            </span>
          )}
        </div>

        {/* Save to Library Button (Top Right) */}
        <button
          onClick={handleSave}
          disabled={alreadySaved || saving}
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 backdrop-blur-md transition-all z-10 cursor-pointer ${
            alreadySaved
              ? "bg-emerald-600/90 text-white cursor-default"
              : "bg-black/60 hover:bg-brand-500 text-white active:scale-95"
          }`}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : alreadySaved ? (
            <Check className="w-3 h-3" strokeWidth={2.5} />
          ) : (
            <Bookmark className="w-3 h-3" />
          )}
          <span>{alreadySaved ? "Saved" : "Save"}</span>
        </button>

        {/* Center Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <div className="w-12 h-12 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-rd-modal transform scale-90 group-hover:scale-100 transition-transform">
            {item.isCarousel ? (
              <Layers className="w-5 h-5 text-white" />
            ) : !isVideo ? (
              <ImageIcon className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 text-white text-[10px] font-medium">
          <div className="flex items-center space-x-2">
            {item.likes && (
              <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                <Heart className="w-2.5 h-2.5 text-rose-400" />
                <span>{item.likes}</span>
              </span>
            )}
            {item.commentsCount && (
              <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md">
                <MessageCircle className="w-2.5 h-2.5" />
                <span>{item.commentsCount}</span>
              </span>
            )}
          </div>

          {item.duration && (
            <span className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md font-mono text-[9px]">
              {item.duration}
            </span>
          )}
        </div>
      </div>

      {open && (
        <ReelPlayerModal reel={toReel()} isOpen={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

export function CreatorReelGrid({ items, creatorUsername }: { items: CreatorReelItem[]; creatorUsername?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {items.map((it) => (
        <CreatorReelTile key={it.id} item={it} creatorUsername={creatorUsername} />
      ))}
    </div>
  );
}
