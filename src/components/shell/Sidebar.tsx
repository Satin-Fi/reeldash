'use client';

import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReels } from '@/context/ReelContext';
import { useAuth } from '@/context/AuthContext';
import { ReelDashLogo } from '@/components/ui/ReelDashLogo';

type GlyphProps = SVGProps<SVGSVGElement>;
type UnknownRecord = Record<string, unknown>;

type Account = {
  id: string;
  label: string;
  raw: UnknownRecord;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<GlyphProps>;
  mediaType?: 'reel' | 'post' | 'audio' | 'all';
};

const HIDDEN_SCROLLBAR =
  'no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const HIDDEN_SCROLLBAR_STYLE: CSSProperties & {
  msOverflowStyle: 'none';
} = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

// ─── Bespoke Original SVGs (No Generic Icons) ──────────────────

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

// Bespoke 4-cell Bento Dashboard Architecture Glyph
function NavDashboardIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="7" height="9.5" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="5.5" rx="1.8" />
      <rect x="3.5" y="16" width="7" height="4.5" rx="1.6" />
      <rect x="13.5" y="12" width="7" height="8.5" rx="1.8" />
    </Glyph>
  );
}

// Bespoke 9:16 Cinematic Filmstrip Frame Glyph
function NavReelsIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="6.5" y="2.75" width="11" height="18.5" rx="2.2" />
      <path d="M6.75 6.75h10.5M6.75 17.25h10.5" opacity=".5" />
      <path d="m10.5 9.75 4 2.25-4 2.25V9.75Z" />
    </Glyph>
  );
}

// Bespoke Media Artboard / Photo Canvas Glyph
function NavPostsIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="4" width="17" height="16" rx="2.2" />
      <circle cx="15.5" cy="8.5" r="1.5" />
      <path d="m3.75 15.5 5-4.5a1.2 1.2 0 0 1 1.6 0l4.15 3.9" />
      <path d="m12.5 16.5 3-2.6a1.2 1.2 0 0 1 1.6 0l3.15 2.6" />
    </Glyph>
  );
}

// Bespoke Acoustic Frequency Pulse Glyph
function NavAudioIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 10.5v3M7 7v10M10.5 4v16" />
      <path d="M14 8.5v7M17.5 6v12M20.5 10.5v3" />
    </Glyph>
  );
}

// Bespoke Architectural Stack of Media Planes Glyph
function NavLibraryIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="m4 7.5 6.8-3.7a2.5 2.5 0 0 1 2.4 0L20 7.5a1 1 0 0 1 0 1.7l-6.8 3.7a2.5 2.5 0 0 1-2.4 0L4 9.2a1 1 0 0 1 0-1.7Z" />
      <path d="m3.75 12 7 3.8a2.5 2.5 0 0 0 2.4 0l7-3.8" opacity=".75" />
      <path d="m3.75 16 7 3.8a2.5 2.5 0 0 0 2.4 0l7-3.8" opacity=".45" />
    </Glyph>
  );
}

// Bespoke Faceted Celestial Heart Crest Glyph
function NavFavoritesIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="m12 20-7.8-7.4a4.8 4.8 0 0 1-.5-6.4 4.4 4.4 0 0 1 6.6-.6L12 7l1.7-1.4a4.4 4.4 0 0 1 6.6.6 4.8 4.8 0 0 1-.5 6.4L12 20Z" />
      <path d="m3.8 7 4.5 3.2L12 20l3.7-9.8 4.5-3.2" opacity=".35" />
    </Glyph>
  );
}

// Bespoke Minimalist Crown / Sparkle Glyph
function NavPricingIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="m4 8.2 4 3.1L12 5.2l4 6.1 4-3.1-1.8 9.1H5.8L4 8.2Z" />
      <path d="M7 20.2h10" opacity=".6" />
    </Glyph>
  );
}

// Bespoke Archive Chamber / Vault Glyph
function NavRecycleBinIcon(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5.2 7.2 6.4 19a1.8 1.8 0 0 0 1.8 1.7h7.6a1.8 1.8 0 0 0 1.8-1.7l1.2-11.8" />
      <path d="m4 6.2 7-2.4a2.5 2.5 0 0 1 1.8 0l7 2.4V7.5H4V6.2Z" />
      <path d="m9.2 11 .4 6.5M14.4 11l-.4 6.5" opacity=".6" />
    </Glyph>
  );
}

