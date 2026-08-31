"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import {
  Trash2,
  RotateCcw,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Play,
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Trash2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
              Recycle Bin
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark tabular-nums">
              {recycleBin.length} {recycleBin.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-1.5 max-w-xl leading-relaxed">
            Reels removed from your library. You can restore them back anytime or permanently delete them.
          </p>
        </div>

        {recycleBin.length > 0 && (
          <div className="flex items-center space-x-2">
            {confirmEmpty ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    emptyRecycleBin();
                    setConfirmEmpty(false);
                  }}
                  className="px-3 py-1.5 rounded-rd-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Confirm Empty All
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-3 py-1.5 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-surfaceTertiary-light dark:hover:bg-surfaceTertiary-dark text-secondaryText-light dark:text-secondaryText-dark text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-rose-500/10 text-secondaryText-light dark:text-zinc-400 hover:text-rose-500 border border-borderSubtle-light dark:border-white/[0.08] text-xs font-medium transition-all cursor-pointer"
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
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-xl bg-surface-light/40 dark:bg-surface-dark/40">
          <div className="w-12 h-12 rounded-full bg-surfaceSecondary-light dark:bg-zinc-800/60 flex items-center justify-center text-secondaryText-light dark:text-zinc-500 mb-3">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-primaryText-light dark:text-primaryText-dark">
            Recycle Bin is empty
          </h3>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-sm mt-1.5 leading-relaxed">
            When you remove reels from your library, they will appear here. You can restore them or permanently delete them anytime.
          </p>
          <Link
            href="/reels"
            className="mt-5 px-4 py-2 rounded-rd-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
          >
            Go to Library
          </Link>
        </div>
      ) : (
        /* Recycle Bin Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {recycleBin.map((reel) => {
            const formattedDeletedDate = reel.deletedAt
              ? new Date(reel.deletedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently";

            return (
              <div
                key={reel.id}
                className="group relative flex flex-col bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.08] rounded-rd-lg overflow-hidden shadow-rd-card transition-all"
              >
                {/* 9:16 Media Preview */}
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.caption || "Deleted reel"}
                    className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Deleted Badge */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-rose-500/80 backdrop-blur-md text-[9px] font-semibold text-white shadow-sm">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Removed</span>
                    </span>
                    <a
                      href={reel.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white"
                      title="Open on Instagram"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Bottom Info on Thumbnail */}
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <p className="text-xs font-semibold text-white truncate">
                      @{reel.creatorUsername || "creator"}
                    </p>
                    <p className="text-[10px] text-white/60 truncate mt-0.5">
                      {reel.category || "General"}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-2 bg-surface-light dark:bg-[#141820] border-t border-borderSubtle-light dark:border-white/[0.06] space-y-1.5">
                  <div className="flex items-center text-[10px] text-secondaryText-light dark:text-zinc-500">
                    <Calendar className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">{formattedDeletedDate}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {/* Restore Button */}
                    <button
                      onClick={() => restoreReel(reel.id)}
                      className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-[5px] bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Restore to library"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    {/* Delete Permanently Button */}
                    <button
                      onClick={() => permanentlyDeleteReel(reel.id)}
                      className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-[5px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
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
