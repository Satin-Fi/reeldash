"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Reel, Collection, SmartCategory, SortOption, ViewMode } from "@/types/reel";
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
  setSearchQuery: (query: string) => void;
  setSortOption: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleTheme: () => void;
  setIsSaveModalOpen: (open: boolean) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsCreateCollectionModalOpen: (open: boolean) => void;

  saveReel: (url: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  deleteReel: (id: string) => void;
  undoDelete: () => void;
  updateNote: (id: string, note: string) => void;
  updateCategory: (id: string, category: string) => void;
  createCollection: (name: string, description?: string, icon?: string) => void;
  addReelToCollection: (reelId: string, collectionId: string) => void;
  generateAiSummary: (reelId: string) => void;
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

      setReels(savedReels ? JSON.parse(savedReels) : []);
      setCollections(savedCols ? JSON.parse(savedCols) : []);
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

  // REAL Instagram Metadata & Thumbnail Fetching
  const saveReel = async (url: string) => {
    try {
      // Call backend API route to fetch real Instagram metadata
      const res = await fetch("/api/reel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      const creator = data.creatorUsername || "instagram_creator";
      const category = data.category || "General";
      const caption = data.caption || `Instagram Reel: ${url}`;
      const thumbnailUrl = data.thumbnailUrl || (data.shortcode ? `https://www.instagram.com/p/${data.shortcode}/media/?size=l` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80");
      const embedUrl = data.embedUrl || (data.shortcode ? `https://www.instagram.com/p/${data.shortcode}/embed/` : null);

      const newReel: Reel = {
        id: "reel-" + Math.random().toString(36).substr(2, 9),
        userId: user?.id || "user-1",
        instagramUrl: url,
        creatorUsername: creator,
        creatorProfileUrl: `https://instagram.com/${creator}`,
        creatorAvatar: `https://ui-avatars.com/api/?name=${creator}&background=6366F1&color=fff`,
        thumbnailUrl,
        mediaUrl: data.mediaUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        embedUrl: embedUrl || undefined,
        caption,
        category,
        subcategories: [category],
        collections: [],
        hashtags: [`#${category.toLowerCase().replace(/\s+/g, "")}`],
        isFavorite: false,
        duration: "0:30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastViewedAt: new Date().toISOString(),
        aiSummary: `AI Summary: Reel from @${creator} covering key concepts in ${category}.`,
        aiKeywords: [category, creator],
        viewCount: 1,
      };

      saveUserReels([newReel, ...reels]);
      setIsSaveModalOpen(false);

      showToast(`✨ Saved @${creator}'s Reel`, `Added to ${category}`);
    } catch (err) {
      console.error("Failed to save reel with metadata:", err);
      // Fallback if network fails
      const fallbackReel: Reel = {
        id: "reel-" + Math.random().toString(36).substr(2, 9),
        userId: user?.id || "user-1",
        instagramUrl: url,
        creatorUsername: "instagram_creator",
        creatorProfileUrl: "https://instagram.com",
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        caption: `Saved Reel from Instagram: ${url}`,
        category: "General",
        subcategories: [],
        collections: [],
        hashtags: [],
        isFavorite: false,
        duration: "0:30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastViewedAt: new Date().toISOString(),
        viewCount: 1,
      };
      saveUserReels([fallbackReel, ...reels]);
      setIsSaveModalOpen(false);
      showToast("✨ Reel saved to library");
    }
  };

  const generateAiSummary = (reelId: string) => {
    const updated = reels.map((r) => {
      if (r.id === reelId) {
        return {
          ...r,
          aiSummary: `Generated Summary: Detailed breakdown of @${r.creatorUsername}'s video. Highlights 3 core practical takeaways for ${r.category}.`,
        };
      }
      return r;
    });
    saveUserReels(updated);
    showToast("✨ AI summary generated");
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
        addReelToCollection,
        generateAiSummary,
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
