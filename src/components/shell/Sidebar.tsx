'use client';

import { Suspense, type CSSProperties, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReels } from '@/context/ReelContext';
import { useAuth } from '@/context/AuthContext';
import { ReelDashLogo } from '@/components/ui/ReelDashLogo';

type IconProps = {
  active: boolean;
  className?: string;
};

type NavItemProps = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
  active: boolean;
  count?: number;
  onClick?: () => void;
};

const ACTIVE_GRADIENTS = {
  '--sidebar-active-gradient-light':
    'linear-gradient(90deg, #E8E5DF 0%, #F0EDE8 55%, rgba(240, 237, 232, 0) 100%)',
  '--sidebar-active-gradient-dark':
    'linear-gradient(90deg, #44403C 0%, #322E2A 55%, rgba(38, 35, 32, 0) 100%)',
} as CSSProperties;

const SCROLLBAR_CLASSES =
  'no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const SIDEBAR_CLASSES =
  'sticky top-0 flex h-dvh w-[260px] shrink-0 flex-col overflow-hidden ' +
  'border-r border-black/[0.05] bg-[#F8F6F2] text-zinc-900 ' +
  'dark:border-white/[0.04] dark:bg-[#262320] dark:text-white ' +
  '[--sidebar-active-gradient:var(--sidebar-active-gradient-light)] ' +
  'dark:[--sidebar-active-gradient:var(--sidebar-active-gradient-dark)]';

function iconAttributes(active: boolean, className?: string) {
  return {
    viewBox: '0 0 24 24',
    width: 20,
    height: 20,
    fill: active ? 'currentColor' : 'none',
    stroke: active ? 'none' : 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    focusable: false as const,
    className: [
      'size-5 origin-center transition-transform duration-200 ease-out',
      'motion-reduce:transform-none motion-reduce:transition-none',
      active ? 'scale-105' : 'scale-100',
      className,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

// ─── Bespoke Payflow SVGs: Solid & Scaled-105 when Active, Crisp Outline when Inactive ───

function NavDashboardIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.8 3.2a1.8 1.8 0 0 1 2.4 0l6.2 5.3a1.4 1.4 0 0 1 .48 1.06V18a2.5 2.5 0 0 1-2.5 2.5H6.6A2.5 2.5 0 0 1 4.1 18V9.56a1.4 1.4 0 0 1 .48-1.06l6.22-5.3ZM11.25 15.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Z"
        />
      ) : (
        <>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9v9.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V9" />
          <path d="M12 15.5v4" />
        </>
      )}
    </svg>
  );
}

function NavReelsIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5 3.5a2.5 2.5 0 0 0-2.5 2.5v12A2.5 2.5 0 0 0 5 20.5h14a2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 0 0-2.5-2.5H5Zm.25 2.5a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75Zm6.5-.75a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5h-2Zm6.5 0a.75.75 0 0 0 0 1.5h.75a.75.75 0 0 0 0-1.5h-.75ZM10 10.2a.75.75 0 0 1 1.14-.65l4.5 2.7a.75.75 0 0 1 0 1.3l-4.5 2.7A.75.75 0 0 1 10 15.6v-5.4Z"
        />
      ) : (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
          <path d="M3.5 8h17M8 3.5l2.5 4.5m3.5-4.5 2.5 4.5" />
          <polygon points="10 11.5 15 14.5 10 17.5 10 11.5" />
        </>
      )}
    </svg>
  );
}

function NavPostsIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5 3.5a2.5 2.5 0 0 0-2.5 2.5v12A2.5 2.5 0 0 0 5 20.5h14a2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 0 0-2.5-2.5H5Zm2.75 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7.47 5.18a.75.75 0 0 0-1.1 0l-3.62 4.2-1.65-1.64a.75.75 0 0 0-1.08.02l-2.4 2.8A.75.75 0 0 0 5.94 18.5h12.12a.75.75 0 0 0 .58-1.22l-3.42-5.6Z"
        />
      ) : (
        <>
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
          <circle cx="8" cy="8" r="1.5" />
          <path d="m4 17 4.5-4.5 3 3L16 11l4.5 5" />
        </>
      )}
    </svg>
  );
}

function NavAudioIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <>
          <rect x="2.5" y="9" width="2.75" height="6" rx="1.375" />
          <rect x="6.75" y="5.5" width="2.75" height="13" rx="1.375" />
          <rect x="11" y="2.5" width="2.75" height="19" rx="1.375" />
          <rect x="15.25" y="6.5" width="2.75" height="11" rx="1.375" />
          <rect x="19.5" y="9" width="2.75" height="6" rx="1.375" />
        </>
      ) : (
        <path d="M3.87 9.5v5m4.25-8v11M12.37 3.5v17m4.25-13v9m4.25-7v5" />
      )}
    </svg>
  );
}

function NavLibraryIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <>
          <rect x="7" y="3.5" width="13.5" height="13.5" rx="2.5" />
          <path d="M4.5 7.5A2.5 2.5 0 0 0 2 10v7.5A2.5 2.5 0 0 0 4.5 20h11a2.5 2.5 0 0 0 2.5-2.5V17h-11A2.5 2.5 0 0 1 4.5 14.5V7.5Z" />
        </>
      ) : (
        <>
          <rect x="7.5" y="3.5" width="13" height="13" rx="2.5" />
          <path d="M4.5 7.5h-1a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" />
        </>
      )}
    </svg>
  );
}

function NavFavoritesIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
      ) : (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      )}
    </svg>
  );
}

function NavPricingIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <>
          <path d="M11.14 3.49a1 1 0 0 1 1.72 0l3.77 6.33 3.81-3.1a1 1 0 0 1 1.6.96l-1.7 9a1 1 0 0 1-.98.82H4.64a1 1 0 0 1-.98-.82l-1.7-9a1 1 0 0 1 1.6-.96l3.81 3.1 3.77-6.33Z" />
          <rect x="4" y="19" width="16" height="2.25" rx="1.125" />
        </>
      ) : (
        <>
          <path d="m3 7 4.5 3.5L12 3l4.5 7.5L21 7l-2 10H5L3 7Z" />
          <path d="M5 20.5h14" />
        </>
      )}
    </svg>
  );
}

function NavRecycleBinIcon({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <>
          <rect x="3" y="3.5" width="18" height="4" rx="1.5" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.5 9h15v9.5A2.5 2.5 0 0 1 17 21H7a2.5 2.5 0 0 1-2.5-2.5V9Zm5 3.5a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z"
          />
        </>
      ) : (
        <>
          <rect x="3" y="3.5" width="18" height="4" rx="1.25" />
          <path d="M4.5 8v10.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8M9.5 12.5h5" />
        </>
      )}
    </svg>
  );
}

