"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import Image from "next/image";
import Link from "next/link";
import { Plus, ArrowRight, Folder, Film } from "lucide-react";

export default function CollectionsPage() {
  const { collections, reels, setActiveCollection, setIsCreateCollectionModalOpen } = useReels();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
            Collections
          </h1>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
            Organize your Reels your way.
          </p>
        </div>
        <button
          onClick={() => setIsCreateCollectionModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-semibold rounded-rd-md shadow-rd-subtle transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* 9.1 Collection Card Grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => {
            // Find reels belonging to this collection
            const colReels = reels.filter((r) => r.collections.includes(col.id));
            const thumbs = colReels.slice(0, 4).map((r) => r.thumbnailUrl);

            return (
              <div
                key={col.id}
                className="group relative flex flex-col bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-card overflow-hidden shadow-rd-subtle hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* 2x2 Thumbnail Collage */}
                <Link
                  href="/reels"
                  onClick={() => setActiveCollection(col.id)}
                  className="block aspect-video w-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark overflow-hidden relative"
                >
                  {thumbs.length > 0 ? (
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-0.5 bg-borderSubtle-light dark:bg-borderSubtle-dark">
                      {thumbs.map((src, i) => (
                        <div key={i} className="relative w-full h-full">
                          <Image
                            src={src}
                            alt={col.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                      {/* Fill remaining collage slots if less than 4 */}
                      {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="w-full h-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark flex items-center justify-center text-mutedText-light dark:text-mutedText-dark"
                        >
                          <Film className="w-3.5 h-3.5 opacity-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-1 text-mutedText-light dark:text-mutedText-dark">
                      <Folder className="w-8 h-8 opacity-40" />
                      <span className="text-xs">Empty Collection</span>
                    </div>
                  )}
                </Link>

                {/* Card Info */}
                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Folder className="w-4 h-4 text-brand-500 shrink-0" />
                      <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                        {col.name}
                      </h3>
                    </div>
                    {col.description && (
                      <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark line-clamp-1 mt-1">
                        {col.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-borderSubtle-light/50 dark:border-borderSubtle-dark/50 text-xs">
                    <span className="font-mono font-semibold text-secondaryText-light dark:text-secondaryText-dark">
                      {colReels.length} Reels
                    </span>
                    <Link
                      href="/reels"
                      onClick={() => setActiveCollection(col.id)}
                      className="flex items-center space-x-1 font-medium text-brand-500 hover:underline"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg bg-surface-light/50 dark:bg-surface-dark/50">
          <Folder className="w-10 h-10 text-mutedText-light mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-semibold">No collections yet</h4>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-sm mx-auto mt-1 mb-4">
            Create collections for the things you want to keep together.
          </p>
          <button
            onClick={() => setIsCreateCollectionModalOpen(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-rd-md text-xs font-semibold"
          >
            Create Collection
          </button>
        </div>
      )}
    </div>
  );
}
