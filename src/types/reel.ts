export interface Reel {
  id: string;
  userId: string;
  instagramUrl: string;
  creatorUsername: string;
  creatorFullName?: string;
  creatorProfileUrl: string;
  creatorAvatar?: string;
  thumbnailUrl: string;
  mediaUrl?: string;
  embedUrl?: string;
  caption: string;
  category: string;
  subcategories: string[];
  collections: string[];
  hashtags: string[];
  likes?: string;
  commentsCount?: string;
  notes?: string;
  isFavorite: boolean;
  duration: string;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
  aiSummary?: string;
  aiKeywords?: string[];
  viewCount?: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  reelIds: string[];
  updatedAt: string;
  reelCount: number;
}

export interface SmartCategory {
  name: string;
  count: number;
}

export type SortOption = "newest" | "oldest" | "recently_viewed" | "most_viewed" | "creator";

export type ViewMode = "grid" | "compact";
