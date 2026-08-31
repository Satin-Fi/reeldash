export type MediaType = "reel" | "post" | "audio" | "story";

export interface CarouselSlide {
  id?: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  normalizedName: string;
  slug: string;
  icon?: string;
  description?: string;
  source: "user" | "dm" | "ai" | "system";
  reelCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reel {
  id: string;
  userId: string;
  shortcode?: string;
  instagramUrl: string;
  mediaType?: MediaType; // "reel" | "post" | "audio" | "story"
  creatorUsername: string;
  creatorFullName?: string;
  creatorProfileUrl: string;
  creatorAvatar?: string;
  thumbnailUrl: string;
  mediaUrl?: string;
  embedUrl?: string;
  caption: string;
  category: string; // Primary category name for display
  categories?: string[]; // All assigned categories
  categoryIds?: string[]; // All assigned category IDs
  subcategories: string[];
  collections: string[];
  hashtags: string[]; // Instagram post hashtags from caption (e.g. ["#fitness", "#fyp"])
  tags?: string[]; // Backward-compatibility alias
  aiTopics?: string[]; // AI-derived semantic topics
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
  // Specialized media fields
  audioTitle?: string;
  audioArtist?: string;
  audioUrl?: string;
  instagramUsername?: string;
  instagramAccountId?: string;
  carouselImages?: string[];
  carouselSlides?: CarouselSlide[];
  isCarousel?: boolean;
  storyExpiresAt?: string;
  deletedAt?: string;
}

export interface ConnectedInstagramAccount {
  id: string;
  reeldashUserId?: string;
  instagramUserId?: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
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
  id?: string;
  name: string;
  slug?: string;
  count: number;
  source?: "user" | "dm" | "ai" | "system";
  icon?: string;
  description?: string;
}

export type SortOption = "newest" | "oldest" | "recently_viewed" | "most_viewed" | "creator";

export type ViewMode = "grid" | "compact";

export type MediaTypeFilter = "all" | MediaType;
