"use client";

import React, { useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useReels } from "@/context/ReelContext";
import { MediaTypeFilter } from "@/types/reel";
import { LibraryHeader } from "@/components/ui/LibraryHeader";
import { FilterToolbar } from "@/components/ui/FilterToolbar";
import { ReelGrid } from "@/components/reels/ReelGrid";

function ReelsContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as MediaTypeFilter | null;
  const categoryParam = searchParams.get("category");
  const collectionParam = searchParams.get("collection");

  const {
    reels,
    collections,
    activeCategory,
    setActiveCategory,
    activeCollection,
    setActiveCollection,
    activeMediaType,
    setActiveMediaType,
    searchQuery,
    sortOption,
    viewMode,
  } = useReels();

  // Sync activeMediaType & activeCategory with URL search parameters
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
      setActiveMediaType("all");
      setActiveCollection(null);
    } else if (collectionParam) {
      setActiveCollection(collectionParam);
      setActiveCategory(null);
      setActiveMediaType("all");
    } else {
      setActiveCategory(null);
      setActiveCollection(null);
      if (typeParam && ["all", "reel", "post", "audio", "story"].includes(typeParam)) {
        setActiveMediaType(typeParam);
      } else {
        setActiveMediaType("all");
      }
    }
  }, [typeParam, categoryParam, collectionParam, setActiveMediaType, setActiveCategory, setActiveCollection]);

  // Determine current active section config
  const headerConfig = useMemo(() => {
    if (categoryParam || (activeCategory && !typeParam)) {
      const catName = categoryParam || activeCategory || "Category";
      const catReels = reels.filter((reel) => {
        const catLower = catName.trim().toLowerCase();
        const allAssigned = reel.categories && reel.categories.length > 0 ? reel.categories : [reel.category || ""];
        return (
          allAssigned.some((c) => c.toLowerCase() === catLower) ||
          (Array.isArray(reel.tags) && reel.tags.some((t) => t.toLowerCase() === catLower)) ||
          (Array.isArray(reel.hashtags) && reel.hashtags.some((h) => h.toLowerCase() === catLower)) ||
          (Array.isArray(reel.aiKeywords) && reel.aiKeywords.some((k) => k.toLowerCase() === catLower)) ||
          (Array.isArray(reel.subcategories) && reel.subcategories.some((s) => s.toLowerCase() === catLower))
        );
      });
      const creators = new Set(catReels.map((r) => r.creatorUsername).filter(Boolean)).size;
      return {
        title: catName,
        subtitle: `Curated collection of saved items filed under ${catName}.`,
        stats: [
          { value: catReels.length, label: "FILED ITEMS" },
          { value: creators, label: "CREATORS" },
        ],
        placeholder: `Find in ${catName}…`,
        emptyTitle: `No items in ${catName}`,
        emptySubtitle: "Items tagged or categorized here will show up in this collection.",
      };
    }

    if (collectionParam || (activeCollection && !typeParam)) {
      const colId = collectionParam || activeCollection;
      const col = collections.find((c) => c.id === colId);
      const colName = col?.name || "Collection";
      const colReels = reels.filter((r) => r.collections?.includes(colId || ""));
      const creators = new Set(colReels.map((r) => r.creatorUsername).filter(Boolean)).size;
      return {
        title: colName,
        subtitle: col?.description || "A dedicated collection of your saved inspiration.",
        stats: [
          { value: colReels.length, label: "COLLECTION ITEMS" },
          { value: creators, label: "CREATORS" },
        ],
        placeholder: "Find in collection…",
        emptyTitle: `No items in ${colName}`,
        emptySubtitle: "Add reels to this collection to organize your inspiration.",
      };
    }

    // Media type handling:
    const effectiveType = typeParam && ["all", "reel", "post", "audio", "story"].includes(typeParam)
      ? typeParam
      : activeMediaType || "all";

    if (effectiveType === "reel") {
      const reelItems = reels.filter((r) => (r.mediaType || "reel") === "reel");
      const creators = new Set(reelItems.map((r) => r.creatorUsername).filter(Boolean)).size;
      return {
        title: "Reels",
        subtitle: "High energy. Pure motion. A curated archive of short-form inspiration and craft.",
        stats: [
          { value: reelItems.length, label: "SAVED REELS" },
          { value: creators, label: "CREATORS" },
        ],
        placeholder: "Find a reel…",
        emptyTitle: "No reels found",
        emptySubtitle: "Send any reel to your ReelDash bot on Instagram to save it here.",
      };
    }

    if (effectiveType === "post") {
      const postItems = reels.filter((r) => r.mediaType === "post");
      const creators = new Set(postItems.map((r) => r.creatorUsername).filter(Boolean)).size;
      return {
        title: "Posts & Photos",
        subtitle: "Still frames. Deep focus. Every visual reference, carousel, and photo in your vault.",
        stats: [
          { value: postItems.length, label: "POSTS & PHOTOS" },
          { value: creators, label: "CREATORS" },
        ],
        placeholder: "Find a post or photo…",
        emptyTitle: "No posts or photos found",
        emptySubtitle: "Photo carousels and posts saved from Instagram will appear here.",
      };
    }

    if (effectiveType === "audio") {
      const audioItems = reels.filter((r) => r.mediaType === "audio");
      const artists = new Set(
        audioItems.map((r) => r.audioArtist || r.creatorUsername).filter(Boolean)
      ).size;
      return {
        title: "Songs & Audio",
        subtitle: "Sonic gems. Soundtrack archive. Discover and replay every track that set the mood.",
        stats: [
          { value: audioItems.length, label: "AUDIO TRACKS" },
          { value: artists, label: "ARTISTS" },
        ],
        placeholder: "Find a track or artist…",
        emptyTitle: "No audio tracks found",
        emptySubtitle: "Saved audio tracks from reels and videos will appear in this studio.",
      };
    }

    // Default: All Library
    const totalItems = reels.length;
    const totalCreators = new Set(reels.map((r) => r.creatorUsername).filter(Boolean)).size;
    return {
      title: "All Library",
      subtitle: "Less scrolling. More finding. A considered home for everything that catches your eye.",
      stats: [
        { value: totalItems, label: "SAVED ITEMS" },
        { value: totalCreators, label: "CREATORS" },
      ],
      placeholder: "Find in library…",
      emptyTitle: "Your library is empty",
      emptySubtitle: "Start saving Reels, carousels, and audio tracks to build your personal vault.",
    };
  }, [categoryParam, activeCategory, collectionParam, activeCollection, typeParam, activeMediaType, reels, collections]);

  // Filter Reels based on mediaType, search, category, and collection
  let filteredReels = reels.filter((reel) => {
    // Category match (Case-insensitive)
    if (activeCategory) {
      const catLower = activeCategory.trim().toLowerCase();
      const allAssigned = reel.categories && reel.categories.length > 0 ? reel.categories : [reel.category || ""];
      const matchCat = allAssigned.some((c) => c.toLowerCase() === catLower);
      const matchTags =
        (Array.isArray(reel.tags) && reel.tags.some((t) => t.toLowerCase() === catLower)) ||
        (Array.isArray(reel.hashtags) && reel.hashtags.some((h) => h.toLowerCase() === catLower));
      const matchKeywords = Array.isArray(reel.aiKeywords) && reel.aiKeywords.some((k) => k.toLowerCase() === catLower);
      const matchSub = Array.isArray(reel.subcategories) && reel.subcategories.some((s) => s.toLowerCase() === catLower);
      if (!matchCat && !matchTags && !matchKeywords && !matchSub) {
        return false;
      }
    }
    // Media type filter
    if (activeMediaType && activeMediaType !== "all") {
      const type = reel.mediaType || "reel";
      if (type !== activeMediaType) {
        return false;
      }
    }
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaption = reel.caption?.toLowerCase().includes(q);
      const matchSummary = reel.aiSummary?.toLowerCase().includes(q);
      const matchTopics = Array.isArray(reel.aiTopics) && reel.aiTopics.some((t) => t.toLowerCase().includes(q));
      const matchCreator = reel.creatorUsername?.toLowerCase().includes(q);
      const matchCategory = reel.category?.toLowerCase().includes(q);
      const matchAudio = reel.audioTitle?.toLowerCase().includes(q) || reel.audioArtist?.toLowerCase().includes(q);
      const matchKeywords = reel.aiKeywords?.some((k) => k.toLowerCase().includes(q));
      if (!matchCaption && !matchSummary && !matchTopics && !matchCreator && !matchCategory && !matchAudio && !matchKeywords) {
        return false;
      }
    }
    // Collection match
    if (activeCollection && !reel.collections?.includes(activeCollection)) {
      return false;
    }
    return true;
  });

  // Sort Reels
  filteredReels.sort((a, b) => {
    if (sortOption === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortOption === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortOption === "creator") {
      return a.creatorUsername.localeCompare(b.creatorUsername);
    }
    if (sortOption === "most_viewed") {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    if (sortOption === "recently_viewed") {
      return new Date(b.lastViewedAt || 0).getTime() - new Date(a.lastViewedAt || 0).getTime();
    }
    return 0;
  });

  return (
    <div className="w-full">
      {/* Editorial Header */}
      <LibraryHeader
        title={headerConfig.title}
        subtitle={headerConfig.subtitle}
        stats={headerConfig.stats}
      />

      {/* Controls: Search Pill + Sort & View Mode (No New Category button) */}
      <FilterToolbar placeholder={headerConfig.placeholder} />

      {/* Grid / Feed / Compact View */}
      <ReelGrid
        reels={filteredReels}
        viewMode={viewMode}
        emptyTitle={headerConfig.emptyTitle}
        emptySubtitle={headerConfig.emptySubtitle}
      />
    </div>
  );
}

export default function AllReelsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-mutedText-light">Loading library…</div>}>
      <ReelsContent />
    </Suspense>
  );
}