// Bespoke Minimal Folder Glyph
function FolderGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.25 7V5.8A1.55 1.55 0 0 1 4.8 4.25h4.1a1.7 1.7 0 0 1 1.2.5l1.65 1.65H19.2a1.55 1.55 0 0 1 1.55 1.55V17.5a1.6 1.6 0 0 1-1.6 1.6H4.85a1.6 1.6 0 0 1-1.6-1.6V7Z" />
      <path d="M3.5 9h17" opacity=".4" />
    </Glyph>
  );
}

// Bespoke Micro-Machined Settings Gear Glyph (Matching Payflow Reference)
function SettingsGearGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="m10.3 2.75-.45 2.1-2.05 1.2-2.05-.65-1.7 2.95 1.6 1.45v2.4l-1.6 1.45 1.7 2.95 2.05-.65 2.05 1.2.45 2.1h3.4l.45-2.1 2.05-1.2 2.05.65 1.7-2.95-1.6-1.45v-2.4l1.6-1.45-1.7-2.95-2.05.65-2.05-1.2-.45-2.1h-3.4Z" transform="translate(0 1)" />
      <circle cx="12" cy="12" r="3" />
    </Glyph>
  );
}

function PlusGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}

function ChevronGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="m8 10 4 4 4-4" />
    </Glyph>
  );
}

function CheckGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="m6.5 12.2 3.6 3.6 7.4-7.6" />
    </Glyph>
  );
}

const PRIMARY_NAVIGATION: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: NavDashboardIcon },
  { label: 'Reels', href: '/reels?type=reel', icon: NavReelsIcon, mediaType: 'reel' },
  { label: 'Posts & Photos', href: '/reels?type=post', icon: NavPostsIcon, mediaType: 'post' },
  { label: 'Songs & Audio', href: '/reels?type=audio', icon: NavAudioIcon, mediaType: 'audio' },
  { label: 'All Library', href: '/reels?type=all', icon: NavLibraryIcon, mediaType: 'all' },
  { label: 'Favorites', href: '/favorites', icon: NavFavoritesIcon },
];

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object'
    ? (value as UnknownRecord)
    : {};
}

function asText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
}

function firstArray(...values: unknown[]): unknown[] {
  return values.find((value): value is unknown[] => Array.isArray(value)) ?? [];
}

function getAccounts(context: UnknownRecord, user: UnknownRecord): Account[] {
  const seen = new Set<string>();

  return firstArray(
    user.connectedAccounts,
    user.instagramAccounts,
    context.activeAccounts,
    context.instagramAccounts,
  ).flatMap((value) => {
    const account = asRecord(value);
    const status = asText(account.status).toLowerCase();

    if (
      account.isActive === false ||
      account.is_active === false ||
      account.active === false ||
      ['inactive', 'disconnected', 'revoked', 'expired', 'disabled'].includes(status)
    ) {
      return [];
    }

    const id = asText(account.id, account.accountId, account.instagram_account_id, account.username);
    if (!id || seen.has(id)) return [];
    seen.add(id);

    const username = asText(account.username, account.instagram_username);
    const label = username ? `@${username.replace(/^@/, '')}` : 'Instagram Account';

    return [{ id, label, raw: account }];
  });
}

function Avatar({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-medium text-white ring-1 ring-white/[0.08]">
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          width={36}
          height={36}
          unoptimized
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{Array.from(name)[0]?.toUpperCase() || 'P'}</span>
      )}
    </span>
  );
}