function FolderGlyph({ active, className }: IconProps) {
  return (
    <svg {...iconAttributes(active, className)}>
      {active ? (
        <path d="M4.5 4A2.5 2.5 0 0 0 2 6.5v11A2.5 2.5 0 0 0 4.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 19.5 6h-7.09l-1.27-1.27A2.5 2.5 0 0 0 9.37 4H4.5Z" />
      ) : (
        <path d="M3 7a2 2 0 0 1 2-2h4.17a2 2 0 0 1 1.42.59L12 7h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      )}
    </svg>
  );
}

// ─── Payflow-Exact 6-Lobe Thin Gear (Matching Reference Screenshot) ───
function ProfileSettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px] shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Center circle */}
      <circle cx="12" cy="12" r="2.5" />
      {/* 6 smooth rounded lobes, matching Payflow pill reference pixel-for-pixel */}
      <path d="
        M12 2.5
        C12.9 2.5 13.7 3.1 14 4
        L14.5 5.5
        C15.2 5.3 15.9 5.2 16.6 5.4
        L17.7 4.3
        C18.4 3.6 19.5 3.6 20.1 4.3
        C20.8 5 20.8 6.1 20.1 6.7
        L19 7.8
        C19.2 8.5 19.3 9.2 19.1 9.9
        L20.6 10.4
        C21.5 10.7 22.1 11.5 22.1 12.4
        C22.1 13.3 21.5 14.1 20.6 14.4
        L19.1 14.9
        C19.3 15.6 19.2 16.3 19 17
        L20.1 18.1
        C20.8 18.8 20.8 19.9 20.1 20.5
        C19.4 21.2 18.3 21.2 17.7 20.5
        L16.6 19.4
        C15.9 19.6 15.2 19.7 14.5 19.5
        L14 21
        C13.7 21.9 12.9 22.5 12 22.5
        C11.1 22.5 10.3 21.9 10 21
        L9.5 19.5
        C8.8 19.7 8.1 19.8 7.4 19.6
        L6.3 20.7
        C5.6 21.4 4.5 21.4 3.9 20.7
        C3.2 20 3.2 18.9 3.9 18.3
        L5 17.2
        C4.8 16.5 4.7 15.8 4.9 15.1
        L3.4 14.6
        C2.5 14.3 1.9 13.5 1.9 12.6
        C1.9 11.7 2.5 10.9 3.4 10.6
        L4.9 10.1
        C4.7 9.4 4.8 8.7 5 8
        L3.9 6.9
        C3.2 6.2 3.2 5.1 3.9 4.5
        C4.6 3.8 5.7 3.8 6.3 4.5
        L7.4 5.6
        C8.1 5.4 8.8 5.3 9.5 5.5
        L10 4
        C10.3 3.1 11.1 2.5 12 2.5Z
      " />
    </svg>
  );
}

