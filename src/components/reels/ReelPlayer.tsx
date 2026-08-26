"use client";

import React, { useState, useRef } from "react";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import { Play, Loader2, Volume2, VolumeX, Maximize2, ExternalLink } from "lucide-react";

/**
 * ReelDash-owned frame around the official Instagram embed.
 * Instagram's native chrome (header, controls, attribution) is shown intact and
 * un-cropped — ReelDash owns the card/chrome/CTA *around* the player.
 */
function ReelDashEmbedFrame({ reel, shortcode }: { reel: Reel; shortcode: string }) {
  const { showToast } = useReels();

  const creatorHandle = reel.creatorUsername || "instagram_user";

  const copyLink = () => {
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Reel link copied to clipboard");
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {/* TOP CHROME — ReelDash owns this */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
            ⚡
          </div>
          <span className="text-xs font-bold text-white shrink-0">ReelDash</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 shrink-0">
            Via Instagram
          </span>
        </div>
        <button
          onClick={copyLink}
          title="Copy link"
          className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* INSTAGRAM EMBED — faithful, no crop/hack */}
      <div className="flex-1 flex items-center justify-center overflow-auto bg-black p-2">
        <iframe
          src={`https://www.instagram.com/reel/${shortcode}/embed/`}
          className="w-full max-w-[340px] border-0 bg-black"
          allowFullScreen
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title={reel.caption || "Instagram Reel"}
        />
      </div>

      {/* The reel is already saved in ReelDash here. Library actions (Open in
          Instagram, Add to Collection) live in the modal sidebar / More menu, so
          we intentionally do NOT duplicate a "Save" or second "Open on Instagram" here. */}
    </div>
  );
}

export type PlaybackStatus = "idle" | "playing" | "loading";

interface ReelPlayerProps {
  reel: Reel;
  thumbnailUrl?: string;
  onOpenOriginal?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export function ReelPlayer({
  reel,
  thumbnailUrl,
  onOpenOriginal,
  className = "",
  autoPlay = false,
}: ReelPlayerProps) {
  const [status, setStatus] = useState<PlaybackStatus>(autoPlay ? "loading" : "idle");
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(reel.mediaUrl || null);
  const [imageError, setImageError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

  const handlePlayClick = async () => {
    // 1. If direct valid media URL exists, play via native HTML5 video
    if (
      playbackUrl &&
      !playbackUrl.includes("zencdn.net") &&
      !playbackUrl.includes("googleapis.com") &&
      playbackUrl.startsWith("http")
    ) {
      setStatus("playing");
      setUseIframe(false);
      return;
    }

    setStatus("loading");

    // 2. Try fetching direct stream from playback endpoint
    try {
      const res = await fetch(
        `/api/reels/${reel.id}/playback?url=${encodeURIComponent(reel.instagramUrl)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "available" && (data.directCdnUrl || data.playbackUrl)) {
          setPlaybackUrl(data.directCdnUrl || data.playbackUrl);
          setStatus("playing");
          setUseIframe(false);
          return;
        }
      }
    } catch {
      // Continue to iframe fallback
    }

    // 3. Fallback to the ReelDash-framed official Instagram embed
    setUseIframe(true);
    setStatus("playing");
  };

  // Trigger autoplay resolution on mount or reel change
  React.useEffect(() => {
    if (autoPlay) {
      handlePlayClick();
    }
  }, [reel.id, autoPlay]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      className={`relative aspect-reel w-full overflow-hidden bg-black select-none ${className}`}
    >
      {/* 1. PLAYING STATE: Seamless Dark Video Player */}
      {status === "playing" && (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {useIframe || !playbackUrl ? (
            /* ReelDash-owned frame around the official Instagram embed */
            <ReelDashEmbedFrame reel={reel} shortcode={shortcode} />
          ) : (
            /* Native HTML5 9:16 Video Player */
            <div className="relative w-full h-full bg-black">
              <video
                ref={videoRef}
                src={playbackUrl}
                poster={coverImageSrc}
                controls
                autoPlay
                playsInline
                muted={isMuted}
                onError={() => setUseIframe(true)}
                className="w-full h-full object-cover"
              />

              {/* Sound & Fullscreen floating controls for HTML5 video */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-20">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleFullscreen}
                  className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LOADING STATE */}
      {status === "loading" && (
        <div className="relative w-full h-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageSrc}
            alt={reel.caption || "Reel preview"}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover filter blur-sm brightness-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
            <Loader2 className="w-9 h-9 animate-spin text-brand-500" />
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide">Starting playback…</p>
              <p className="text-[11px] text-zinc-400">Loading Reel</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. IDLE / COVER PHOTO STATE */}
      {status === "idle" && (
        <div
          className="relative w-full h-full cursor-pointer group bg-black"
          onClick={handlePlayClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageSrc}
            alt={reel.caption || "Reel cover"}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-70 group-hover:opacity-85 transition-opacity" />

          {/* Big Center Play Button */}
          <button
            type="button"
            aria-label="Play Reel"
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
          >
            <Play className="w-7 h-7 fill-white ml-1" />
          </button>

          {/* Bottom Overlay: Creator info & Duration */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <div className="w-6 h-6 rounded-full bg-brand-500/30 text-white font-bold text-[10px] flex items-center justify-center border border-white/20 shrink-0">
                {(reel.creatorUsername || "I")[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-medium text-white/90 truncate drop-shadow-md">
                @{reel.creatorUsername}
              </span>
            </div>

            {reel.duration && (
              <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[11px] font-medium shrink-0">
                {reel.duration}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
