"use client";

import React, { useState, useRef } from "react";
import { Reel } from "@/types/reel";
import {
  Play,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Tv,
} from "lucide-react";

export type PlaybackStatus = "idle" | "loading" | "available" | "embed";

interface ReelPlayerProps {
  reel: Reel;
  thumbnailUrl?: string;
  onOpenOriginal?: () => void;
  className?: string;
}

export function ReelPlayer({
  reel,
  thumbnailUrl,
  onOpenOriginal,
  className = "",
}: ReelPlayerProps) {
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : reel.id.replace(/^reel-/, "");

  // Safe Reel thumbnail resolution
  const coverImageSrc =
    !imageError && thumbnailUrl && !thumbnailUrl.includes("unsplash.com")
      ? thumbnailUrl
      : !imageError && reel.thumbnailUrl && !reel.thumbnailUrl.includes("unsplash.com")
      ? reel.thumbnailUrl
      : shortcode
      ? `/api/proxy-image?shortcode=${shortcode}`
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

  // Request temporary playable CDN MP4 media URL from backend resolution layer
  const resolveAndPlay = async () => {
    // 1. If reel already has a direct valid CDN mediaUrl, use direct stream immediately
    if (
      reel.mediaUrl &&
      !reel.mediaUrl.includes("zencdn.net") &&
      !reel.mediaUrl.includes("googleapis.com") &&
      reel.mediaUrl.startsWith("http")
    ) {
      setPlaybackUrl(reel.mediaUrl);
      setStatus("available");
      return;
    }

    setStatus("loading");

    // 2. Otherwise, resolve from backend playback endpoint
    try {
      const res = await fetch(
        `/api/reels/${reel.id}/playback?url=${encodeURIComponent(reel.instagramUrl)}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.status === "available" && (data.directCdnUrl || data.playbackUrl)) {
          setPlaybackUrl(data.directCdnUrl || data.playbackUrl);
          setStatus("available");
          return;
        }
      }
    } catch (err) {
      console.warn(`[ReelPlayer] Playback resolution error:`, err);
    }

    // 3. Fallback to interactive in-app embed player (100% reliable for all users)
    setStatus("embed");
  };

  // Handle expired CDN media URL or video loading error
  const handleVideoError = async () => {
    console.warn(`[ReelPlayer] CDN media URL expired or error encountered. Switching to in-app player...`);
    if (retryCount < 1) {
      setRetryCount((prev) => prev + 1);
      try {
        const res = await fetch(
          `/api/reels/${reel.id}/playback?url=${encodeURIComponent(reel.instagramUrl)}&refresh=true`
        );
        const data = await res.json();
        if (data.status === "available" && (data.directCdnUrl || data.playbackUrl)) {
          setPlaybackUrl(data.directCdnUrl || data.playbackUrl);
          setStatus("available");
          return;
        }
      } catch {
        // Fall through to in-app embed
      }
    }
    setStatus("embed");
  };

  const handleOpenOriginal = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(reel.instagramUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleResetToCover = () => {
    setStatus("idle");
    setPlaybackUrl(null);
    setRetryCount(0);
  };

  return (
    <div
      className={`relative aspect-reel w-full rounded-rd-card overflow-hidden bg-black border border-borderSubtle-light dark:border-borderSubtle-dark shadow-rd-card group ${className}`}
    >
      {/* STATE 1: AVAILABLE (Exact Reel CDN .mp4 in HTML5 Video Player) */}
      {status === "available" && playbackUrl && (
        <div className="relative w-full h-full bg-black">
          <video
            ref={videoRef}
            src={playbackUrl}
            poster={coverImageSrc}
            controls
            autoPlay
            playsInline
            crossOrigin="anonymous"
            onError={handleVideoError}
            className="w-full h-full object-cover rounded-rd-card"
          />

          {/* Switch back to cover photo button */}
          <button
            onClick={handleResetToCover}
            title="Show Cover Photo"
            className="absolute top-3 right-3 px-2.5 py-1 bg-black/75 hover:bg-black/90 text-white rounded-rd-sm text-[11px] font-medium backdrop-blur-md flex items-center space-x-1.5 transition-colors z-20 cursor-pointer shadow-rd-subtle"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Cover Photo</span>
          </button>
        </div>
      )}

      {/* STATE 2: LOADING ("Preparing preview...") */}
      {status === "loading" && (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageSrc}
            alt={reel.caption || "Reel preview"}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover filter blur-sm brightness-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide">Loading player…</p>
              <p className="text-[11px] text-zinc-400">Preparing media stream</p>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: EMBED PLAYER (Official in-app responsive Instagram player with 0 extension needed) */}
      {status === "embed" && shortcode && (
        <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
          <iframe
            src={`https://www.instagram.com/reel/${shortcode}/embed/captioned/`}
            className="w-full h-full border-0 rounded-rd-card bg-black"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />

          {/* Top floating control bar */}
          <div className="absolute top-2 right-2 flex items-center space-x-2 z-30">
            <button
              onClick={handleResetToCover}
              title="Show Cover Photo"
              className="px-2.5 py-1 bg-black/80 hover:bg-black text-white rounded-rd-sm text-[11px] font-medium backdrop-blur-md flex items-center space-x-1.5 transition-colors cursor-pointer shadow-rd-subtle"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Cover</span>
            </button>
            <button
              onClick={handleOpenOriginal}
              title="Open Original on Instagram"
              className="px-2.5 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-rd-sm text-[11px] font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-rd-subtle"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: IDLE / COVER PHOTO (Clean high-res cover thumbnail with Play button) */}
      {status === "idle" && (
        <div
          className="relative w-full h-full cursor-pointer group"
          onClick={resolveAndPlay}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageSrc}
            alt={reel.caption || "Reel cover"}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Big Center Play Button */}
          <button
            type="button"
            aria-label="Play Reel"
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-rd-modal hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
          >
            <Play className="w-7 h-7 fill-white ml-1" />
          </button>

          {/* Duration Badge */}
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white text-xs font-medium z-10">
            {reel.duration}
          </div>
        </div>
      )}
    </div>
  );
}