// ─── NavItem: Pill with Faded Horizontal Gradient on Active & Distinct Circle Disc ───
function NavItem({ href, label, icon: Icon, active, count, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={label}
      style={
        active
          ? { background: 'var(--sidebar-active-gradient)' }
          : undefined
      }
      className={[
        'group flex h-[46px] w-full min-w-0 items-center justify-between rounded-full pl-1.5 pr-3.5',
        'transition-colors duration-200 motion-reduce:transition-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-stone-400 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[#F8F6F2] dark:focus-visible:ring-offset-[#262320]',
        active
          ? 'font-medium text-zinc-900 dark:text-white'
          : 'bg-transparent text-zinc-500 hover:bg-black/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.03]',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={[
            'flex size-[34px] shrink-0 items-center justify-center rounded-full',
            'transition-colors duration-200 motion-reduce:transition-none',
            active
              ? 'bg-[#D6D2CA] text-stone-900 dark:bg-[#68615A] dark:text-white shadow-sm'
              : 'text-zinc-500 group-hover:bg-black/[0.04] group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:bg-white/[0.04] dark:group-hover:text-zinc-200',
          ].join(' ')}
        >
          <Icon active={active} />
        </span>

        <span
          className={[
            'min-w-0 truncate text-[13.5px] leading-5',
            active
              ? 'font-medium text-zinc-900 dark:text-white'
              : 'text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200',
          ].join(' ')}
        >
          {label}
        </span>
      </div>

      {count !== undefined && count > 0 && (
        <span
          className={[
            'text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 transition-colors',
            active
              ? 'text-zinc-700 dark:text-zinc-300'
              : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400',
          ].join(' ')}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    reels = [],
    favorites = [],
    recycleBin = [],
    smartCategories = [],
    activeCategory,
    setActiveCategory,
    setActiveCollection,
    activeMediaType,
    setActiveMediaType,
    setSearchQuery,
  } = useReels();

  const { user } = useAuth();

  const email = user?.email || '';
  const handle = user?.handle || user?.instagramUsername || '';
  const userName = user?.name || handle || (email ? email.split('@')[0] : 'User');
  const userSubtitle = email || (handle ? `@${handle.replace(/^@/, '')}` : 'Account settings');
  const avatarUrl = user?.avatar || '';

  const initials =
    userName
      .split(/\s+/)
      .slice(0, 2)
      .map((part: string) => Array.from(part)[0] ?? '')
      .join('')
      .toUpperCase() || 'RD';

  const isRoute = (route: string) =>
    pathname === route || Boolean(pathname?.startsWith(`${route}/`));

  const isReelsRoute = isRoute('/reels');
  const selectedCategory = searchParams.get('category');
  const selectedType = searchParams.get('type') || 'all';
  const hasSelectedCategory = Boolean(selectedCategory || activeCategory);

  const isMediaActive = (type: string) =>
    isReelsRoute && !hasSelectedCategory && ((activeMediaType === type) || (!activeMediaType && selectedType === type));

  // Compute live counts
  const reelsCount = reels.filter((r) => r.mediaType === 'reel').length;
  const postsCount = reels.filter((r) => r.mediaType === 'post').length;
  const audioCount = reels.filter((r) => r.mediaType === 'audio').length;
  const allCount = reels.length;
  const favsCount = favorites.length;
  const recycleCount = recycleBin.length;

  return (
    <aside
      aria-label="ReelDash sidebar"
      className={SIDEBAR_CLASSES}
      style={ACTIVE_GRADIENTS}
    >
      {/* Brand Header */}
      <header className="flex h-[92px] shrink-0 items-center px-7">
        <Link
          href="/dashboard"
          onClick={() => {
            setActiveCategory(null);
            setActiveCollection(null);
            setActiveMediaType('all');
            setSearchQuery('');
          }}
          aria-label="ReelDash home"
          className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
        >
          <ReelDashLogo />
        </Link>
      </header>

      {/* Main Navigation (Zero Scrollbar) */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 ${SCROLLBAR_CLASSES}`}
        style={{ msOverflowStyle: 'none' }}
      >
        <nav aria-label="Main navigation" className="space-y-1">
          <NavItem
            href="/dashboard"
            label="Dashboard"
            icon={NavDashboardIcon}
            active={isRoute('/dashboard')}
            onClick={() => {
              setActiveCategory(null);
              setActiveCollection(null);
              setActiveMediaType('all');
              setSearchQuery('');
            }}
          />
          <NavItem
            href="/reels?type=reel"
            label="Reels"
            icon={NavReelsIcon}
            active={isMediaActive('reel')}
            count={reelsCount}
            onClick={() => {
              setActiveMediaType('reel');
              setActiveCategory(null);
              setActiveCollection(null);
              setSearchQuery('');
            }}
          />
          <NavItem
            href="/reels?type=post"
            label="Posts & Photos"
            icon={NavPostsIcon}
            active={isMediaActive('post')}
            count={postsCount}
            onClick={() => {
              setActiveMediaType('post');
              setActiveCategory(null);
              setActiveCollection(null);
              setSearchQuery('');
            }}
          />
          <NavItem
            href="/reels?type=audio"
            label="Songs & Audio"
            icon={NavAudioIcon}
            active={isMediaActive('audio')}
            count={audioCount}
            onClick={() => {
              setActiveMediaType('audio');
              setActiveCategory(null);
              setActiveCollection(null);
              setSearchQuery('');
            }}
          />
          <NavItem
            href="/reels?type=all"
            label="All Library"
            icon={NavLibraryIcon}
            active={isMediaActive('all')}
            count={allCount}
            onClick={() => {
              setActiveMediaType('all');
              setActiveCategory(null);
              setActiveCollection(null);
              setSearchQuery('');
            }}
          />
          <NavItem
            href="/favorites"
            label="Favorites"
            icon={NavFavoritesIcon}
            active={isRoute('/favorites')}
            count={favsCount}
            onClick={() => {
              setActiveCategory(null);
              setActiveCollection(null);
              setSearchQuery('');
            }}
          />
        </nav>

        {/* Collections Section */}
        <section aria-labelledby="sidebar-collections-heading" className="mt-7">
          <div className="mb-2.5 flex h-6 items-center justify-between pl-4 pr-3">
            <h2
              id="sidebar-collections-heading"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500"
            >
              Collections
            </h2>

            <Link
              href="/categories"
              aria-label="Manage collections"
              title="Manage collections"
              className="flex size-6 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </div>

          <nav aria-label="Collections" className="space-y-1">
            <NavItem
              href="/categories"
              label="All Collections"
              icon={FolderGlyph}
              active={isRoute('/categories')}
            />

            {smartCategories
              .filter((cat) => !cat.name.startsWith('#'))
              .slice(0, 5)
              .map((cat) => {
                const isSelected = isReelsRoute && (activeCategory === cat.name || selectedCategory === cat.name);
                return (
                  <NavItem
                    key={cat.id || cat.name}
                    href={`/reels?category=${encodeURIComponent(cat.name)}`}
                    label={cat.name}
                    icon={FolderGlyph}
                    active={isSelected}
                    count={cat.count}
                    onClick={() => {
                      setActiveCategory(cat.name);
                      setActiveMediaType('all');
                      setActiveCollection(null);
                      setSearchQuery('');
                    }}
                  />
                );
              })}
          </nav>
        </section>
      </div>

      {/* Footer Navigation & Payflow Profile Pill Card */}
      <footer className="shrink-0 px-4 pb-4 pt-2">
        <nav aria-label="Additional navigation" className="space-y-1">
          <NavItem
            href="/pricing"
            label="Pricing"
            icon={NavPricingIcon}
            active={isRoute('/pricing')}
          />
          <NavItem
            href="/recycle-bin"
            label="Recycle Bin"
            icon={NavRecycleBinIcon}
            active={isRoute('/recycle-bin')}
            count={recycleCount}
          />
        </nav>

        <div className="mx-3 mb-3.5 mt-3.5 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

        {/* ─── Payflow-exact Single Pill Profile Card ─── */}
        <Link
          href="/settings"
          aria-label={`Open settings for ${userName}`}
          aria-current={isRoute('/settings') ? 'page' : undefined}
          className="group flex items-center gap-3 rounded-full border border-black/[0.04] bg-[#EDEAE5] p-1.5 pr-3.5 transition-all hover:border-black/[0.08] hover:bg-[#E8E4DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 motion-reduce:transition-none dark:border-white/[0.06] dark:bg-[#2E2B28] dark:hover:border-white/[0.1] dark:hover:bg-[#332F2C]"
        >
          {/* Avatar — size-11 (44px) matching Payflow reference */}
          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#4A4440] text-[13px] font-semibold tracking-wide text-white/90">
            <span aria-hidden="true">{initials}</span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                width={44}
                height={44}
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 size-full rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
          </span>

          {/* Name + Email */}
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
            <span className="truncate text-[13.5px] font-semibold leading-[18px] text-zinc-900 dark:text-white">
              {userName}
            </span>
            <span className="truncate text-[11.5px] leading-[15px] text-zinc-500 dark:text-zinc-400">
              {userSubtitle}
            </span>
          </span>

          {/* Gear icon */}
          <span className="flex size-8 shrink-0 items-center justify-center">
            <ProfileSettingsIcon />
          </span>
        </Link>
      </footer>
    </aside>
  );
}

function SidebarFallback() {
  return (
    <aside
      aria-label="Loading ReelDash sidebar"
      aria-busy="true"
      className={SIDEBAR_CLASSES}
      style={ACTIVE_GRADIENTS}
    >
      <div className="flex h-[92px] shrink-0 items-center px-7">
        <ReelDashLogo />
      </div>

      <div aria-hidden="true" className="space-y-1 px-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex h-[46px] items-center gap-3 rounded-full px-1.5"
          >
            <div className="size-[34px] rounded-full bg-black/[0.04] dark:bg-white/[0.04]" />
            <div className="h-3 w-24 rounded-full bg-black/[0.04] dark:bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarContent />
    </Suspense>
  );
}