"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface SplineSceneProps {
  scene?: string;
  className?: string;
}

/**
 * 21st.dev + Spline 3D Scene Component
 * Loads interactive 3D WebGL scenes using the official Spline Web Component
 * with zero Next.js webpack SSR bundling conflicts and graceful glowing fallback.
 */
export function SplineScene({
  scene = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  className = "",
}: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    // Check if spline-viewer script is already loaded
    if (customElements.get("spline-viewer")) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@splinetool/viewer@1.9.72/build/spline-viewer.js";
    script.onload = () => {
      setScriptReady(true);
    };
    document.head.appendChild(script);

    return () => {
      // Keep script in head for performance
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[220px] overflow-hidden rounded-rd-xl select-none flex items-center justify-center bg-zinc-950 ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-brand-500/25 via-pink-500/20 to-transparent blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-gradient-to-tr from-purple-600/20 via-brand-500/15 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
            <Sparkles className="w-4 h-4 text-brand-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-wider">
            Loading 3D Visual
          </span>
        </div>
      )}

      {/* Official Spline Web Component */}
      {scriptReady ? (
        // @ts-ignore
        <spline-viewer
          url={scene}
          onLoad={() => setIsLoaded(true)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      )}
    </div>
  );
}
