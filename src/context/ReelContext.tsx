"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Reel, Collection, SmartCategory, SortOption, ViewMode, MediaType, MediaTypeFilter } from "@/types/reel";
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
      isCarousel?: boolean;
      carouselImages?: string[];
    }
  ) => Promise<void>;
  toggleFavorite: (id: string) => void;
  deleteReel: (id: string) => void;
  undoDelete: () => void;
  updateNote: (id: string, note: string) => void;
  updateCategory: (id: string, category: string) => void;
  createCollection: (name: string, description?: string, icon?: string) => void;
  deleteCollection: (id: string) => void;
  addReelToCollection: (reelId: string, collectionId: string) => void;
  removeReelFromCollection: (reelId: string, collectionId: string) => void;
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
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [lastDeletedReel, setLastDeletedReel] = useState<Reel | null>(null);

  // Initialize theme from system or storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("reeldash_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("reeldash_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return nextTheme;
    });
  };

  // Load user-specific data from localStorage or API
  useEffect(() => {
    if (user?.id) {
      const userReelsKey = `reeldash_reels_${user.id}`;
      const userColsKey = `reeldash_cols_${user.id}`;

      const savedReels = localStorage.getItem(userReelsKey);
      const savedCols = localStorage.getItem(userColsKey);

      let parsedReels: Reel[] = [];
      if (savedReels) {
        try {
          parsedReels = JSON.parse(savedReels);
          if (!Array.isArray(parsedReels)) parsedReels = [];
        } catch {
          parsedReels = [];
        }
      }

      let parsedCols: Collection[] = [];
      if (savedCols) {
        try {
          parsedCols = JSON.parse(savedCols);
          if (!Array.isArray(parsedCols)) parsedCols = [];
        } catch {
          parsedCols = [];
        }
      }

      // Purge any legacy mock or demo items
      parsedReels = parsedReels.filter(
        (r) => r && r.userId !== "usr-demo" && !r.id?.startsWith("mock-") && !r.id?.startsWith("sample-")
      );

      setReels(parsedReels);
      setCollections(parsedCols);
    } else {
      setReels([]);
      setCollections([]);
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

  const showToast = (title: string, subtitle?: string, action?: { label: string; onClick: () => void }) => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
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
          showToast("Added to Favorites");
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
    showToast(`Updated category to ${category}`);
  };

  const createCollection = (name: string, description?: string, icon: string = "📁") => {
    const newCol: Collection = {
      id: "col-" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      description,
      icon,
      reelIds: [],
      updatedAt: "Just now",
      reelCount: 0,
    };
    saveUserCollections([newCol, ...collections]);
    showToast(`Created collection "${name}"`);
  };

  const deleteCollection = (id: string) => {
    const updatedCols = collections.filter((c) => c.id !== id);
    saveUserCollections(updatedCols);
    showToast("Collection deleted");
  };

  const addReelToCollection = (reelId: string, collectionId: string) => {
    const targetCol = collections.find((c) => c.id === collectionId);
    if (!targetCol) return;

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
      if (r.id === reelId && !r.collections?.includes(collectionId)) {
        return { ...r, collections: [...(r.collections || []), collectionId] };
      }
      return r;
    });

    saveUserCollections(updatedCols);
    saveUserReels(updatedReels);
    showToast(`Added to ${targetCol.name}`);
  };

  const removeReelFromCollection = (reelId: string, collectionId: string) => {
    const updatedCols = collections.map((col) => {
      if (col.id === collectionId) {
        return {
          ...col,
          reelIds: col.reelIds.filter((id) => id !== reelId),
          reelCount: Math.max(0, col.reelCount - 1),
          updatedAt: "Just now",
        };
      }
      return col;
    });

    const updatedReels = reels.map((r) => {
      if (r.id === reelId) {
        return { ...r, collections: (r.collections || []).filter((id) => id !== collectionId) };
      }
      return r;
    });

    saveUserCollections(updatedCols);
    saveUserReels(updatedReels);
    showToast("Removed from collection");
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
        showToast("Metadata updated");
        return updatedItem;
      }
    } catch (e) {
      console.warn("Refresh metadata error:", e);
    }
    return null;
  };

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
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    try {
      const res = await fetch("/api/reel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await res.json();

      const mediaType: MediaType = customDetails?.mediaType || data.mediaType || "reel";
      const creator = customDetails?.creator || data.creatorUsername || "instagram_creator";
      const creatorFullName = data.creatorFullName || creator;
      const category = customDetails?.category || data.category || (mediaType === "audio" ? "Music & Audio" : mediaType === "story" ? "Stories & Updates" : "General");
      const caption = customDetails?.caption || data.caption || `Instagram ${mediaType.toUpperCase()}: ${cleanUrl}`;
      const thumbnailUrl = data.thumbnailUrl || (data.shortcode ? `/api/proxy-image?shortcode=${data.shortcode}` : "");
      const embedUrl = data.embedUrl || (data.shortcode ? `https://www.instagram.com/p/${data.shortcode}/embed/` : null);

      const typeLabel = mediaType === "audio" ? "Audio" : mediaType === "post" ? "Post" : mediaType === "story" ? "Story" : "Reel";
      const isCarousel = customDetails?.isCarousel !== undefined ? customDetails.isCarousel : (data.isCarousel || false);
      const carouselImages = customDetails?.carouselImages || data.carouselImages;

      const newReel: Reel = {
        id: `${mediaType}-` + Math.random().toString(36).substring(2, 9),
        userId: user?.id || "user-1",
        mediaType,
        instagramUrl: cleanUrl,
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
        duration: data.duration || (mediaType === "audio" ? "Audio" : mediaType === "story" ? "Story" : "0:30"),
        audioTitle: customDetails?.audioTitle || data.audioTitle,
        audioArtist: customDetails?.audioArtist || data.audioArtist,
        isCarousel,
        carouselImages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastViewedAt: new Date().toISOString(),
        aiSummary: data.caption ? `Summary: @${creator}'s ${typeLabel} discussing ${category}.` : undefined,
        aiKeywords: [category, creator, mediaType],
        viewCount: 1,
      };

      saveUserReels([newReel, ...reels]);
      setIsSaveModalOpen(false);
      showToast(`Saved @${creator}'s ${typeLabel}`, `Added to ${category}`);
    } catch (err) {
      console.error("Failed to save reel with metadata:", err);
      const shortcodeMatch = cleanUrl.match(/(?:reel|p|audio|stories)\/([A-Za-z0-9_-]+)/);
      const shortcode = shortcodeMatch ? shortcodeMatch[1] : "";
      const mediaType: MediaType = cleanUrl.includes("/audio/") ? "audio" : cleanUrl.includes("/stories/") ? "story" : cleanUrl.includes("/p/") ? "post" : "reel";

      const fallbackItem: Reel = {
        id: `${mediaType}-` + Math.random().toString(36).substring(2, 9),
        userId: user?.id || "user-1",
        mediaType,
        instagramUrl: cleanUrl,
        creatorUsername: shortcode ? `ig_${shortcode.substring(0, 6)}` : "creator",
        creatorProfileUrl: "https://instagram.com",
        thumbnailUrl: shortcode ? `/api/proxy-image?shortcode=${shortcode}` : "",
        mediaUrl: "",
        caption: `Instagram ${mediaType.toUpperCase()}: ${cleanUrl}`,
        category: "General",
        subcategories: [],
        collections: [],
        hashtags: [],
        isFavorite: false,
        duration: "0:30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 1,
      };
      saveUserReels([fallbackItem, ...reels]);
      setIsSaveModalOpen(false);
      showToast(`Saved ${mediaType} to library`);
    }
  };

  const generateAiSummary = (reelId: string) => {
    const target = reels.find((r) => r.id === reelId);
    if (!target) return;

    showToast("Generating summary...");
    setTimeout(() => {
      const summary = `Key Takeaways: High-value insights from @${target.creatorUsername}'s ${target.mediaType || "content"} in ${target.category}.`;
      const updated = reels.map((r) => (r.id === reelId ? { ...r, aiSummary: summary } : r));
      saveUserReels(updated);
      showToast("Summary ready");
    }, 1000);
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
        toggleFavorite,
        deleteReel,
        undoDelete,
        updateNote,
        updateCategory,
        createCollection,
        deleteCollection,
        addReelToCollection,
        removeReelFromCollection,
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
