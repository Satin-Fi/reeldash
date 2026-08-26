import { Reel, Collection } from '@/types/reel';

// Zero mock data - completely clean library
export const INITIAL_REELS: Reel[] = [];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'Ideas & Systems',
    description: 'Productivity hacks, mental models, and personal workflow systems.',
    icon: '💡',
    reelIds: [],
    updatedAt: 'Just now',
    reelCount: 0,
  },
  {
    id: 'col-2',
    name: 'Workout & Health',
    description: 'Daily exercises, mobility routines, and sleep optimization.',
    icon: '🏋️',
    reelIds: [],
    updatedAt: 'Just now',
    reelCount: 0,
  },
  {
    id: 'col-3',
    name: 'AI Tools & Dev',
    description: 'Machine learning engineering, coding agents, and architecture.',
    icon: '🤖',
    reelIds: [],
    updatedAt: 'Just now',
    reelCount: 0,
  },
  {
    id: 'col-4',
    name: 'Recipes & Food',
    description: 'Quick dinners, meal prep routines, and cooking fundamentals.',
    icon: '🍳',
    reelIds: [],
    updatedAt: 'Just now',
    reelCount: 0,
  },
];
