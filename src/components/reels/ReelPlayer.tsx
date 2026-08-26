import React, { useState, useRef, useEffect } from "react";
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
import {
  Play,
  Pause,
  Loader2,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  Music2,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Layers,
  Sparkles,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * ReelDash-owned frame around the official Instagram embed.
 */
function ReelDashEmbedFrame({ reel, shortcode }: { reel: Reel; shortcode: string }) {
  const { showToast } = useReels();

  const isPost = reel.mediaType === "post" || reel.instagramUrl.includes("/p/");
  const embedSrc = isPost
    ? `https://www.instagram.com/p/${shortcode}/embed/`
    : `https://www.instagram.com/reel/${shortcode}/embed/`;

  const copyLink = () => {
    navigator.clipboard.writeText(reel.instagramUrl);
    showToast("Link copied to clipboard");
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {/* TOP CHROME */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
            ⚡
          </div>
          <span className="text-xs font-bold text-white shrink-0">ReelDash</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 shrink-0">
            {isPost ? "Instagram Post" : "Instagram Reel"}
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={copyLink}
            title="Copy link"
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* INSTAGRAM EMBED — sandboxed to prevent tab hijacking & external navigation */}
      <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black p-0">
        <iframe
          src={embedSrc}
          className="w-full h-full min-h-[480px] sm:min-h-[560px] md:min-h-[640px] max-w-[440px] border-0 bg-black"
          allowFullScreen
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title={reel.caption || "Instagram Media"}
        />
      </div>
    </div>
  );
}

/**
 * 1. DEDICATED SONG / AUDIO PLAYER WITH WAVEFORM & VINYL DISC
 */
function AudioSongPlayer({ reel, coverImageSrc }: { reel: Reel; coverImageSrc: string }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(25);
  const [currentTime, setCurrentTime] = useState("0:34");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioTrackUrl = reel.audioUrl || reel.mediaUrl || "";

  const trackTitle = reel.audioTitle || reel.caption.slice(0, 35) || "Instagram Audio Track";
  const artistName = reel.audioArtist || `@${reel.creatorUsername} • Original Audio`;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p);
      const mins = Math.floor(audioRef.current.currentTime / 60);
      const secs = Math.floor(audioRef.current.currentTime % 60);
      setCurrentTime(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-8 bg-gradient-to-b from-zinc-900 via-black to-zinc-950 text-white select-none overflow-hidden">
      <audio
        ref={audioRef}
        src={audioTrackUrl}
        autoPlay
        loop
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full scale-125 pointer-events-none" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Music2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Audio Studio Player
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
          Lossless 320kbps
        </span>
      </div>

      {/* Center Vinyl Disc / Cover Art Presentation */}
      <div className="relative flex flex-col items-center justify-center my-4 z-10">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Spinning Vinyl Disc */}
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-zinc-800 bg-zinc-950 shadow-2xl flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-700 via-black to-zinc-900" />
            <div className="w-20 h-20 rounded-full border border-zinc-700/50" />
            <div className="w-32 h-32 rounded-full border border-zinc-700/30" />
          </motion.div>

          {/* Center Album Artwork */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xl z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageSrc}
              alt={trackTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-zinc-950 border border-zinc-700" />
          </div>
        </div>

        {/* Track Title & Artist */}
        <div className="text-center mt-5 space-y-1 max-w-xs">
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
            {trackTitle}
          </h3>
          <p className="text-xs text-zinc-400 truncate">{artistName}</p>
        </div>
      </div>

      {/* Dynamic Animated Waveform Equalizer */}
      <div className="w-full max-w-xs flex items-center justify-center space-x-1.5 h-10 my-2 z-10">
        {[40, 70, 95, 55, 80, 100, 60, 85, 45, 90, 65, 75, 95, 50, 80, 60, 40].map((h, i) => (
          <motion.div
            key={i}
            animate={{
              height: isPlaying ? [`${Math.max(15, h * 0.3)}%`, `${h}%`, `${Math.max(20, h * 0.5)}%`] : "20%",
            }}
            transition={{
              repeat: Infinity,
              duration: 0.8 + (i % 4) * 0.2,
              ease: "easeInOut",
            }}
            className="w-1 rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300"
          />
        ))}
      </div>

      {/* Audio Controls Bar */}
      <div className="w-full max-w-sm space-y-3 z-10">
        {/* Progress Timeline */}
        <div className="space-y-1">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newPct = (clickX / rect.width) * 100;
              setProgress(newPct);
              if (audioRef.current && audioRef.current.duration) {
                audioRef.current.currentTime = (newPct / 100) * audioRef.current.duration;
              }
            }}
            className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer relative"
          >
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>{currentTime}</span>
            <span>{reel.duration || "2:14"}</span>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleMute}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <a
            href={`/api/download?type=audio&shortcode=${reel.id.replace(/^audio-/, "")}`}
            download
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Download Audio MP3"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. DEDICATED MULTI-MEDIA POST & CAROUSEL VIEWER (Photos + Video Slides)
 */
