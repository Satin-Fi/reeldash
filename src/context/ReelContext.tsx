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

  saveReel: (url: string, customDetails?: { creator?: string; caption?: string; category?: string }) => Promise<void>;
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

      let parsedReels: Reel[] = savedReels ? JSON.parse(savedReels) : [];

      // Clean out any sample oceans video or invalid mediaUrl from existing saved reels
      parsedReels = parsedReels.map((r) => {
        if (r.mediaUrl && (r.mediaUrl.includes("zencdn.net") || r.mediaUrl.includes("googleapis.com"))) {
          return { ...r, mediaUrl: "" };
        }
        return r;
      });

      setReels(parsedReels);
      setCollections(savedCols ? JSON.parse(savedCols) : []);

      // Auto-upgrade any reels that need fresh metadata or direct video URL
      const needsUpgrade = parsedReels.some(
        (r) =>
          r.creatorUsername === "instagram_creator" ||
          r.creatorUsername.startsWith("reels_") ||
          !r.mediaUrl ||
          !r.likes ||
          r.thumbnailUrl.includes("unsplash.com")
      );

      if (needsUpgrade) {
        (async () => {
          const upgraded = await Promise.all(
            parsedReels.map(async (r) => {
              if (
                r.creatorUsername === "instagram_creator" ||
                r.creatorUsername.startsWith("reels_") ||
                !r.mediaUrl ||
                !r.likes ||
                r.thumbnailUrl.includes("unsplash.com")
              ) {
                try {
                  const res = await fetch("/api/reel-info", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: r.instagramUrl }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    return {
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
                  }
                } catch (e) {
                  console.warn("Auto-upgrade reel notice:", e);
                }
              }
              return r;
            })
          );
          setReels(upgraded);
          localStorage.setItem(userReelsKey, JSON.stringify(upgraded));
        })();
      }
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

  // REAL Instagram Metadata & Thumbnail Fetching
  const saveReel = async (
    url: string,
    customDetails?: { creator?: string; caption?: string; category?: string }
  ) => {
    try {
      const res = await fetch("/api/reel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      const creator = customDetails?.creator || data.creatorUsername || "instagram_creator";
      const creatorFullName = data.creatorFullName || creator;
      const category = customDetails?.category || data.category || "General";
      const caption = customDetails?.caption || data.caption || `Instagram Reel: ${url}`;
      const thumbnailUrl = data.thumbnailUrl || (data.shortcode ? `/api/proxy-image?shortcode=${data.shortcode}` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80");
      const embedUrl = data.embedUrl || (data.shortcode ? `https://www.instagram.com/p/${data.shortcode}/embed/` : null);

      const newReel: Reel = {
        id: "reel-" + Math.random().toString(36).substr(2, 9),
        userId: user?.id || "user-1",
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
      const shortcodeMatch = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
      const shortcode = shortcodeMatch ? shortcodeMatch[1] : "";
      const fallbackReel: Reel = {
        id: "reel-" + Math.random().toString(36).substr(2, 9),
        userId: user?.id || "user-1",
        instagramUrl: url,
        creatorUsername: customDetails?.creator || (shortcode ? `reels_${shortcode.substring(0, 6)}` : "instagram_creator"),
        creatorProfileUrl: "https://instagram.com",
        thumbnailUrl: shortcode ? `/api/proxy-image?shortcode=${shortcode}` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        mediaUrl: "",
        caption: customDetails?.caption || `Saved Reel: ${url}`,
        category: customDetails?.category || "General",
        subcategories: [],
        collections: [],
        hashtags: ["#reels"],
        isFavorite: false,
        duration: "0:30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 1,
      };
      saveUserReels([fallbackReel, ...reels]);
      setIsSaveModalOpen(false);
      showToast("Saved Reel to library");
    }
  };

  const generateAiSummary = (reelId: string) => {
    const target = reels.find((r) => r.id === reelId);
    if (!target) return;

    showToast("✨ Generating AI Summary...");
    setTimeout(() => {
      const summary = `Generated Summary: Detailed breakdown of @${target.creatorUsername}'s video. Highlights 3 core practical takeaways for ${target.category}.`;
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
