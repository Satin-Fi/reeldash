export type MediaType = "reel" | "post" | "audio" | "story";

export interface CarouselSlide {
  id?: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
}

export interface Reel {
  id: string;
  userId: string;
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
  // Specialized media fields
  audioTitle?: string;
  audioArtist?: string;
  audioUrl?: string;
  carouselImages?: string[];
  carouselSlides?: CarouselSlide[];
  isCarousel?: boolean;
  storyExpiresAt?: string;
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

export type MediaTypeFilter = "all" | MediaType;