function MultiMediaPostViewer({ reel, coverImageSrc }: { reel: Reel; coverImageSrc: string }) {
  // Normalize all slides
  const rawSlides: Array<{ id: string; type: "image" | "video"; url: string }> = [];

  if (reel.carouselSlides && reel.carouselSlides.length > 0) {
    reel.carouselSlides.forEach((s, idx) => {
      rawSlides.push({
        id: s.id || `slide-${idx}`,
        type: s.type || (s.url.includes(".mp4") ? "video" : "image"),
        url: s.url,
      });
    });
  } else if (reel.carouselImages && reel.carouselImages.length > 0) {
    reel.carouselImages.forEach((imgUrl, idx) => {
      rawSlides.push({
        id: `slide-${idx}`,
        type: imgUrl.includes(".mp4") ? "video" : "image",
        url: imgUrl,
      });
    });
  } else {
    // Single media post item
    const isVid = reel.mediaUrl?.includes(".mp4") || reel.mediaType === "reel";
    rawSlides.push({
      id: "slide-0",
      type: isVid ? "video" : "image",
      url: (isVid && reel.mediaUrl) ? reel.mediaUrl : coverImageSrc,
    });
  }

  // Filter modes: 'all' | 'image' | 'video'
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSlideMuted, setIsSlideMuted] = useState(false);
  const slideVideoRef = useRef<HTMLVideoElement | null>(null);

  const filteredSlides = rawSlides.filter((s) => {
    if (filter === "image") return s.type === "image";
    if (filter === "video") return s.type === "video";
    return true;
  });

  const activeSlide = filteredSlides[activeIdx] || filteredSlides[0] || rawSlides[0];

  const imageCount = rawSlides.filter((s) => s.type === "image").length;
  const videoCount = rawSlides.filter((s) => s.type === "video").length;
  const hasMixedMedia = imageCount > 0 && videoCount > 0;

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % filteredSlides.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + filteredSlides.length) % filteredSlides.length);
  };

  const toggleSlideMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slideVideoRef.current) {
      const nextMute = !slideVideoRef.current.muted;
      slideVideoRef.current.muted = nextMute;
      slideVideoRef.current.volume = 1.0;
      setIsSlideMuted(nextMute);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black select-none overflow-hidden justify-between items-center">
      {/* Top Media Filter Pills (Photos vs Videos separation) */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
        {hasMixedMedia ? (
          <div className="flex items-center space-x-1 p-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 pointer-events-auto shadow-lg">
            <button
              onClick={() => {
                setFilter("all");
                setActiveIdx(0);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                filter === "all" ? "bg-brand-500 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({rawSlides.length})
            </button>
            <button
              onClick={() => {
                setFilter("image");
                setActiveIdx(0);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                filter === "image" ? "bg-brand-500 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              📸 Photos ({imageCount})
            </button>
            <button
              onClick={() => {
                setFilter("video");
                setActiveIdx(0);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                filter === "video" ? "bg-brand-500 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              🎬 Videos ({videoCount})
            </button>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10 flex items-center space-x-1">
            <span>{activeSlide.type === "video" ? "🎬 Video Slide" : "📸 Photo Slide"}</span>
          </div>
        )}

        {/* Counter Badge */}
        {filteredSlides.length > 1 && (
          <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 pointer-events-auto">
            {activeIdx + 1} / {filteredSlides.length}
          </div>
        )}
      </div>

      {/* Main Slide Content (Image vs Video) */}
      <div className="relative w-full h-full flex items-center justify-center p-0 bg-black overflow-hidden">
        {activeSlide.type === "video" ? (
          /* Native HTML5 Video Slide */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={slideVideoRef}
              key={activeSlide.url}
              src={activeSlide.url}
              poster={coverImageSrc}
              controls
              autoPlay
              playsInline
              muted={isSlideMuted}
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => toggleSlideMute()}
            />

            {/* Video Slide Unmute Pill */}
            {isSlideMuted && (
              <button
                onClick={toggleSlideMute}
                className="absolute top-12 left-4 z-20 px-3 py-1.5 rounded-full bg-black/85 hover:bg-black text-white text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-md border border-white/20 shadow-xl cursor-pointer animate-pulse"
              >
                <VolumeX className="w-4 h-4 text-pink-400" />
                <span>Tap to Unmute</span>
              </button>
            )}

            {/* Video Sound Toggle */}
            <button
              onClick={toggleSlideMute}
              className="absolute bottom-4 right-4 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 cursor-pointer shadow-xl border border-white/20"
              title={isSlideMuted ? "Unmute" : "Mute"}
            >
              {isSlideMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        ) : (
          /* High-Res Photo Slide */
          <div className="relative w-full h-full flex items-center justify-center p-2 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={activeSlide.url}
              src={activeSlide.url}
              alt={reel.caption || "Post media"}
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-[640px] object-contain rounded-sm"
            />
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {filteredSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-30 border border-white/20 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-30 border border-white/20 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots & Thumbnails Indicator */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center space-x-1.5 z-30 pointer-events-auto">
            {filteredSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(i);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  activeIdx === i
                    ? "w-6 bg-white shadow-md"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                title={`Slide ${i + 1} (${s.type})`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 3. DEDICATED STORY VIEWER WITH TIMED SEGMENTS
 */
function StoryViewer({ reel, coverImageSrc }: { reel: Reel; coverImageSrc: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-black select-none overflow-hidden justify-between p-3 sm:p-4">
      {/* Top Story Progress Bars & Creator Info */}
      <div className="relative z-20 space-y-2.5">
        <div className="w-full flex space-x-1">
          <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="h-1 flex-1 bg-white/30 rounded-full" />
          <div className="h-1 flex-1 bg-white/30 rounded-full" />
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500">
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white">
              {reel.creatorUsername?.[0]?.toUpperCase() || "S"}
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-white">@{reel.creatorUsername}</span>
            <span className="text-zinc-400 text-[10px]">• 3h ago</span>
          </div>
        </div>
      </div>

      {/* Main Story Media */}
      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageSrc}
          alt={reel.caption || "Story"}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
      </div>

      {/* Bottom Story Caption Overlay */}
      <div className="relative z-20 p-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
        <p className="text-xs text-white line-clamp-2 leading-relaxed">
          {reel.caption}
        </p>
      </div>
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

  const mediaType = reel.mediaType || (reel.instagramUrl?.includes("/audio/") ? "audio" : reel.instagramUrl?.includes("/stories/") ? "story" : reel.instagramUrl?.includes("/p/") ? "post" : "reel");

  const shortcodeMatch = reel.instagramUrl.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : reel.id.replace(/^reel-/, "");

  // Safe thumbnail resolution
  const coverImageSrc =
    !imageError && thumbnailUrl && !thumbnailUrl.includes("unsplash.com")
      ? thumbnailUrl
      : !imageError && reel.thumbnailUrl && !reel.thumbnailUrl.includes("unsplash.com")
      ? reel.thumbnailUrl
      : shortcode
      ? `/api/proxy-image?shortcode=${shortcode}`
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

  // Dispatch to dedicated players if audio, post, or story
  if (mediaType === "audio") {
    return (
      <div className={`relative aspect-reel w-full overflow-hidden bg-black select-none ${className}`}>
        <AudioSongPlayer reel={reel} coverImageSrc={coverImageSrc} />
      </div>
    );
  }

  if (mediaType === "story") {
    return (
      <div className={`relative aspect-reel w-full overflow-hidden bg-black select-none ${className}`}>
        <StoryViewer reel={reel} coverImageSrc={coverImageSrc} />
      </div>
    );
  }

  if (mediaType === "post" || reel.isCarousel || (reel.carouselSlides && reel.carouselSlides.length > 0) || (reel.carouselImages && reel.carouselImages.length > 1)) {
    return (
      <div className={`relative aspect-reel w-full overflow-hidden bg-black select-none ${className}`}>
        <MultiMediaPostViewer reel={reel} coverImageSrc={coverImageSrc} />
      </div>
    );
  }

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
      // Continue to stream proxy
    }

    // 3. Play via direct video stream proxy endpoint
    if (shortcode) {
      setPlaybackUrl(`/api/video-stream?shortcode=${shortcode}`);
      setStatus("playing");
      setUseIframe(false);
      return;
    }

    // 4. Last resort: Sandboxed embed frame
    setUseIframe(true);
    setStatus("playing");
  };

  // Trigger autoplay resolution on mount or reel change
  useEffect(() => {
    if (autoPlay) {
      handlePlayClick();
    }
  }, [reel.id, autoPlay]);

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      videoRef.current.volume = 1.0;
      setIsMuted(nextMuted);
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
            <ReelDashEmbedFrame reel={reel} shortcode={shortcode} />
          ) : (
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
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => toggleMute()}
              />
            </div>
          )}

          {/* Persistent Floating Tap to Unmute Badge */}
          {isMuted && (
            <button
              onClick={toggleMute}
              className="absolute top-12 left-4 z-30 px-3 py-1.5 rounded-full bg-black/85 hover:bg-black text-white text-xs font-semibold flex items-center space-x-1.5 backdrop-blur-md border border-white/20 shadow-xl cursor-pointer animate-pulse"
            >
              <VolumeX className="w-4 h-4 text-pink-400" />
              <span>Tap to Unmute</span>
            </button>
          )}

          {/* Persistent Sound & Fullscreen floating controls */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-30 pointer-events-auto">
            <button
              onClick={toggleMute}
              className="w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 cursor-pointer shadow-xl border border-white/20"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-pink-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={handleFullscreen}
              className="w-9 h-9 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 cursor-pointer shadow-xl border border-white/20"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {status === "loading" && (
        <div className="relative w-full h-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageSrc}
            alt={reel.caption || "Media preview"}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover filter blur-sm brightness-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
            <Loader2 className="w-9 h-9 animate-spin text-brand-500" />
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wide">Starting playback…</p>
              <p className="text-[11px] text-zinc-400">Loading {mediaType}</p>
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
            alt={reel.caption || "Media cover"}
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