function NavigationLink({
  item,
  active,
  onClick,
}: {
  item: NavigationItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5',
        'text-[13px] leading-5 tracking-[-0.01em] outline-none transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-[#CBB5FD] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-[#0C0D10]',
        active
          ? 'bg-black/[0.05] font-medium text-zinc-950 dark:bg-white/[0.08] dark:text-white'
          : 'text-zinc-500 hover:bg-black/[0.03] hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200',
      ].join(' ')}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-[#CBB5FD]"
        />
      )}
      <Icon className="shrink-0" />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function AccountSwitcher({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: Account[];
  selectedId: string;
  onSelect: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (accounts.length <= 1) return null;

  return (
    <div ref={rootRef} className="mb-4">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white/60 px-3 text-left text-zinc-600 outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#CBB5FD] dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#CBB5FD]/20 text-[10px] font-medium text-violet-700 dark:text-[#D7C7FF]">
          {selected?.label.replace(/^@/, '')[0]?.toUpperCase() || 'I'}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
          {selected ? selected.label : 'All Accounts'}
        </span>
        <ChevronGlyph
          className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={listId}
          className="mt-1.5 rounded-xl border border-black/[0.06] bg-white p-1 shadow-lg dark:border-white/[0.08] dark:bg-[#15161A]"
        >
          <ul
            className={`max-h-44 space-y-0.5 overflow-y-auto overscroll-contain ${HIDDEN_SCROLLBAR}`}
            style={HIDDEN_SCROLLBAR_STYLE}
          >
            <li>
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 text-[12px] text-zinc-600 hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.05]"
              >
                <span>All Accounts</span>
                {!selectedId && <CheckGlyph className="shrink-0 text-[#CBB5FD]" />}
              </button>
            </li>
            {accounts.map((acc) => {
              const active = acc.id === selectedId;
              return (
                <li key={acc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(acc.id);
                      setOpen(false);
                    }}
                    className="flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 text-[12px] text-zinc-600 hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.05]"
                  >
                    <span className="truncate">{acc.label}</span>
                    {active && <CheckGlyph className="shrink-0 text-[#CBB5FD]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function SidebarContent() {
  const pathname = usePathname() || '/dashboard';
  const {
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
  } = useReels();
  const { user } = useAuth();

  const userData = asRecord(user);
  const metadata = asRecord(userData.user_metadata);

  const name = asText(
    userData.name,
    userData.fullName,
    metadata.full_name,
    metadata.name,
    'Piyush kumar',
  );

  const email = asText(userData.email, metadata.email);
  const username = asText(userData.username, metadata.username);
  const secondaryLabel = email || (username ? `@${username.replace(/^@/, '')}` : 'Personal Workspace');

  const avatarUrl = asText(
    userData.avatar,
    userData.avatarUrl,
    userData.avatar_url,
    metadata.avatar_url,
    metadata.picture,
  );

  const accounts = getAccounts({}, userData);
  const isReelsPath = pathname === '/reels';

  const categoriesList = (smartCategories || [])
    .filter((cat) => !cat.name.startsWith('#'))
    .slice(0, 5);

  return (
    <aside
      aria-label="ReelDash sidebar"
      className={`isolate flex h-dvh max-h-dvh w-64 min-w-[256px] max-w-[256px] shrink-0 flex-col overflow-hidden border-r border-black/[0.06] bg-[#FAFAF9] text-zinc-900 dark:border-white/[0.06] dark:bg-[#0C0D10] dark:text-zinc-100 ${HIDDEN_SCROLLBAR}`}
      style={HIDDEN_SCROLLBAR_STYLE}
    >
      {/* Brand Header */}
      <header className="flex h-[72px] shrink-0 items-center justify-between gap-2 px-5">
        <ReelDashLogo
          href="/dashboard"
          size={24}
          showText={true}
          textSize="text-[17px]"
        />

        <Link
          href="/pricing"
          aria-label="Explore ReelDash Pro"
          className="flex shrink-0 items-center gap-1 rounded-full border border-violet-500/10 bg-violet-500/[0.06] px-2.5 py-0.5 text-[10.5px] font-medium leading-none text-violet-700 outline-none transition-colors hover:bg-violet-500/[0.1] focus-visible:ring-2 focus-visible:ring-[#CBB5FD] dark:border-[#CBB5FD]/15 dark:bg-[#CBB5FD]/[0.07] dark:text-[#D7C7FF] dark:hover:bg-[#CBB5FD]/[0.12]"
        >
          <NavPricingIcon className="shrink-0 size-3" />
          <span>Pro</span>
        </Link>
      </header>

      {/* Main Navigation Area (NO SCROLLBAR) */}
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-4 pt-1 ${HIDDEN_SCROLLBAR}`}
        style={HIDDEN_SCROLLBAR_STYLE}
      >
        {/* Instagram Account Switcher (Only if multiple accounts exist) */}
        {accounts.length > 1 && (
          <AccountSwitcher
            accounts={accounts}
            selectedId={selectedInstagramAccount || ''}
            onSelect={(id) => setSelectedInstagramAccount(id)}
          />
        )}

        {/* Primary Links */}
        <nav aria-label="Main navigation" className="space-y-1">
          {PRIMARY_NAVIGATION.map((item) => {
            const active = item.mediaType
              ? isReelsPath &&
                !activeCategory &&
                !activeCollection &&
                (activeMediaType === item.mediaType ||
                  (!activeMediaType && item.mediaType === 'all'))
              : pathname === item.href;

            return (
              <NavigationLink
                key={item.href}
                item={item}
                active={active}
                onClick={() => {
                  if (item.mediaType) {
                    setActiveMediaType(item.mediaType);
                    setActiveCategory(null);
                    setActiveCollection(null);
                    setSearchQuery('');
                  }
                }}
              />
            );
          })}
        </nav>

        {/* Collections Section */}
        <section className="mt-7" aria-labelledby="sidebar-collections-heading">
          <div className="mb-2 flex items-center justify-between px-3">
            <h2
              id="sidebar-collections-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500"
            >
              Collections
            </h2>
            <Link
              href="/categories"
              aria-label="Manage collections"
              title="Manage collections"
              className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-black/[0.04] hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <PlusGlyph className="size-3.5" />
            </Link>
          </div>

          <nav aria-label="Collections" className="space-y-0.5">
            {categoriesList.map((cat) => {
              const isSelected = isReelsPath && activeCategory === cat.name;

              return (
                <Link
                  key={cat.name}
                  href={`/reels?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setActiveCollection(null);
                    setActiveMediaType('all');
                    setSearchQuery('');
                  }}
                  className={[
                    'group relative flex min-h-9 items-center gap-3 rounded-xl px-3 py-2',
                    'text-[13px] leading-5 tracking-[-0.01em] outline-none transition-colors duration-150',
                    isSelected
                      ? 'bg-black/[0.05] font-medium text-zinc-950 dark:bg-white/[0.08] dark:text-white'
                      : 'text-zinc-500 hover:bg-black/[0.03] hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200',
                  ].join(' ')}
                >
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-3.5 w-[2.5px] -translate-y-1/2 rounded-full bg-[#CBB5FD]"
                    />
                  )}
                  <FolderGlyph className="shrink-0 size-4" />
                  <span className="min-w-0 truncate">{cat.name}</span>
                </Link>
              );
            })}

            <Link
              href="/categories"
              className="flex min-h-8 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
            >
              <span>View all collections</span>
              <span className="text-xs">→</span>
            </Link>
          </nav>
        </section>

        {/* Utilities: Plans & Pricing, Recycle Bin */}
        <nav aria-label="Resources" className="mt-auto space-y-0.5 pt-6">
          <NavigationLink
            item={{ label: 'Plans & Pricing', href: '/pricing', icon: NavPricingIcon }}
            active={pathname === '/pricing'}
          />
          <NavigationLink
            item={{ label: 'Recycle Bin', href: '/recycle-bin', icon: NavRecycleBinIcon }}
            active={pathname === '/recycle-bin'}
          />
        </nav>
      </div>

      {/* ─── Profile Card Matching Payflow Reference (Single Row) ─── */}
      <footer className="shrink-0 border-t border-black/[0.06] p-3 dark:border-white/[0.06]">
        <div className="relative flex min-h-[52px] items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.03]">
          {/* Main Card Click -> /settings */}
          <Link
            href="/settings"
            aria-label={`Open settings for ${name}`}
            className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#CBB5FD]"
          />

          {/* Avatar (Left) */}
          <Avatar src={avatarUrl} name={name} />

          {/* User Name & Subtitle/Email (Center) */}
          <div className="pointer-events-none min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-5 text-zinc-900 dark:text-zinc-100">
              {name}
            </p>
            <p className="truncate font-mono text-[11px] leading-[18px] text-zinc-500">
              {secondaryLabel}
            </p>
          </div>

          {/* Single Settings Gear Icon Button (Right) */}
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className="relative z-20 flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 outline-none transition-colors hover:bg-black/[0.04] hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-[#CBB5FD] dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
          >
            <SettingsGearGlyph />
          </Link>
        </div>
      </footer>
    </aside>
  );
}

function SidebarFallback() {
  return (
    <aside
      aria-label="Loading sidebar"
      aria-busy="true"
      className={`flex h-dvh w-64 min-w-[256px] max-w-[256px] shrink-0 flex-col overflow-hidden border-r border-black/[0.06] bg-[#FAFAF9] dark:border-white/[0.06] dark:bg-[#0C0D10] ${HIDDEN_SCROLLBAR}`}
      style={HIDDEN_SCROLLBAR_STYLE}
    >
      <div className="flex h-[72px] shrink-0 items-center px-5">
        <ReelDashLogo
          href="/dashboard"
          size={24}
          showText={true}
          textSize="text-[17px]"
        />
      </div>
      <span className="sr-only">Loading navigation…</span>
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