'use client';

import {
  Suspense,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Film,
  Image as ImageIcon,
  Music2,
  Layers,
  Heart,
  Folder,
  Settings,
  Plus,
  LogOut,
  Instagram,
  ChevronsUpDown,
  Check,
  Crown,
  Trash2,
  Sun,
  Moon,
  ArrowRight,
  Code2,
  Palette,
  Compass,
  Camera,
  ShoppingBag,
  Activity,
  Utensils,
  Cpu,
  type LucideProps,
} from 'lucide-react';

import { useReels } from '@/context/ReelContext';
import { useAuth } from '@/context/AuthContext';
import { ReelDashLogo } from '@/components/ui/ReelDashLogo';

type IconComponent = ComponentType<LucideProps>;
type MediaType = 'reel' | 'post' | 'audio' | 'all';

type NavigationItem = {
  label: string;
  href: string;
  icon: IconComponent;
  mediaType?: MediaType;
};

type CollectionItem = {
  id: string;
  name: string;
  kind: 'collection' | 'category';
};

type InstagramAccount = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

const navigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Reels', href: '/reels?type=reel', icon: Film, mediaType: 'reel' },
  {
    label: 'Posts & Photos',
    href: '/reels?type=post',
    icon: ImageIcon,
    mediaType: 'post',
  },
  {
    label: 'Audio & Songs',
    href: '/reels?type=audio',
    icon: Music2,
    mediaType: 'audio',
  },
  {
    label: 'All Library',
    href: '/reels?type=all',
    icon: Layers,
    mediaType: 'all',
  },
  { label: 'Favorites', href: '/favorites', icon: Heart },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF9] dark:focus-visible:ring-violet-300/60 dark:focus-visible:ring-offset-[#0C0D10]';

const iconButton =
  `inline-flex size-8 shrink-0 items-center justify-center rounded-lg ` +
  `text-zinc-500 transition-colors duration-150 hover:bg-black/[0.04] hover:text-zinc-900 ` +
  `dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white ` +
  `motion-reduce:transition-none ${focusRing}`;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function normalizeCollections(
  value: unknown,
  kind: CollectionItem['kind'],
): CollectionItem[] {
  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry])
    : Object.entries(asRecord(value));

  const seen = new Set<string>();

  return entries.flatMap(([key, entry]) => {
    const data = asRecord(entry);
    const name = stringValue(
      data.name,
      data.label,
      data.title,
      typeof entry === 'string' ? entry : null,
      !Array.isArray(value) ? key : null,
    );

    if (!name) return [];

    const id = stringValue(
      data.id,
      data.slug,
      data.key,
      kind === 'category' ? name : null,
      !Array.isArray(value) ? key : null,
      name,
    )!;

    if (seen.has(id)) return [];
    seen.add(id);

    return [{ id, name, kind }];
  });
}

function normalizeAccounts(...sources: unknown[]): InstagramAccount[] {
  const accounts = new Map<string, InstagramAccount>();

  for (const source of sources) {
    const entries = Array.isArray(source)
      ? source
      : Object.values(asRecord(source));

    for (const entry of entries) {
      const data = asRecord(entry);
      const username = stringValue(
        data.username,
        data.instagramUsername,
        data.instagram_username,
        typeof entry === 'string' ? entry : null,
      )?.replace(/^@/, '');

      if (!username) continue;

      const id = stringValue(
        data.id,
        data.accountId,
        data.instagramAccountId,
        data.instagramId,
        username,
      )!;

      if (!accounts.has(id)) {
        accounts.set(id, {
          id,
          username,
          avatarUrl: stringValue(
            data.avatarUrl,
            data.profilePictureUrl,
            data.profile_picture_url,
            data.profilePicture,
            data.avatar,
          ),
        });
      }
    }
  }

  return [...accounts.values()];
}

