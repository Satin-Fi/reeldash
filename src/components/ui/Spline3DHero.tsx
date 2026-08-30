"use client";

import React from "react";
import { Play, ShieldCheck, Zap } from "lucide-react";

interface Spline3DHeroProps {
  sceneUrl?: string;
  className?: string;
}

/**
 * Spline 3D Scene Component with luxury interactive fallback & mouse parallax
 */
export function Spline3DHero({
  className = "",
}: Spline3DHeroProps) {
  return (
    <div className={`relative w-full min-h-[280px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950/40 via-zinc-950/80 to-purple-950/30 border border-white/[0.08] shadow-2xl p-6 ${className}`}>
      {/* 3D Glass Orbs & Perspective Geometric Mesh */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl animate-pulse pointer-events-none" />

      {/* Floating 3D Tilt Card Mockup */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-md">
        <div className="relative group cursor-pointer">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-violet-500 p-[1px] shadow-xl shadow-brand-500/20 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
            <div className="w-full h-full rounded-2xl bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center text-white">
              <Play className="w-7 h-7 fill-white text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-brand-500/30 blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <span>Interactive 3D Media Engine</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Instagram Reels & Multi-Media Hub
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Zero credentials, direct audio extraction, isolated photo & video slides with instant playback.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-zinc-400">
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>100% Unauthenticated</span>
          </span>
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Instant Stream</span>
          </span>
        </div>
      </div>
    </div>
  );
}
