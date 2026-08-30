"use client";

import React, { useEffect, useRef, useState } from "react";

interface SplineSceneProps {
  scene?: string;
  className?: string;
}

/**
 * Clean Spline 3D Scene Component
 * Loads interactive 3D WebGL scenes silently with zero visual clutter.
 */
export function SplineScene({
  scene = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
  className = "",
}: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[220px] overflow-hidden select-none flex items-center justify-center bg-transparent ${className}`}
    >
      {scriptReady && (
        // @ts-ignore
        <spline-viewer
          url={scene}
          style={{ width: "100%", height: "100%", outline: "none" }}
        />
      )}
    </div>
  );
}
