"use client";

import React, { useState } from "react";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import {
  Play,
  Heart,
  MessageCircle,
  ExternalLink,
  Loader2,
  FolderPlus,
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

  const alreadySaved = reels.some(
    (r) => r.instagramUrl.replace(/\/$/, "") === item.instagramUrl.replace(/\/$/, "")
  );

  const toReel = (): Reel => ({
    id: item.id,
    userId: "preview",
    instagramUrl: item.instagramUrl,
    creatorUsername: creatorUsername || "instagram",
    creatorFullName: "",
    creatorProfileUrl: `https://instagram.com/${creatorUsername || ""}`,
    creatorAvatar: "",
    thumbnailUrl: imgSrc,
    mediaUrl: "",
    caption: item.caption,
    category: "General",
    subcategories: [],
    collections: [],
    hashtags: [],
    isFavorite: false,
    duration: item.duration || "0:30",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (alreadySaved) return;
    setSaving(true);
    try {
      await saveReel(item.instagramUrl);
      showToast("Saved to ReelDash");
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.caption || "Instagram Reel"}
          referrerPolicy="no-referrer"
          onError={() => {
            if (item.shortcode) {
              setImgSrc(`/api/proxy-image?shortcode=${item.shortcode}`);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

        {item.isVideo && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-rd-sm bg-black/60 backdrop-blur-md text-white text-[10px] font-medium flex items-center space-x-1">
            <Play className="w-2.5 h-2.5 fill-white" />
            <span>Reel</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={alreadySaved || saving}
          className={`absolute top-2 right-2 px-2 py-1 rounded-rd-sm text-[10px] font-semibold flex items-center space-x-1 backdrop-blur-md transition-colors cursor-pointer ${
            alreadySaved
              ? "bg-brand-500 text-white"
              : "bg-black/60 hover:bg-brand-500 text-white"
          }`}
        >
          {saving ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <FolderPlus className="w-2.5 h-2.5" />
          )}
          <span>{alreadySaved ? "Saved" : "Save"}</span>
        </button>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2 left-2 flex items-center space-x-2 z-10 text-white text-[10px] font-medium">
          {item.likes && (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-rd-sm bg-black/60 backdrop-blur-md">
              <Heart className="w-2.5 h-2.5" />
              <span>{item.likes}</span>
            </span>
          )}
          {item.commentsCount && (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-rd-sm bg-black/60 backdrop-blur-md">
              <MessageCircle className="w-2.5 h-2.5" />
              <span>{item.commentsCount}</span>
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

export function CreatorReelGrid({ items, username }: { items: CreatorReelItem[]; username?: string }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {items.map((it) => (
        <CreatorReelTile key={it.id} item={it} creatorUsername={username} />
      ))}
    </div>
  );
}
