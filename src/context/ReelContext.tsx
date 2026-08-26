"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Reel, Collection, SmartCategory, SortOption, ViewMode, MediaType, MediaTypeFilter } from "@/types/reel";
import { INITIAL_REELS, INITIAL_COLLECTIONS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ReelContextType {
  reels: Reel[];
  collections: Collection[];
  favorites: Reel[];
  smartCategories: SmartCategory[];
  activeCategory: string | null;
  activeCollection: string | null;
  activeMediaType: MediaTypeFilter;
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  theme: "light" | "dark";
  toasts: ToastMessage[];
  isSaveModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isCreateCollectionModalOpen: boolean;
  lastDeletedReel: Reel | null;
  
  // Setters & Actions
  setActiveCategory: (cat: string | null) => void;
  setActiveCollection: (colId: string | null) => void;
  setActiveMediaType: (type: MediaTypeFilter) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleTheme: () => void;
  setIsSaveModalOpen: (open: boolean) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsCreateCollectionModalOpen: (open: boolean) => void;

  saveReel: (
    url: string,
    customDetails?: {
      creator?: string;
      caption?: string;
      category?: string;
      mediaType?: MediaType;
      audioTitle?: string;
      audioArtist?: string;
    }
  ) => Promise<void>;
  saveSampleMedia: (type: MediaType) => Promise<void>;
  toggleFavorite: (id: string) => void;
  deleteReel: (id: string) => void;
  undoDelete: () => void;
  updateNote: (id: string, note: string) => void;
  updateCategory: (id: string, category: string) => void;
  createCollection: (name: string, description?: string, icon?: string) => void;
  addReelToCollection: (reelId: string, collectionId: string) => void;
  generateAiSummary: (reelId: string) => void;
  refreshReelMetadata: (id: string) => Promise<Reel | null>;
  showToast: (title: string, subtitle?: string, action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: string) => void;
}

const ReelContext = createContext<ReelContextType | undefined>(undefined);

export function ReelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [reels, setReels] = useState<Reel[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<MediaTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [lastDeletedReel, setLastDeletedReel] = useState<Reel | null>(null);

  // Load user-specific data from localStorage whenever user changes
  useEffect(() => {
    if (user?.id) {
      const userReelsKey = `reeldash_reels_${user.id}`;
      const userColsKey = `reeldash_cols_${user.id}`;

      const savedReels = localStorage.getItem(userReelsKey);
      const savedCols = localStorage.getItem(userColsKey);

      let parsedReels: Reel[] = savedReels ? JSON.parse(savedReels) : INITIAL_REELS;
      if (!parsedReels || parsedReels.length === 0) {
        parsedReels = INITIAL_REELS;
      }

      let parsedCols: Collection[] = savedCols ? JSON.parse(savedCols) : INITIAL_COLLECTIONS;
      if (!parsedCols || parsedCols.length === 0) {
        parsedCols = INITIAL_COLLECTIONS;
      }

      // Clean out any sample oceans video or invalid mediaUrl from existing saved reels
      parsedReels = parsedReels.map((r) => {
        if (r.mediaUrl && (r.mediaUrl.includes("zencdn.net") || r.mediaUrl.includes("googleapis.com/gtv-videos-bucket"))) {
          return { ...r, mediaUrl: "" };
        }
        if (!r.mediaType) {
          if (r.instagramUrl?.includes("/audio/")) r.mediaType = "audio";
          else if (r.instagramUrl?.includes("/stories/")) r.mediaType = "story";
          else if (r.instagramUrl?.includes("/p/")) r.mediaType = "post";
          else r.mediaType = "reel";
        }
        return r;
      });

      setReels(parsedReels);
      setCollections(parsedCols);
    } else {
      setReels(INITIAL_REELS);
      setCollections(INITIAL_COLLECTIONS);
    }
  }, [user?.id]);

  const saveUserReels = (updatedReels: Reel[]) => {
    setReels(updatedReels);
    if (user?.id) {
      localStorage.setItem(`reeldash_reels_${user.id}`, JSON.stringify(updatedReels));
    }
  };

  const saveUserCollections = (updatedCols: Collection[]) => {
    setCollections(updatedCols);
    if (user?.id) {
      localStorage.setItem(`reeldash_cols_${user.id}`, JSON.stringify(updatedCols));
    }
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const showToast = (title: string, subtitle?: string, action?: { label: string; onClick: () => void }) => {
    const id = "toast-" + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, subtitle, action }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const categoryCounts: Record<string, number> = {};
  reels.forEach((r) => {
    if (r.category) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }
  });

  const smartCategories: SmartCategory[] = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    count: categoryCounts[cat],
  }));

  const favorites = reels.filter((r) => r.isFavorite);

  const toggleFavorite = (id: string) => {
    const updated = reels.map((r) => {
      if (r.id === id) {
        const nextFav = !r.isFavorite;
        if (nextFav) {
          showToast("♥ Added to Favorites");
        }
        return { ...r, isFavorite: nextFav };
      }
      return r;
    });
    saveUserReels(updated);
  };

  const deleteReel = (id: string) => {
    const target = reels.find((r) => r.id === id);
    if (target) {
      setLastDeletedReel(target);
      const updated = reels.filter((r) => r.id !== id);
      saveUserReels(updated);
      showToast("Reel removed", undefined, {
        label: "Undo",
        onClick: () => {
          saveUserReels([target, ...reels]);
          showToast("Reel restored");
        },
      });
    }
  };

  const undoDelete = () => {
    if (lastDeletedReel) {
      saveUserReels([lastDeletedReel, ...reels]);
      setLastDeletedReel(null);
      showToast("Reel restored");
    }
  };

  const updateNote = (id: string, note: string) => {
    const updated = reels.map((r) =>
      r.id === id ? { ...r, notes: note, updatedAt: new Date().toISOString() } : r
    );
    saveUserReels(updated);
    showToast("Note updated");
  };

  const updateCategory = (id: string, category: string) => {
    const updated = reels.map((r) =>
      r.id === id ? { ...r, category, updatedAt: new Date().toISOString() } : r
    );
    saveUserReels(updated);
    showToast(`Updated to ${category}`);
  };

  const createCollection = (name: string, description?: string, icon: string = "📁") => {
    const newCol: Collection = {
      id: "col-" + Math.random().toString(36).substr(2, 9),
      name,
      description,
      icon,
      reelIds: [],
      updatedAt: "Just now",
      reelCount: 0,
    };
    saveUserCollections([newCol, ...collections]);
    showToast(`✓ Added to ${name}`);
  };

  const addReelToCollection = (reelId: string, collectionId: string) => {
    const updatedCols = collections.map((col) => {
      if (col.id === collectionId && !col.reelIds.includes(reelId)) {
        return {
          ...col,
          reelIds: [...col.reelIds, reelId],
          reelCount: col.reelCount + 1,
          updatedAt: "Just now",
        };
      }
      return col;
    });
    const updatedReels = reels.map((r) => {
      if (r.id === reelId && !r.collections.includes(collectionId)) {
        return { ...r, collections: [...r.collections, collectionId] };
      }
      return r;
    });

    saveUserCollections(updatedCols);
    saveUserReels(updatedReels);

    const colName = collections.find((c) => c.id === collectionId)?.name || "Collection";
    showToast(`✓ Added to ${colName}`);
  };

  const refreshReelMetadata = async (id: string): Promise<Reel | null> => {
    const target = reels.find((r) => r.id === id);
    if (!target) return null;
    try {
      const res = await fetch("/api/reel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.instagramUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        let updatedItem: Reel | null = null;
        const updated = reels.map((r) => {
          if (r.id === id) {
            updatedItem = {
              ...r,
              creatorUsername: data.creatorUsername || r.creatorUsername,
              creatorFullName: data.creatorFullName || r.creatorFullName,
              caption: data.caption || r.caption,
              thumbnailUrl: data.thumbnailUrl || r.thumbnailUrl,
              mediaUrl: data.mediaUrl || r.mediaUrl || "",
              likes: data.likes || r.likes,
              commentsCount: data.commentsCount || r.commentsCount,
              category: data.category || r.category,
              hashtags: data.hashtags && data.hashtags.length > 0 ? data.hashtags : r.hashtags,
            };
            return updatedItem;
          }
          return r;
        });
        saveUserReels(updated);
        showToast("Metadata refreshed!");
        return updatedItem;
      }
    } catch (e) {
      console.warn("Refresh metadata error:", e);
    }
    return null;
  };

  // Multi-Media Instagram Metadata & Thumbnail Fetching
  const saveReel = async (
    url: string,
    customDetails?: {
      creator?: string;
      caption?: string;
      category?: string;
      mediaType?: MediaType;
      audioTitle?: string;
      audioArtist?: string;
      isCarousel?: boolean;
      carouselImages?: string[];
    }
  ) => {
    try {
      const res = await fetch("/api/reel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      const mediaType: MediaType = customDetails?.mediaType || data.mediaType || "reel";
      const creator = customDetails?.creator || data.creatorUsername || "instagram_creator";
      const creatorFullName = data.creatorFullName || creator;
      const category = customDetails?.category || data.category || (mediaType === "audio" ? "Music & Audio" : mediaType === "story" ? "Stories & Updates" : "General");
      const caption = customDetails?.caption || data.caption || `Instagram ${mediaType.toUpperCase()}: ${url}`;
      const thumbnailUrl = data.thumbnailUrl || (data.shortcode ? `/api/proxy-image?shortcode=${data.shortcode}` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80");
      const embedUrl = data.embedUrl || (data.shortcode ? `https://www.instagram.com/p/${data.shortcode}/embed/` : null);

      const typeLabel = mediaType === "audio" ? "Song / Audio" : mediaType === "post" ? (customDetails?.isCarousel || data.isCarousel ? "Carousel" : "Post") : mediaType === "story" ? "Story" : "Reel";

      const isCarousel = customDetails?.isCarousel !== undefined ? customDetails.isCarousel : (data.isCarousel || false);
      const carouselImages = customDetails?.carouselImages && customDetails.carouselImages.length > 0
        ? customDetails.carouselImages
        : data.carouselImages || (mediaType === "post" ? [thumbnailUrl] : undefined);

      const newReel: Reel = {
        id: `${mediaType}-` + Math.random().toString(36).substr(2, 9),
        userId: user?.id || "user-1",
        mediaType,
        instagramUrl: url,
        creatorUsername: creator,
        creatorFullName,
        creatorProfileUrl: `https://instagram.com/${creator}`,
        creatorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorFullName || creator)}&background=6366F1&color=fff`,
        thumbnailUrl,
        mediaUrl: data.mediaUrl || "",
        embedUrl: embedUrl || undefined,
        caption,
        category,
        subcategories: [category],
        collections: [],
        hashtags: data.hashtags && data.hashtags.length > 0 ? data.hashtags : [`#${category.toLowerCase().replace(/\s+/g, "")}`],
        likes: data.likes || "",
        commentsCount: data.commentsCount || "",
        isFavorite: false,
        duration: data.duration || (mediaType === "audio" ? "2:14" : mediaType === "story" ? "Story (24h)" : isCarousel ? `Carousel (${carouselImages?.length || 3})` : "Photo Post"),
        audioTitle: customDetails?.audioTitle || data.audioTitle || (mediaType === "audio" ? `${creatorFullName}'s Sound` : undefined),
        audioArtist: customDetails?.audioArtist || data.audioArtist || (mediaType === "audio" ? `${creatorFullName} • Original Audio` : undefined),
        audioUrl: data.audioUrl || (mediaType === "audio" ? "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3" : undefined),
        isCarousel,
        carouselImages,
        storyExpiresAt: mediaType === "story" ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastViewedAt: new Date().toISOString(),
        aiSummary: `AI Summary: ${typeLabel} from @${creator} covering key takeaways in ${category}.`,
        aiKeywords: [category, creator, mediaType],
        viewCount: 1,
      };

      saveUserReels([newReel, ...reels]);
      setIsSaveModalOpen(false);

      showToast(`✨ Saved @${creator}'s ${typeLabel}`, `Added to ${category}`);
    } catch (err) {
      console.error("Failed to save item with metadata:", err);
      const mediaType: MediaType = customDetails?.mediaType || (url.includes("/audio/") ? "audio" : url.includes("/stories/") ? "story" : url.includes("/p/") ? "post" : "reel");
      const shortcodeMatch = url.match(/(?:reel|p|audio|stories)\/([A-Za-z0-9_-]+)/);
      const shortcode = shortcodeMatch ? shortcodeMatch[1] : "";
      const fallbackItem: Reel = {
        id: `${mediaType}-` + Math.random().toString(36).substr(2, 9),
        userId: user?.id || "user-1",
        mediaType,
        instagramUrl: url,
        creatorUsername: customDetails?.creator || (shortcode ? `ig_${shortcode.substring(0, 6)}` : "instagram_creator"),
        creatorProfileUrl: "https://instagram.com",
        thumbnailUrl: shortcode ? `/api/proxy-image?shortcode=${shortcode}` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        mediaUrl: "",
        caption: customDetails?.caption || `Saved ${mediaType.toUpperCase()}: ${url}`,
        category: customDetails?.category || (mediaType === "audio" ? "Music & Audio" : "General"),
        subcategories: [],
        collections: [],
        hashtags: [`#${mediaType}`],
        isFavorite: false,
        duration: mediaType === "audio" ? "2:00" : mediaType === "story" ? "Story (24h)" : "0:30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 1,
      };
      saveUserReels([fallbackItem, ...reels]);
      setIsSaveModalOpen(false);
      showToast(`Saved ${mediaType} to library`);
    }
  };

  const saveSampleMedia = async (type: MediaType) => {
    if (type === "audio") {
      await saveReel("https://instagram.com/reels/audio/8839201923/", {
        creator: "neon_synth_records",
        caption: "Electric Dusk • Ambient chillwave beat with mellow retro synths for nocturnal focus.",
        category: "Music & Audio",
        mediaType: "audio",
        audioTitle: "Electric Dusk (Mellow Chillwave)",
        audioArtist: "Neon Synth Records • 92K Reels Used",
      });
    } else if (type === "post") {
      await saveReel("https://instagram.com/p/DF992810Xz/", {
        creator: "minimalist_interiors",
        caption: "Japandi Living Room Inspiration: Natural walnut wood, warm ambient paper lanterns, and tactile linen finishes. Swipe for floor plans. 🌿",
        category: "Design",
        mediaType: "post",
      });
    } else if (type === "story") {
      await saveReel("https://instagram.com/stories/mkbhd/392019482/", {
        creator: "mkbhd",
        caption: "First look on the camera rig testing setup in the studio today! 📸",
        category: "AI & Tech",
        mediaType: "story",
      });
    } else {
      await saveReel("https://instagram.com/reel/C89210382/", {
        creator: "clever_programmer",
        caption: "Top 3 React Server Components patterns every Next.js 14 developer should master in 2026.",
        category: "AI & Tech",
        mediaType: "reel",
      });
    }
  };

  const generateAiSummary = (reelId: string) => {
    const target = reels.find((r) => r.id === reelId);
    if (!target) return;

    showToast("✨ Generating AI Summary...");
    setTimeout(() => {
      const summary = `Generated Summary: Detailed breakdown of @${target.creatorUsername}'s ${target.mediaType || "content"}. Highlights 3 core practical takeaways for ${target.category}.`;
      const updated = reels.map((r) => (r.id === reelId ? { ...r, aiSummary: summary } : r));
      saveUserReels(updated);
      showToast("✓ AI Summary generated");
    }, 1200);
  };

  return (
    <ReelContext.Provider
      value={{
        reels,
        collections,
        favorites,
        smartCategories,
        activeCategory,
        activeCollection,
        activeMediaType,
        searchQuery,
        sortOption,
        viewMode,
        theme,
        toasts,
        isSaveModalOpen,
        isCommandPaletteOpen,
        isCreateCollectionModalOpen,
        lastDeletedReel,
        setActiveCategory,
        setActiveCollection,
        setActiveMediaType,
        setSearchQuery,
        setSortOption,
        setViewMode,
        toggleTheme,
        setIsSaveModalOpen,
        setIsCommandPaletteOpen,
        setIsCreateCollectionModalOpen,
        saveReel,
        saveSampleMedia,
        toggleFavorite,
        deleteReel,
        undoDelete,
        updateNote,
        updateCategory,
        createCollection,
        addReelToCollection,
        generateAiSummary,
        refreshReelMetadata,
        showToast,
        removeToast,
      }}
    >
      {children}
    </ReelContext.Provider>
  );
}

export function useReels() {
  const context = useContext(ReelContext);
  if (!context) {
    throw new Error("useReels must be used within a ReelProvider");
  }
  return context;
}

