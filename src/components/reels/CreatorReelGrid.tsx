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
  Images,
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
    creatorAvatar: `/api/proxy-image?username=${encodeURIComponent(creatorUsername || "")}`,
    thumbnailUrl: imgSrc || item.thumbnailUrl,
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
        shortcode: item.shortcode,
        creator: creatorUsername,
        creatorFullName: creatorUsername ? creatorUsername.charAt(0).toUpperCase() + creatorUsername.slice(1) : undefined,
        creatorAvatar: `/api/proxy-image?username=${encodeURIComponent(creatorUsername || "")}`,
        thumbnailUrl: item.thumbnailUrl || (item.shortcode ? `/api/proxy-image?shortcode=${item.shortcode}` : undefined),
        caption: item.caption,
        mediaType,
        isCarousel: item.isCarousel,
        carouselImages: item.carouselImages,
        likes: item.likes || undefined,
        commentsCount: item.commentsCount || undefined,
        duration: item.duration,
      });
      showToast(item.isCarousel ? "Saved Carousel to Library" : "Saved to Library");
    } catch {
      showToast("Could not save Reel");
    } finally {
      setSaving(false);
    }
  };

  const defaultCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";

  const resolveCurrentImg = () => {
    const raw = item.thumbnailUrl || item.rawThumbnailUrl || imgSrc;
    const cleanUser = creatorUsername ? creatorUsername.replace(/^@/, "").trim() : "";
    const cleanSc = item.shortcode ? item.shortcode.trim() : "";

    if (!raw && cleanSc) {
      return `/api/proxy-image?shortcode=${encodeURIComponent(cleanSc)}${cleanUser ? `&creator=${encodeURIComponent(cleanUser)}` : ""}`;
    }
    if (!raw) return defaultCover;

    if (raw.startsWith("http") && !raw.includes("wsrv.nl") && !raw.includes("unsplash.com")) {
      return `/api/proxy-image?url=${encodeURIComponent(raw)}${cleanSc ? `&shortcode=${encodeURIComponent(cleanSc)}` : ""}${cleanUser ? `&creator=${encodeURIComponent(cleanUser)}` : ""}`;
    }
    return raw;
  };

  const currentImg = resolveCurrentImg();

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative aspect-[9/16] w-full overflow-hidden bg-black cursor-pointer select-none"
      >
        {/* Thumbnail Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImg}
          alt={item.caption || "Instagram Media"}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultCover;
          }}
          className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.015]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

        {/* Top Header Group */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          {/* Subtle Carousel Icon (Only if multi-item carousel > 1) */}
          <div>
            {item.isCarousel && item.carouselImages && item.carouselImages.length > 1 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white shadow-sm border border-white/10" title="Multi-image Carousel">
                <Images className="w-3 h-3 text-white/90" />
                <span className="tabular-nums">{item.carouselImages.length}</span>
              </span>
            )}
          </div>

          {/* Save to Library Button (Top Right) */}
          <button
            onClick={handleSave}
            disabled={alreadySaved || saving}
            className={`pointer-events-auto px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1 backdrop-blur-md border transition-all cursor-pointer shadow-sm ${
              alreadySaved
                ? "bg-emerald-600/90 border-emerald-500/40 text-white cursor-default"
                : "bg-black/60 border-white/10 hover:bg-[#5B52E8] text-white active:scale-95"
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
        </div>

        {/* Center Hover Action Disk (Contextual Hover Action) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-200">
            {item.isCarousel ? (
              <Images className="w-5 h-5 text-white" />
            ) : !isVideo ? (
              <ImageIcon className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
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
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[1.5px] bg-borderSubtle-light dark:bg-black/80">
      {items.map((it) => (
        <CreatorReelTile key={it.id} item={it} creatorUsername={creatorUsername} />
      ))}
    </div>
  );
}
