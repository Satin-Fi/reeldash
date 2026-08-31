"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Reel, Collection, SmartCategory, SortOption, ViewMode, MediaType, MediaTypeFilter } from "@/types/reel";
import { useAuth } from "@/context/AuthContext";
import { parseCategoryCommand } from "@/lib/parseCategory";

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
  selectedInstagramAccount: string | null;
  searchQuery: string;
  sortOption: SortOption;
  viewMode: ViewMode;
  theme: "light" | "dark";
  toasts: ToastMessage[];
  isSaveModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isCreateCollectionModalOpen: boolean;
  lastDeletedReel: Reel | null;
  recycleBin: Reel[];
  
  // Setters & Actions
  setActiveCategory: (cat: string | null) => void;
  setActiveCollection: (colId: string | null) => void;
  setActiveMediaType: (type: MediaTypeFilter) => void;
  setSelectedInstagramAccount: (handle: string | null) => void;
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
      creatorFullName?: string;
      creatorAvatar?: string;
      thumbnailUrl?: string;
      caption?: string;
      category?: string;
      mediaType?: MediaType;
      audioTitle?: string;
      audioArtist?: string;
      isCarousel?: boolean;
      carouselImages?: string[];
      likes?: string;
      commentsCount?: string;
      duration?: string;
    }
  ) => Promise<void>;
  toggleFavorite: (id: string) => void;
  deleteReel: (id: string) => void;
  undoDelete: () => void;
  restoreReel: (id: string) => Promise<void>;
  permanentlyDeleteReel: (id: string) => Promise<void>;
  emptyRecycleBin: () => Promise<void>;
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
  const [selectedInstagramAccount, setSelectedInstagramAccount] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [lastDeletedReel, setLastDeletedReel] = useState<Reel | null>(null);
  const [recycleBin, setRecycleBin] = useState<Reel[]>([]);

  // Initialize theme
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

  // Load user data
  useEffect(() => {
    if (user?.id) {
      const userReelsKey = `reeldash_reels_${user.id}`;
      const userColsKey = `reeldash_cols_${user.id}`;
      const userTrashKey = `reeldash_trash_${user.id}`;

      const savedReels = localStorage.getItem(userReelsKey);
      const savedCols = localStorage.getItem(userColsKey);
      const savedTrash = localStorage.getItem(userTrashKey);

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

      let parsedTrash: Reel[] = [];
      if (savedTrash) {
        try {
          parsedTrash = JSON.parse(savedTrash);
          if (!Array.isArray(parsedTrash)) parsedTrash = [];
        } catch {
          parsedTrash = [];
        }
      }
      setRecycleBin(parsedTrash);

      parsedReels = parsedReels
        .filter((r) => r && r.userId !== "usr-demo" && !r.id?.startsWith("mock-") && !r.id?.startsWith("sample-"))
        .map((r) => {
          let thumb = r.thumbnailUrl;
          const sc = r.instagramUrl?.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/)?.[1];
          if (!thumb || thumb.includes("unsplash.com") || thumb.includes("ui-avatars.com") || thumb.includes("username=")) {
            thumb = sc ? `/api/proxy-image?shortcode=${sc}` : thumb;
          }
          let avatar = r.creatorAvatar;
          if (!avatar || avatar.includes("ui-avatars.com")) {
            avatar = `/api/proxy-image?username=${encodeURIComponent(r.creatorUsername || "creator")}`;
          }
          return {
            ...r,
            thumbnailUrl: thumb,
            creatorAvatar: avatar,
          };
        });

      // Filter out anything in recycleBin
      const trashIds = new Set(parsedTrash.map((t) => t.id));
      const cleanReels = parsedReels.filter((r) => !trashIds.has(r.id));

      setReels(cleanReels);
      setCollections(parsedCols);

      // Fetch live reels from Supabase database (including DM-saved reels & handle filter)
      const accountParam = selectedInstagramAccount && selectedInstagramAccount !== "all" 
        ? `&account=${encodeURIComponent(selectedInstagramAccount)}` 
        : "";

      fetch(`/api/reels?userId=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.instagramUsername || "")}${accountParam}`)
        .then((res) => (res.ok ? res.json() : { reels: [] }))
        .then((data) => {
          if (data.reels && Array.isArray(data.reels) && data.reels.length > 0) {
            const dbReels: Reel[] = data.reels
              .filter((dbR: any) => !trashIds.has(dbR.id))
              .map((dbR: any) => {
                const sc = dbR.shortcode || dbR.url?.match(/(?:reel|reels|p|audio|stories)\/([A-Za-z0-9_-]+)/)?.[1];
                return {
                  id: dbR.id,
                  userId: user.id,
                  instagramUrl: dbR.url,
                  instagramUsername: dbR.instagram_username || "",
                  instagramAccountId: dbR.instagram_account_id || "",
                  thumbnailUrl: dbR.thumbnail_url || (sc ? `/api/proxy-image?shortcode=${sc}` : ""),
                  caption: dbR.caption || "Saved Reel",
                  creatorUsername: dbR.creator_handle || "creator",
                  creatorFullName: dbR.creator_name || "Instagram Creator",
                  creatorAvatar: dbR.creator_avatar || `/api/proxy-image?username=${encodeURIComponent(dbR.creator_handle || "creator")}`,
                  category: dbR.category || "General",
                  tags: Array.isArray(dbR.tags) ? dbR.tags : [],
                  notes: dbR.note || "",
                  isFavorite: !!dbR.is_favorite,
                  mediaType: dbR.media_type || "reel",
                  duration: dbR.duration || "0:15",
                  likes: dbR.likes_count || "",
                  createdAt: dbR.created_at || new Date().toISOString(),
                };
              });

            setReels(dbReels);
          } else if (selectedInstagramAccount && selectedInstagramAccount !== "all") {
            setReels([]);
          }
        })
        .catch((err) => console.warn("[ReelContext] fetch reels notice:", err));
    } else {
      setReels([]);
      setCollections([]);
      setRecycleBin([]);
    }
  }, [user?.id, user?.instagramUsername, selectedInstagramAccount]);

  const saveUserReels = (updatedReels: Reel[]) => {
    setReels(updatedReels);
    if (user?.id) {
      localStorage.setItem(`reeldash_reels_${user.id}`, JSON.stringify(updatedReels));
    }
  };

  const saveUserTrash = (updatedTrash: Reel[]) => {
    setRecycleBin(updatedTrash);
    if (user?.id) {
      localStorage.setItem(`reeldash_trash_${user.id}`, JSON.stringify(updatedTrash));
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
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const categoryCounts: Record<string, number> = {};
  reels.forEach((r) => {
    const cats = new Set<string>();
    if (r.category && r.category.trim()) {
      cats.add(r.category.trim());
    }
    if (Array.isArray(r.tags)) {
      r.tags.forEach((t) => {
        if (t && t.trim()) {
          const formatted = t.trim().charAt(0).toUpperCase() + t.trim().slice(1);
          cats.add(formatted);
        }
      });
    }
    if (Array.isArray(r.subcategories)) {
      r.subcategories.forEach((s) => {
        if (s && s.trim()) {
          const formatted = s.trim().charAt(0).toUpperCase() + s.trim().slice(1);
          cats.add(formatted);
        }
      });
    }
    cats.forEach((c) => {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    });
  });

  const smartCategories: SmartCategory[] = Object.keys(categoryCounts)
    .sort((a, b) => categoryCounts[b] - categoryCounts[a])
    .map((cat) => ({
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
      const deletedItem: Reel = {
        ...target,
        deletedAt: new Date().toISOString(),
      };
      setLastDeletedReel(target);
      const updatedReels = reels.filter((r) => r.id !== id);
      const updatedTrash = [deletedItem, ...recycleBin.filter((r) => r.id !== id)];
      saveUserReels(updatedReels);
      saveUserTrash(updatedTrash);

      // Permanently remove row from active DB or soft-delete
      fetch(`/api/reels?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});

      showToast("Moved to Recycle Bin", undefined, {
        label: "Undo",
        onClick: () => {
          restoreReel(id);
        },
      });
    }
  };

  const undoDelete = () => {
    if (lastDeletedReel) {
      restoreReel(lastDeletedReel.id);
      setLastDeletedReel(null);
    }
  };

  const restoreReel = async (id: string) => {
    const target = recycleBin.find((r) => r.id === id) || lastDeletedReel;
    if (target) {
      const restoredItem: Reel = {
        ...target,
        deletedAt: undefined,
      };
      const updatedTrash = recycleBin.filter((r) => r.id !== id);
      const updatedReels = [restoredItem, ...reels.filter((r) => r.id !== id)];
      saveUserReels(updatedReels);
      saveUserTrash(updatedTrash);

      // Re-save to DB so reload keeps it
      try {
        fetch("/api/reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: target.instagramUrl,
            userId: user?.id,
            category: target.category,
            notes: target.notes,
            isFavorite: target.isFavorite,
          }),
        }).catch(() => {});
      } catch {}

      showToast("Reel restored to library");
    }
  };

  const permanentlyDeleteReel = async (id: string) => {
    const updatedTrash = recycleBin.filter((r) => r.id !== id);
    saveUserTrash(updatedTrash);
    try {
      fetch(`/api/reels?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    } catch {}
    showToast("Reel permanently deleted");
  };

  const emptyRecycleBin = async () => {
    const ids = recycleBin.map((r) => r.id);
    saveUserTrash([]);
    for (const id of ids) {
      fetch(`/api/reels?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    }
    showToast("Recycle bin emptied");
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

  const createCollection = (name: string, description?: string, icon: string = "") => {
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
              creatorAvatar: data.creatorAvatar || r.creatorAvatar,
              caption: data.caption || r.caption,
              thumbnailUrl: data.thumbnailUrl || r.thumbnailUrl,
              mediaUrl: data.mediaUrl || r.mediaUrl || "",
              audioTitle: data.audioTitle || r.audioTitle,
              audioArtist: data.audioArtist || r.audioArtist,
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
        showToast("Metadata refreshed");
        return updatedItem;
      }
    } catch (e) {
      console.warn("Refresh metadata error:", e);
    }
    return null;
  };

  // ─── High-Speed Optimistic Save ────────────────────────────────────
  const saveReel = async (
    url: string,
    customDetails?: {
      creator?: string;
      creatorFullName?: string;
      creatorAvatar?: string;
      thumbnailUrl?: string;
      caption?: string;
      category?: string;
      mediaType?: MediaType;
      audioTitle?: string;
      audioArtist?: string;
      isCarousel?: boolean;
      carouselImages?: string[];
      likes?: string;
      commentsCount?: string;
      duration?: string;
    }
  ) => {
    // Parse /<category> shortcuts and notes from input string
    const parsedCmd = parseCategoryCommand(url);
    const cleanUrl = (parsedCmd.cleanUrl || parsedCmd.cleanText || url).trim();
    if (!cleanUrl) return;

    // Duplicate check
    const cleanNormalized = cleanUrl.replace(/\/$/, "");
    const alreadyExists = reels.find(
      (r) => r.instagramUrl.replace(/\/$/, "") === cleanNormalized
    );
    if (alreadyExists) {
      showToast("Already in your library", `@${alreadyExists.creatorUsername}'s Reel`);
      setIsSaveModalOpen(false);
      return;
    }

    const audioIdMatch = cleanUrl.match(/\/reels\/audio\/(\d+)/);
    const shortcodeMatch = audioIdMatch || cleanUrl.match(/\/(?:reel|p|stories)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : `sc_${Date.now().toString(36)}`;
    const mediaType: MediaType =
      customDetails?.mediaType ||
      (cleanUrl.includes("/audio/")
        ? "audio"
        : cleanUrl.includes("/stories/")
        ? "story"
        : cleanUrl.includes("/p/")
        ? "post"
        : "reel");

    const tempId = `${mediaType}-${Date.now()}`;
    const initialCreator = customDetails?.creator || (shortcode ? `ig_${shortcode.substring(0, 6)}` : "creator");
    const primaryCategory = parsedCmd.primaryCategory || customDetails?.category;
    const allCategories = parsedCmd.categories.length > 0
      ? parsedCmd.categories
      : customDetails?.category
      ? [customDetails.category]
      : [];
    const targetCategory = primaryCategory || (mediaType === "audio" ? "Music & Audio" : "General");
    const initialAvatar =
      customDetails?.creatorAvatar || `/api/proxy-image?username=${encodeURIComponent(initialCreator)}`;
    const initialThumbnail =
      customDetails?.thumbnailUrl || (shortcode ? `/api/proxy-image?shortcode=${shortcode}` : "");

    // Check if category already existed for user
    const isCategoryAlreadyPresent = reels.some(
      (r) => r.category && r.category.toLowerCase() === targetCategory.toLowerCase()
    );

    // 1. Optimistic Instant UI Update (0ms)
    const optimisticReel: Reel = {
      id: tempId,
      userId: user?.id || "user-1",
      mediaType,
      instagramUrl: cleanUrl,
      creatorUsername: initialCreator,
      creatorFullName: customDetails?.creatorFullName || initialCreator.charAt(0).toUpperCase() + initialCreator.slice(1),
      creatorProfileUrl: `https://instagram.com/${initialCreator}`,
      creatorAvatar: initialAvatar,
      thumbnailUrl: initialThumbnail,
      mediaUrl: "",
      embedUrl: `https://www.instagram.com/p/${shortcode}/embed/`,
      caption: customDetails?.caption || `Instagram ${mediaType.toUpperCase()}: ${cleanUrl}`,
      category: targetCategory,
      subcategories: allCategories.length > 0 ? allCategories : [targetCategory],
      collections: [],
      hashtags: allCategories.map((c) => c.toLowerCase()),
      notes: parsedCmd.note || undefined,
      isFavorite: false,
      duration: customDetails?.duration || (mediaType === "audio" ? "" : customDetails?.isCarousel ? `Carousel (${customDetails?.carouselImages?.length || 1})` : ""),
      audioTitle: customDetails?.audioTitle,
      audioArtist: customDetails?.audioArtist,
      isCarousel: customDetails?.isCarousel,
      carouselImages: customDetails?.carouselImages,
      likes: customDetails?.likes,
      commentsCount: customDetails?.commentsCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastViewedAt: new Date().toISOString(),
      viewCount: 1,
    };

    // Prepend immediately
    saveUserReels([optimisticReel, ...reels]);
    setIsSaveModalOpen(false);

    if (allCategories.length > 0) {
      showToast(
        !isCategoryAlreadyPresent ? `Created "${targetCategory}" & Saved` : `Saved to ${targetCategory}`,
        `@${initialCreator}'s ${mediaType}`
      );
    } else {
      showToast(`Saved to Library`, `@${initialCreator}'s ${mediaType}`);
    }

    // 2. Parallel Fast Metadata Enrichment (< 1s)
    try {
      const res = await fetch("/api/reel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        const finalCreator =
          (data.creatorUsername && !data.creatorUsername.startsWith("ig_") && data.creatorUsername !== "instagram_audio" && data.creatorUsername !== "instagram_creator")
            ? data.creatorUsername
            : customDetails?.creator || initialCreator;
        const finalFullName = data.creatorFullName || customDetails?.creatorFullName || finalCreator;
        const finalCategory = customDetails?.category || primaryCategory || data.category || targetCategory;

        setReels((prev) => {
          const updated = prev.map((r) => {
            if (r.id === tempId) {
              return {
                ...r,
                creatorUsername: finalCreator,
                creatorFullName: finalFullName,
                creatorAvatar: data.creatorAvatar || customDetails?.creatorAvatar || r.creatorAvatar,
                thumbnailUrl: data.thumbnailUrl || customDetails?.thumbnailUrl || r.thumbnailUrl,
                mediaUrl: data.mediaUrl || r.mediaUrl,
                embedUrl: data.embedUrl || r.embedUrl,
                caption: customDetails?.caption || data.caption || r.caption,
                category: finalCategory,
                likes: customDetails?.likes || data.likes || r.likes,
                commentsCount: customDetails?.commentsCount || data.commentsCount || r.commentsCount,
                duration: customDetails?.duration || data.duration || r.duration,
                audioTitle: customDetails?.audioTitle || data.audioTitle,
                audioArtist: customDetails?.audioArtist || data.audioArtist,
                isCarousel: customDetails?.isCarousel ?? r.isCarousel,
                carouselImages: customDetails?.carouselImages ?? r.carouselImages,
                aiSummary: data.aiSummary || r.aiSummary,
                hashtags: data.hashtags && data.hashtags.length > 0 ? data.hashtags : r.hashtags,
              };
            }
            return r;
          });
          if (user?.id) {
            localStorage.setItem(`reeldash_reels_${user.id}`, JSON.stringify(updated));
          }
          return updated;
        });
      }
    } catch (e) {
      console.warn("Background enrichment notice:", e);
    }
  };

  const generateAiSummary = (reelId: string) => {
    const target = reels.find((r) => r.id === reelId);
    if (!target) return;

    showToast("Extracting key takeaways...");
    setTimeout(() => {
      const cleanCaption = (target.caption || "")
        .replace(/#[a-zA-Z0-9_]+/g, "")
        .replace(/@[a-zA-Z0-9_.]+/g, "")
        .trim();

      let summary = "";
      if (cleanCaption && cleanCaption.length > 20) {
        const sentences = cleanCaption
          .split(/[.\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 8);

        if (sentences.length > 0) {
          summary = sentences.slice(0, 3).map((s) => `• ${s}`).join("\n");
        } else {
          summary = `• ${cleanCaption}`;
        }
      } else {
        summary = `• ${target.category || "General"} content by @${target.creatorUsername}`;
      }

      const updated = reels.map((r) => (r.id === reelId ? { ...r, aiSummary: summary } : r));
      saveUserReels(updated);
      showToast("Takeaways generated");
    }, 600);
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
        selectedInstagramAccount,
        searchQuery,
        sortOption,
        viewMode,
        theme,
        toasts,
        isSaveModalOpen,
        isCommandPaletteOpen,
        isCreateCollectionModalOpen,
        lastDeletedReel,
        recycleBin,
        setActiveCategory,
        setActiveCollection,
        setActiveMediaType,
        setSelectedInstagramAccount,
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
        restoreReel,
        permanentlyDeleteReel,
        emptyRecycleBin,
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
