"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { ArrowLeft, Trash2, Edit2, Folder, Check, X } from "lucide-react";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const colId = params.id as string;

  const { collections, reels, viewMode, showToast } = useReels();
  const collection = collections.find((c) => c.id === colId);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");

  if (!collection) {
    return (
      <div className="p-12 text-center space-y-4">
        <Folder className="w-10 h-10 text-mutedText-light mx-auto opacity-40" />
        <h3 className="text-lg font-bold">Collection not found</h3>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
          This collection may have been deleted or moved.
        </p>
        <button
          onClick={() => router.push("/collections")}
          className="px-4 py-2 bg-brand-500 text-white rounded-rd-md text-xs font-semibold cursor-pointer"
        >
          Return to Collections
        </button>
      </div>
    );
  }

  // Find all reels in this collection
  const collectionReels = reels.filter((r) => r.collections.includes(collection.id));

  return (
    <div className="space-y-6">
      {/* Top Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to collections</span>
      </button>

      {/* Header */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{collection.icon || "📁"}</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
                {collection.name}
              </h1>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-mono mt-0.5">
                {collectionReels.length} saved Reels
              </p>
            </div>
          </div>
        </div>

        {collection.description && (
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark max-w-xl">
            {collection.description}
          </p>
        )}
      </div>

      {/* Reels Grid */}
      <ReelGrid
        reels={collectionReels}
        viewMode={viewMode}
        emptyTitle="No Reels in this collection"
        emptySubtitle="Add Reels to this collection from the Reel card menu."
      />
    </div>
  );
}
