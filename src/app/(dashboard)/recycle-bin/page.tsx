"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import {
  Trash2,
  RotateCcw,
  ExternalLink,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function RecycleBinPage() {
  const {
    recycleBin,
    restoreReel,
    permanentlyDeleteReel,
    emptyRecycleBin,
  } = useReels();

  const [confirmEmpty, setConfirmEmpty] = useState(false);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Header & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline space-x-2">
          <h1 className="text-xl font-semibold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            Recycle Bin
          </h1>
          <span className="text-xs text-zinc-500 font-normal">
            · {recycleBin.length} {recycleBin.length === 1 ? "item" : "items"}
          </span>
        </div>

        {recycleBin.length > 0 && (
          <div>
            {confirmEmpty ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    emptyRecycleBin();
                    setConfirmEmpty(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Confirm Empty All
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 text-xs font-medium transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Bin</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {recycleBin.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-surfaceSecondary-light dark:bg-zinc-900 flex items-center justify-center text-secondaryText-light dark:text-zinc-500 mb-3 border border-borderSubtle-light dark:border-white/[0.06]">
            <Trash2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
            Recycle Bin is empty
          </p>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-xs mt-1.5 leading-relaxed">
            Reels removed from your library will appear here for safe keeping.
          </p>
          <Link
            href="/reels"
            className="mt-5 px-3.5 py-1.5 rounded-lg bg-[#5B52E8] hover:bg-[#4E45D9] active:scale-95 text-white text-xs font-medium transition-all"
          >
            Back to Library
          </Link>
        </div>
      ) : (
        /* Instagram-Style 1px Gutter Wall Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[1px] bg-borderSubtle-light dark:bg-black/80">
          {recycleBin.map((reel) => {
            const formattedDeletedDate = reel.deletedAt
              ? new Date(reel.deletedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "Recently";

            const creatorName = reel.creatorUsername
              ? `@${reel.creatorUsername.replace(/^@/, "")}`
              : "Creator";

            return (
              <div
                key={reel.id}
                className="group relative aspect-[9/16] w-full overflow-hidden bg-black select-none"
              >
                {/* Full-bleed thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.caption || "Deleted reel"}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.015] opacity-80 group-hover:opacity-95"
                />

                {/* Hover overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                {/* ─── Top-Left Badge: Removed ─── */}
                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-rose-400">
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Removed</span>
                  </span>
                </div>

                {/* ─── Top-Right Actions: Restore & Permanent Delete ─── */}
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto">
                  {/* Restore Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreReel(reel.id);
                    }}
                    className="w-[30px] h-[30px] rounded-full bg-black/60 backdrop-blur-sm hover:bg-emerald-600 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
                    title="Restore to Library"
                    aria-label="Restore to Library"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Forever Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      permanentlyDeleteReel(reel.id);
                    }}
                    className="w-[30px] h-[30px] rounded-full bg-black/60 backdrop-blur-sm hover:bg-rose-600 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
                    title="Delete Forever"
                    aria-label="Delete Forever"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ─── Bottom Metadata & Quick Action Overlay ─── */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5 pb-2.5 pointer-events-auto">
                  <p className="text-[13px] font-semibold text-white leading-tight truncate drop-shadow-sm">
                    {creatorName}
                  </p>
                  <div className="flex items-center justify-between gap-1.5 mt-1">
                    <span className="text-[11px] text-white/70 truncate">
                      {reel.category || "General"} · {formattedDeletedDate}
                    </span>
                    <a
                      href={reel.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0 flex items-center gap-0.5"
                      title="Open on Instagram"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