function categoryIcon(name: string): IconComponent {
  const value = name.toLowerCase();

  if (/code|develop|program/.test(value)) return Code2;
  if (/music|audio|song/.test(value)) return Music2;
  if (/design|art|creativ/.test(value)) return Palette;
  if (/photo|camera/.test(value)) return Camera;
  if (/travel|explor/.test(value)) return Compass;
  if (/shop|fashion|style/.test(value)) return ShoppingBag;
  if (/fitness|health|sport/.test(value)) return Activity;
  if (/food|cook|recipe/.test(value)) return Utensils;
  if (/tech|(^|\s)ai(\s|$)/.test(value)) return Cpu;

  return Folder;
}

function itemClasses(active: boolean): string {
  return [
    'group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2',
    'text-[13px] leading-5 tracking-[-0.01em]',
    'transition-colors duration-150 motion-reduce:transition-none',
    focusRing,
    active
      ? 'bg-black/[0.05] font-medium text-zinc-950 dark:bg-white/[0.08] dark:text-white'
      : 'font-normal text-zinc-500 hover:bg-black/[0.03] hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-300',
  ].join(' ');
}

function Avatar({
  src,
  name,
  size = 'sm',
}: {
  src: string | null;
  name: string;
  size?: 'sm' | 'md';
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedSource);

  return (
    <span
      aria-hidden="true"
      className={[
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-zinc-200/70 font-medium text-zinc-600 ring-1 ring-black/[0.05]',
        'dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/[0.08]',
        size === 'md' ? 'size-9 text-[13px]' : 'size-7 text-[11px]',
      ].join(' ')}
    >
      {showImage ? (
        // Account avatars are remote, user-provided URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(src)}
        />
      ) : (
        name.replace(/^@/, '').slice(0, 1).toUpperCase() || 'U'
      )}
    </span>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reelContext = useReels();
  const {
    collections,
    smartCategories,
    activeCategory,
    setActiveCategory,
    activeCollection,
    setActiveCollection,
    activeMediaType,
    setActiveMediaType,
    selectedInstagramAccount,
    setSelectedInstagramAccount,
    setSearchQuery,
    theme,
    toggleTheme,
  } = reelContext;
  const { user, logout } = useAuth();

  const [accountsOpen, setAccountsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const switcherRef = useRef<HTMLDivElement>(null);
  const switcherButtonRef = useRef<HTMLButtonElement>(null);
  const accountsPanelId = useId();

  const userData = asRecord(user);
  const metadata = asRecord(userData.user_metadata);
  const contextData = asRecord(reelContext);

  const userEmail = stringValue(userData.email, metadata.email);
  const userHandle = stringValue(userData.username, metadata.username);
  const userName =
    stringValue(
      userData.name,
      userData.displayName,
      userData.fullName,
      metadata.full_name,
      metadata.name,
      userHandle,
      userEmail?.split('@')[0],
    ) ?? 'Your workspace';

  const userSubtitle = userEmail ?? (userHandle ? `@${userHandle}` : 'Personal workspace');
  const userAvatar = stringValue(
    userData.avatarUrl,
    userData.avatar,
    userData.image,
    userData.photoURL,
    metadata.avatar_url,
    metadata.picture,
  );

  const accounts = useMemo(
    () =>
      normalizeAccounts(
        contextData.instagramAccounts,
        contextData.connectedInstagramAccounts,
        userData.instagramAccounts,
        userData.connectedInstagramAccounts,
      ),
    [
      contextData.instagramAccounts,
      contextData.connectedInstagramAccounts,
      userData.instagramAccounts,
      userData.connectedInstagramAccounts,
    ],
  );

  const collectionItems = useMemo(() => {
    const saved = normalizeCollections(collections, 'collection');
    const categories = normalizeCollections(smartCategories, 'category');

    return [...saved.slice(0, 3), ...categories.slice(0, 3)];
  }, [collections, smartCategories]);

  const selectedAccount = accounts.find(
    (account) =>
      account.id === selectedInstagramAccount ||
      account.username === selectedInstagramAccount,
  );

  const isLibrary = pathname === '/reels';
  const hasRouteFilters =
    searchParams.has('type') ||
    searchParams.has('category') ||
    searchParams.has('collection');

  const currentCategory = hasRouteFilters
    ? searchParams.get('category')
    : stringValue(activeCategory);

  const currentCollection = hasRouteFilters
    ? searchParams.get('collection')
    : stringValue(activeCollection);

  const currentMediaType = hasRouteFilters
    ? searchParams.get('type') ?? 'all'
    : activeMediaType ?? 'all';

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!accountsOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !switcherRef.current?.contains(event.target)
      ) {
        setAccountsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setAccountsOpen(false);
        switcherButtonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountsOpen]);

  useEffect(() => {
    setAccountsOpen(false);
  }, [pathname, searchParams]);

  function resetLibrary(mediaType: MediaType = 'all') {
    setActiveCategory(null);
    setActiveCollection(null);
    setActiveMediaType(mediaType);
    setSearchQuery('');
  }

  function selectCollection(item: CollectionItem) {
    setSearchQuery('');
    setActiveMediaType('all');

    if (item.kind === 'collection') {
      setActiveCategory(null);
      setActiveCollection(item.id);
    } else {
      setActiveCollection(null);
      setActiveCategory(item.id);
    }
  }

  function selectAccount(accountId: string | null) {
    setSelectedInstagramAccount(accountId);
    setAccountsOpen(false);
    switcherButtonRef.current?.focus();
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      aria-label="Workspace sidebar"
      className="flex h-full min-h-0 w-64 min-w-[256px] max-w-[256px] flex-col justify-between border-r border-black/[0.06] bg-[#FAFAF9] p-3.5 text-zinc-950 dark:border-white/[0.06] dark:bg-[#0C0D10] dark:text-zinc-100"
    >
      <header className="shrink-0 px-2 pb-6 pt-2 flex items-center justify-between">
        <ReelDashLogo href="/dashboard" size={24} showText={true} textSize="text-[17px]" />
        <Link
          href="/pricing"
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.04] hover:bg-black/[0.07] text-zinc-600 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-zinc-400 font-medium text-[11px] border border-black/[0.04] dark:border-white/[0.05] transition-colors shrink-0"
        >
          <Crown className="w-3 h-3 text-[#C5A059]" strokeWidth={1.5} />
          <span>Pro</span>
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5 [scrollbar-width:thin]">
        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map(({ label, href, icon: Icon, mediaType }) => {
            const active = mediaType
              ? isLibrary &&
                !currentCategory &&
                !currentCollection &&
                currentMediaType === mediaType
              : pathname === href;

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => resetLibrary(mediaType)}
                className={itemClasses(active)}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-violet-400 dark:bg-[#CBB5FD]"
                  />
                )}
                <Icon
                  aria-hidden="true"
                  size={17}
                  strokeWidth={1.5}
                  className="shrink-0"
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <section aria-labelledby="sidebar-collections-heading" className="mt-8">
          <div className="mb-2 flex items-center justify-between pl-3 pr-1">
            <h2
              id="sidebar-collections-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500"
            >
              Collections
            </h2>
            <Link
              href="/categories"
              aria-label="Create or manage collections"
              title="Manage collections"
              className={iconButton}
            >
              <Plus aria-hidden="true" size={15} strokeWidth={1.5} />
            </Link>
          </div>

          <nav aria-label="Collections" className="space-y-0.5">
            {collectionItems.map((item) => {
              const Icon =
                item.kind === 'collection' ? Folder : categoryIcon(item.name);
              const active =
                isLibrary &&
                (item.kind === 'collection'
                  ? currentCollection === item.id
                  : !currentCollection && currentCategory === item.id);

              return (
                <Link
                  key={`${item.kind}:${item.id}`}
                  href={`/reels?${item.kind}=${encodeURIComponent(item.id)}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => selectCollection(item)}
                  className={itemClasses(active)}
                >
                  <Icon
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.5}
                    className="shrink-0"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}

            {collectionItems.length === 0 && (
              <p className="px-3 pb-2 pt-1 text-xs leading-5 text-zinc-400 dark:text-zinc-500">
                A little order for your inspiration.
              </p>
            )}

            <Link
              href="/categories"
              aria-current={pathname === '/categories' ? 'page' : undefined}
              className={`group flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300 motion-reduce:transition-none ${focusRing}`}
            >
              <span>View all collections</span>
              <ArrowRight
                aria-hidden="true"
                size={13}
                strokeWidth={1.5}
                className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              />
            </Link>
          </nav>
        </section>
      </div>

      <footer className="shrink-0">
        <nav aria-label="Workspace tools" className="mb-4 space-y-0.5">
          <Link
            href="/pricing"
            aria-current={pathname === '/pricing' ? 'page' : undefined}
            className={itemClasses(pathname === '/pricing')}
          >
            <Crown aria-hidden="true" size={17} strokeWidth={1.5} />
            <span>Plans &amp; Pricing</span>
          </Link>
          <Link
            href="/recycle-bin"
            aria-current={pathname === '/recycle-bin' ? 'page' : undefined}
            className={itemClasses(pathname === '/recycle-bin')}
          >
            <Trash2 aria-hidden="true" size={17} strokeWidth={1.5} />
            <span>Recycle Bin</span>
          </Link>
        </nav>

        <div className="mb-4">
          {accounts.length > 0 ? (
            <div
              ref={switcherRef}
              className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setAccountsOpen(false);
                }
              }}
            >
              <button
                ref={switcherButtonRef}
                type="button"
                aria-expanded={accountsOpen}
                aria-controls={accountsPanelId}
                aria-label={`Instagram account: ${
                  selectedAccount ? `@${selectedAccount.username}` : 'All Accounts'
                }`}
                onClick={() => setAccountsOpen((open) => !open)}
                className={`flex w-full items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/70 px-3 py-2.5 text-left transition-colors hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:bg-white/[0.05] motion-reduce:transition-none ${focusRing}`}
              >
                {selectedAccount ? (
                  <Avatar
                    src={selectedAccount.avatarUrl}
                    name={selectedAccount.username}
                  />
                ) : (
                  <Instagram
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.5}
                    className="mx-[5.5px] shrink-0 text-zinc-500 dark:text-zinc-400"
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
                  {selectedAccount
                    ? `@${selectedAccount.username}`
                    : 'All Accounts'}
                </span>
                <ChevronsUpDown
                  aria-hidden="true"
                  size={14}
                  strokeWidth={1.5}
                  className="shrink-0 text-zinc-400 dark:text-zinc-500"
                />
              </button>

              <div
                id={accountsPanelId}
                aria-label="Select an Instagram account"
                aria-hidden={!accountsOpen}
                className={[
                  'absolute inset-x-0 bottom-[calc(100%+8px)] z-50 origin-bottom rounded-xl',
                  'border border-black/[0.08] bg-[#FAFAF9] p-1.5',
                  'shadow-[0_12px_40px_-12px_rgba(0,0,0,0.22)]',
                  'dark:border-white/[0.1] dark:bg-[#14151A] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]',
                  'transition-[opacity,transform,visibility] duration-150 motion-reduce:transition-none',
                  accountsOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'pointer-events-none invisible translate-y-1 opacity-0',
                ].join(' ')}
              >
                <p className="px-2.5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  Instagram workspace
                </p>

                <div className="max-h-60 space-y-0.5 overflow-y-auto overscroll-contain">
                  <button
                    type="button"
                    tabIndex={accountsOpen ? 0 : -1}
                    aria-pressed={!selectedAccount}
                    onClick={() => selectAccount(null)}
                    className={`${itemClasses(!selectedAccount)} w-full text-left`}
                  >
                    <Layers aria-hidden="true" size={17} strokeWidth={1.5} />
                    <span className="flex-1 text-[12px]">All Accounts</span>
                    {!selectedAccount && (
                      <Check aria-hidden="true" size={14} strokeWidth={1.5} />
                    )}
                  </button>

                  {accounts.map((account) => {
                    const selected = selectedAccount?.id === account.id;

                    return (
                      <button
                        key={account.id}
                        type="button"
                        tabIndex={accountsOpen ? 0 : -1}
                        aria-pressed={selected}
                        onClick={() => selectAccount(account.id)}
                        className={`${itemClasses(selected)} w-full gap-2.5 text-left`}
                      >
                        <Avatar src={account.avatarUrl} name={account.username} />
                        <span className="min-w-0 flex-1 truncate text-[12px]">
                          @{account.username}
                        </span>
                        {selected && (
                          <Check
                            aria-hidden="true"
                            size={14}
                            strokeWidth={1.5}
                            className="shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1.5 border-t border-black/[0.06] pt-1.5 dark:border-white/[0.06]">
                  <Link
                    href="/settings?tab=instagram"
                    tabIndex={accountsOpen ? 0 : -1}
                    onClick={() => setAccountsOpen(false)}
                    className={itemClasses(false)}
                  >
                    <Plus aria-hidden="true" size={17} strokeWidth={1.5} />
                    <span className="text-[12px]">Connect another account</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/settings?tab=instagram"
              className={`flex min-h-11 items-center justify-center gap-2.5 rounded-xl border border-black/[0.08] bg-white/60 px-3 py-2.5 text-[12px] font-medium text-zinc-700 transition-colors hover:border-black/[0.12] hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-zinc-300 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.05] motion-reduce:transition-none ${focusRing}`}
            >
              <Instagram aria-hidden="true" size={17} strokeWidth={1.5} />
              <span>Connect Instagram</span>
            </Link>
          )}
        </div>

        <div className="border-t border-black/[0.06] px-1 pt-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 px-1">
            <Avatar src={userAvatar} name={userName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-5 text-zinc-900 dark:text-zinc-100">
                {userName}
              </p>
              <p className="truncate font-mono text-[11px] leading-5 text-zinc-500 dark:text-zinc-500">
                {userSubtitle}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                className={iconButton}
              >
                {isDark ? (
                  <Sun aria-hidden="true" size={17} strokeWidth={1.5} />
                ) : (
                  <Moon aria-hidden="true" size={17} strokeWidth={1.5} />
                )}
              </button>

              <Link
                href="/settings"
                aria-label="Settings"
                aria-current={pathname === '/settings' ? 'page' : undefined}
                title="Settings"
                className={iconButton}
              >
                <Settings aria-hidden="true" size={17} strokeWidth={1.5} />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              aria-label={loggingOut ? 'Signing out' : 'Log out'}
              aria-busy={loggingOut}
              title="Log out"
              className={`${iconButton} disabled:cursor-wait disabled:opacity-40`}
            >
              <LogOut aria-hidden="true" size={17} strokeWidth={1.5} />
            </button>
          </div>

          {logoutError && (
            <p
              role="alert"
              className="px-1 pt-2 text-[11px] leading-4 text-rose-600 dark:text-rose-300"
            >
              {logoutError}
            </p>
          )}
        </div>
      </footer>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense
      fallback={
        <aside
          aria-label="Loading workspace sidebar"
          aria-busy="true"
          className="flex h-full min-h-0 w-64 min-w-[256px] max-w-[256px] flex-col justify-between border-r border-black/[0.06] bg-[#FAFAF9] p-3.5 dark:border-white/[0.06] dark:bg-[#0C0D10]"
        >
          <div className="px-2 pb-6 pt-2">
            <ReelDashLogo href="/dashboard" size={24} showText={true} textSize="text-[17px]" />
          </div>
        </aside>
      }
    >
      <SidebarContent />
    </Suspense>
  );
}