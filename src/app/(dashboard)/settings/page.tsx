'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Instagram,
  User,
  Sparkles,
  Sun,
  Moon,
  Download,
  Check,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Key,
  FileSpreadsheet,
  FileCode,
  Zap,
} from 'lucide-react';

import { useReels } from '@/context/ReelContext';
import { useAuth } from '@/context/AuthContext';
import { getClientAuthHeaders } from '@/lib/clientAuth';

type TabId = 'accounts' | 'profile' | 'billing' | 'appearance' | 'export';
type Account = {
  id: string;
  handle: string;
  verified: boolean;
};
type Notice = { kind: 'success' | 'error'; message: string } | null;
type DialogState =
  | { type: 'unlink'; account: Account }
  | { type: 'delete' }
  | null;

const tabs = [
  { id: 'accounts', label: 'Connected Accounts', icon: Instagram },
  { id: 'profile', label: 'Profile & Workspace', icon: User },
  { id: 'billing', label: 'Plans & Billing', icon: Sparkles },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'export', label: 'Data Export', icon: Download },
] as const;

const inputClass =
  'h-12 w-full rounded-xl border border-black/10 bg-black/[0.025] px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-black/[0.035] disabled:opacity-50 dark:border-white/10 dark:bg-black/20 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 dark:focus:ring-white/5';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#ECEDE8] dark:text-zinc-950 dark:hover:bg-white dark:focus-visible:ring-offset-[#121316]';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-black/20 hover:bg-black/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:bg-white/5';

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function normalizeAccounts(user: unknown): Account[] {
  const data = record(user);
  const raw =
    data.instagramAccounts ??
    data.connectedInstagramAccounts ??
    data.instagram_accounts;

  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      const account = record(item);
      const handle = (
        typeof item === 'string'
          ? item
          : text(
              account.username,
              text(account.handle, text(account.instagramUsername, 'instagram')),
            )
      ).replace(/^@/, '');

      return {
        id: String(account.id ?? account._id ?? account.instagramId ?? handle ?? index),
        handle,
        verified:
          account.verified !== false &&
          account.isVerified !== false &&
          account.status !== 'pending',
      };
    });
  }

  const handle = text(data.instagramUsername, text(data.instagramHandle));
  return handle
    ? [{ id: handle.replace(/^@/, ''), handle: handle.replace(/^@/, ''), verified: true }]
    : [];
}

function VerifiedMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m12 2 2.7 1.6 3.1.2 1.4 2.8 2.5 1.9-.5 3.1.5 3.1-2.5 1.9-1.4 2.8-3.1.2L12 22l-2.7-1.6-3.1-.2-1.4-2.8-2.5-1.9.5-3.1-.5-3.1 2.5-1.9 1.4-2.8 3.1-.2L12 2Z"
        fill="currentColor"
      />
      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyAccountsArt() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 180 112" className="h-28 w-44" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="50" y1="20" x2="130" y2="100">
          <stop stopColor="#E9BDB4" />
          <stop offset=".5" stopColor="#BAA7D4" />
          <stop offset="1" stopColor="#8A98BF" />
        </linearGradient>
      </defs>
      <ellipse cx="90" cy="95" rx="53" ry="6" fill="currentColor" opacity=".04" />
      <path
        d="M17 56h28m90 0h28M90 6v14"
        stroke="currentColor"
        strokeOpacity=".18"
        strokeDasharray="3 5"
      />
      <rect
        x="52"
        y="21"
        width="76"
        height="70"
        rx="21"
        fill={`url(#${id})`}
        fillOpacity=".14"
        stroke={`url(#${id})`}
      />
      <rect x="70" y="36" width="40" height="40" rx="12" stroke={`url(#${id})`} strokeWidth="2" />
      <circle cx="90" cy="56" r="9" stroke={`url(#${id})`} strokeWidth="2" />
      <circle cx="102" cy="44" r="2.5" fill={`url(#${id})`} />
      <circle cx="132" cy="30" r="12" className="fill-[#FAFAF8] dark:fill-[#17181C]" />
      <path
        d="M132 25v10m-5-5h10"
        stroke="currentColor"
        strokeOpacity=".5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThemePreview({ dark }: { dark: boolean }) {
  const canvas = dark ? '#17181D' : '#F4F4F0';
  const panel = dark ? '#202127' : '#FFFFFF';
  const stroke = dark ? '#34353D' : '#E4E4DE';
  const ink = dark ? '#D5D5CD' : '#56594E';
  const muted = dark ? '#41434D' : '#DDDED6';

  return (
    <svg
      viewBox="0 0 280 176"
      fill="none"
      className="block w-full"
      role="img"
      aria-label={`${dark ? 'Dark' : 'Light'} theme dashboard preview`}
    >
      <rect width="280" height="176" rx="12" fill={canvas} />
      <path d="M65 0v176" stroke={stroke} />
      <rect x="14" y="16" width="18" height="18" rx="5" fill={ink} />
      <path d="m20 20 7 5-7 5V20Z" fill={canvas} />
      <rect x="39" y="21" width="15" height="3" rx="1.5" fill={ink} opacity=".6" />
      <rect x="39" y="27" width="10" height="2" rx="1" fill={muted} />
      <rect x="10" y="53" width="45" height="17" rx="5" fill={dark ? '#303329' : '#E6E9DC'} />
      {[60, 85, 110, 135].map((y, index) => (
        <g key={y}>
          <rect x="17" y={y} width="5" height="5" rx="1.5" fill={index === 0 ? ink : muted} />
          <rect x="28" y={y + 1} width={index % 2 ? 17 : 20} height="3" rx="1.5" fill={index === 0 ? ink : muted} />
        </g>
      ))}
      <rect x="80" y="19" width="78" height="5" rx="2.5" fill={ink} />
      <rect x="80" y="31" width="114" height="3" rx="1.5" fill={muted} />
      <rect x="233" y="17" width="30" height="14" rx="5" fill={ink} />
      {[80, 144, 208].map((x, index) => (
        <g key={x}>
          <rect x={x} y="51" width="55" height="92" rx="7" fill={panel} stroke={stroke} />
          <rect
            x={x + 5}
            y="56"
            width="45"
            height="57"
            rx="4"
            fill={
              dark
                ? ['#3B4039', '#3D3543', '#343F45'][index]
                : ['#DDE4D4', '#E7DCE7', '#D9E3E6'][index]
            }
          />
          {index === 0 ? (
            <path d={`M${x + 12} 105  ${x + 26} 68 ${x + 43} 105Z`} fill={ink} opacity=".16" />
          ) : index === 1 ? (
            <circle cx={x + 27} cy="85" r="16" fill={ink} opacity=".14" />
          ) : (
            <path d={`M${x + 12} 71h30v10h-18v20h-12V71Z`} fill={ink} opacity=".16" />
          )}
          <rect x={x + 7} y="122" width="30" height="3" rx="1.5" fill={ink} opacity=".65" />
          <rect x={x + 7} y="130" width="20" height="2" rx="1" fill={muted} />
        </g>
      ))}
      <rect x="80" y="157" width="69" height="3" rx="1.5" fill={muted} />
      <rect x="229" y="155" width="34" height="7" rx="3.5" fill={muted} opacity=".6" />
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          {eyebrow}
        </span>
        <span className="text-zinc-400 dark:text-zinc-600">{icon}</span>
      </div>
      <h2 className="text-2xl font-medium tracking-[-0.045em] text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function InlineNotice({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <div
      role={notice.kind === 'error' ? 'alert' : 'status'}
      className={`mt-4 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-xs leading-5 ${
        notice.kind === 'error'
          ? 'border-red-500/15 bg-red-500/5 text-red-600 dark:text-red-300'
          : 'border-emerald-500/15 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
      }`}
    >
      {notice.kind === 'error' ? (
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      ) : (
        <Check size={15} className="mt-0.5 shrink-0" />
      )}
      {notice.message}
    </div>
  );
}

function Modal({
  title,
  onClose,
  busy,
  children,
}: {
  title: string;
  onClose: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]',
        ) ?? [],
      );

    (focusables()[0] ?? panel.current)?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) closeRef.current();
      if (event.key !== 'Tab') return;
      const elements = focusables();
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first) {
        event.preventDefault();
        panel.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-5 backdrop-blur-md"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        exit={{ y: 8 }}
        className="w-full max-w-md rounded-[24px] border border-black/10 bg-[#FAFAF8] p-7 shadow-2xl outline-none dark:border-white/10 dark:bg-[#17181C]"
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.06] text-red-500 dark:text-red-400">
          <AlertTriangle size={20} strokeWidth={1.5} />
        </div>
        <h3 id={titleId} className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme, reels, showToast } = useReels();
  const {
    user,
    updateUser,
    removeInstagramAccount,
    refreshAccounts,
    deleteAccount,
  } = useAuth();

  const userData = record(user);
  const initialName = text(userData.name, text(userData.fullName));
  const initialEmail = text(userData.email);
  const initialHandle = text(
    userData.workspaceHandle,
    text(userData.username, text(userData.handle)),
  ).replace(/^@/, '');

  const [activeTab, setActiveTab] = useState<TabId>('accounts');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accountNotice, setAccountNotice] = useState<Notice>(null);
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [handle, setHandle] = useState(initialHandle);
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [destructiveBusy, setDestructiveBusy] = useState(false);
  const [dialogNotice, setDialogNotice] = useState<Notice>(null);
  const [exportNotice, setExportNotice] = useState<Notice>(null);

  const accounts = normalizeAccounts(user);
  const isDark = theme === 'dark';
  const reelList = Array.isArray(reels) ? reels : [];
  const planName = text(userData.plan, text(record(userData.subscription).plan, 'Free'));
  const isPaid = /pro|premium|business|team/i.test(planName);
  const profileDirty =
    fullName !== initialName || email !== initialEmail || handle !== initialHandle;
  const linkingBusy = verifying || generating || refreshing;

  useEffect(() => {
    setFullName(initialName);
    setEmail(initialEmail);
    setHandle(initialHandle);
  }, [initialName, initialEmail, initialHandle]);

  async function instagramRequest(path: string, body: Record<string, string>) {
    const headers = new Headers(await getClientAuthHeaders());
    headers.set('Content-Type', 'application/json');

    const response = await fetch(path, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });

    const payload = record(await response.json().catch(() => ({})));
    if (!response.ok || payload.success === false) {
      throw new Error(
        text(payload.error, text(payload.message, 'Unable to connect to Instagram. Please try again.')),
      );
    }
    return payload;
  }

  async function verifyAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || linkingBusy) return;
    setVerifying(true);
    setAccountNotice(null);

    try {
      await instagramRequest('/api/instagram/verify', { code });
      setCode('');
      setGeneratedCode('');
      try {
        await refreshAccounts();
        setAccountNotice({ kind: 'success', message: 'Account verified. Your Instagram is now connected.' });
        showToast('Instagram account connected.');
      } catch {
        setAccountNotice({
          kind: 'success',
          message: 'Account verified. Refresh your accounts to update the list.',
        });
      }
    } catch (error) {
      setAccountNotice({ kind: 'error', message: errorMessage(error) });
    } finally {
      setVerifying(false);
    }
  }

  async function generateCode() {
    if (linkingBusy) return;
    setGenerating(true);
    setAccountNotice(null);

    try {
      const payload = await instagramRequest('/api/instagram/generate-code', {});
      const rawCode = payload.code ?? payload.verificationCode ?? record(payload.data).code;
      const nextCode = typeof rawCode === 'number' ? String(rawCode).padStart(6, '0') : text(rawCode);

      if (!/^\d{6}$/.test(nextCode)) {
        throw new Error('A valid verification code was not returned. Please try again.');
      }

      setGeneratedCode(nextCode);
    } catch (error) {
      setAccountNotice({ kind: 'error', message: errorMessage(error) });
    } finally {
      setGenerating(false);
    }
  }

  async function refreshConnectedAccounts() {
    if (linkingBusy) return;
    setRefreshing(true);
    setAccountNotice(null);
    try {
      await refreshAccounts();
      setAccountNotice({ kind: 'success', message: 'Your connected accounts are up to date.' });
    } catch (error) {
      setAccountNotice({ kind: 'error', message: errorMessage(error) });
    } finally {
      setRefreshing(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(generatedCode);
      showToast('Verification code copied.');
    } catch {
      setAccountNotice({
        kind: 'error',
        message: 'Clipboard access is unavailable. Select and copy the code manually.',
      });
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileDirty || saving) return;
    setSaving(true);
    setProfileNotice(null);
    try {
      const updates = {
        name: fullName.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        username: handle.trim(),
        workspaceHandle: handle.trim(),
      };
      await updateUser(updates as Parameters<typeof updateUser>[0]);
      setProfileNotice({ kind: 'success', message: 'Your workspace details have been saved.' });
      showToast('Profile updated.');
    } catch (error) {
      setProfileNotice({ kind: 'error', message: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  function openDialog(next: NonNullable<DialogState>) {
    setDeleteConfirmation('');
    setDialogNotice(null);
    setDialog(next);
  }

  async function confirmDestructiveAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || destructiveBusy) return;
    if (dialog.type === 'delete' && deleteConfirmation !== 'DELETE') return;

    setDestructiveBusy(true);
    setDialogNotice(null);

    try {
      if (dialog.type === 'delete') {
        const result = await deleteAccount();
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete account.');
        }
        window.location.assign('/');
        return;
      }

      await removeInstagramAccount(dialog.account.id);
      setDialog(null);
      showToast('Instagram account disconnected.');

      try {
        await refreshAccounts();
      } catch {
        setAccountNotice({
          kind: 'error',
          message: 'Account disconnected. Refresh the account list to see the latest changes.',
        });
      }
    } catch (error) {
      setDialogNotice({ kind: 'error', message: errorMessage(error) });
    } finally {
      setDestructiveBusy(false);
    }
  }

  function downloadExport(format: 'csv' | 'json') {
    setExportNotice(null);
    try {
      let content: string;
      if (format === 'json') {
        content = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            workspace: handle || null,
            count: reelList.length,
            reels: reelList,
          },
          null,
          2,
        );
      } else {
        const rows = reelList.map((reel) => record(reel));
        const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

        const escapeCSV = (value: unknown) => {
          let cell =
            value == null
              ? ''
              : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
          if (/^[\s]*[=+\-@]/.test(cell) || /^[\t\r\n]/.test(cell)) cell = `'${cell}`;
          return `"${cell.replace(/"/g, '""')}"`;
        };

        content =
          '\uFEFF' +
          [
            columns.map(escapeCSV).join(','),
            ...rows.map((row) => columns.map((column) => escapeCSV(row[column])).join(',')),
          ].join('\r\n');
      }

      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `reeldash-swipe-file-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportNotice({ kind: 'success', message: `Your ${format.toUpperCase()} download is ready.` });
      showToast('Swipe file exported.');
    } catch (error) {
      setExportNotice({ kind: 'error', message: errorMessage(error) });
    }
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <main className="min-h-screen bg-[#F7F7F4] text-zinc-900 antialiased selection:bg-[#CBD5B6]/40 dark:bg-[#0C0D10] dark:text-zinc-100">
        <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <header className="mb-10 flex flex-wrap items-end justify-between gap-6 lg:mb-12">
            <div>
              <h1 className="text-[38px] font-medium leading-[1.1] tracking-[-0.055em] sm:text-5xl">
                Settings<span className="text-zinc-300 dark:text-zinc-600"> & </span>preferences
              </h1>
              <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                A little housekeeping. A workspace that feels like you.
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-7 lg:flex-row lg:gap-10">
            <aside className="shrink-0 lg:w-64">
              <div className="lg:sticky lg:top-8">
                <p className="mb-3 hidden px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 lg:block">
                  Workspace
                </p>
                <nav
                  aria-label="Settings sections"
                  className="-mx-1 flex gap-1 overflow-x-auto p-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:p-0"
                >
                  {tabs.map(({ id, label, icon: Icon }) => {
                    const selected = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-current={selected ? 'page' : undefined}
                        onClick={() => setActiveTab(id)}
                        className={`relative flex shrink-0 items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                          selected
                            ? 'bg-white font-medium text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.035)] dark:bg-white/[0.055] dark:text-zinc-100 dark:shadow-none'
                            : 'text-zinc-500 hover:bg-black/[0.025] hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/[0.025] dark:hover:text-zinc-300'
                        }`}
                      >
                        {selected && (
                          <span className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-[#859174] dark:bg-[#BDCCA7]" />
                        )}
                        <Icon size={17} strokeWidth={1.55} />
                        {label}
                        {id === 'accounts' && accounts.length > 0 && (
                          <span className="ml-auto hidden text-[10px] tabular-nums text-zinc-400 lg:block">
                            {String(accounts.length).padStart(2, '0')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="mx-4 mt-9 hidden border-t border-black/[0.06] pt-5 dark:border-white/[0.06] lg:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.05] bg-[#E8EBE2] text-xs font-medium text-[#636D55] dark:border-white/[0.06] dark:bg-[#20251D] dark:text-[#B8C5A7]">
                      {(fullName || email || 'R').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {fullName || 'Your workspace'}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                        {handle ? `@${handle}` : 'Make room for good ideas.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1 lg:max-w-3xl">
              <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-xl shadow-black/[0.025] dark:border-white/[0.08] dark:bg-[#121316] dark:shadow-black/20 sm:p-8">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    {/* 1. CONNECTED ACCOUNTS */}
                    {activeTab === 'accounts' && (
                      <>
                        <SectionHeading
                          eyebrow="01 / Connections"
                          title="Good ideas, connected."
                          description="Bring your Instagram saves into your creative workflow. Less switching. More discovering."
                          icon={<Instagram size={22} strokeWidth={1.3} />}
                        />

                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Connected accounts
                          </h3>
                          <button
                            type="button"
                            onClick={refreshConnectedAccounts}
                            disabled={linkingBusy}
                            className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-[11px] text-zinc-400 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-40 dark:hover:text-white"
                          >
                            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                          </button>
                        </div>

                        <div className="space-y-3">
                          {accounts.length ? (
                            accounts.map((account) => (
                              <div
                                key={account.id}
                                className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/[0.07] bg-[#FAFAF8] p-4 dark:border-white/[0.09] dark:bg-[#191A1F] sm:p-5"
                              >
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-tr from-[#E8AE69] via-[#C95781] to-[#735BD3] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                                  <Instagram size={24} strokeWidth={1.7} />
                                  {account.verified && (
                                    <VerifiedMark className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#FAFAF8] p-0.5 text-[#709D7C] dark:bg-[#191A1F]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium tracking-tight">
                                    @{account.handle}
                                  </p>
                                  <span
                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      account.verified
                                        ? 'bg-[#F0FDF4] text-[#286641] dark:bg-[#101C15] dark:text-[#80CFA0]'
                                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    }`}
                                  >
                                    <span className="h-1 w-1 rounded-full bg-current" />
                                    {account.verified ? 'Active & Verified' : 'Awaiting verification'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openDialog({ type: 'unlink', account })}
                                  className="rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-red-500/5 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                >
                                  Disconnect
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] px-5 pb-6 pt-3 text-center dark:border-white/10 dark:bg-white/[0.015]">
                              <EmptyAccountsArt />
                              <h3 className="text-sm font-medium">Your next connection starts here</h3>
                              <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-500">
                                Link Instagram to give the Reels you discover a place to land.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="my-8 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

                        <div className="mb-5 flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400">
                            <Key size={16} strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">
                              {accounts.length ? 'Connect another account' : 'Link your Instagram'}
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                              One quick DM. No Instagram password required.
                            </p>
                          </div>
                        </div>

                        <div className="mb-6 rounded-2xl bg-[#F6F7F3] p-4 dark:bg-[#1A1D18] sm:p-5">
                          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            Send any Reel to{' '}
                            <a
                              href="https://www.instagram.com/reeldash/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-zinc-900 underline decoration-[#B3BBA6] underline-offset-4 dark:text-[#D2DDC3]"
                            >
                              @ReelDash
                              <ExternalLink size={11} />
                            </a>{' '}
                            on Instagram. We&apos;ll reply with your 6-digit code to link your account.
                          </p>
                        </div>

                        <form onSubmit={verifyAccount}>
                          <label htmlFor="instagram-code" className="mb-2.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Verification code
                          </label>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              id="instagram-code"
                              name="verificationCode"
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              pattern="[0-9]{6}"
                              maxLength={6}
                              required
                              value={code}
                              disabled={verifying}
                              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              aria-describedby="code-help"
                              className="h-12 min-w-0 flex-1 rounded-xl border border-black/10 bg-black/5 px-4 text-center font-mono text-lg tracking-[0.25em] outline-none transition placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-4 focus:ring-black/[0.035] dark:border-white/10 dark:bg-black/40 dark:placeholder:text-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-white/5"
                            />
                            <button
                              type="submit"
                              disabled={code.length !== 6 || linkingBusy}
                              className={primaryButton}
                            >
                              {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                              {verifying ? 'Verifying…' : 'Verify & Connect'}
                            </button>
                          </div>
                          <p id="code-help" className="mt-2.5 text-[11px] leading-5 text-zinc-400 dark:text-zinc-500">
                            Enter the code from your Instagram DM, exactly as received.
                          </p>
                        </form>

                        <InlineNotice notice={accountNotice} />

                        <div className="mt-6 border-t border-black/[0.06] pt-5 dark:border-white/[0.06]">
                          <button
                            type="button"
                            onClick={generateCode}
                            disabled={linkingBusy}
                            className="group inline-flex items-center gap-2 rounded-lg text-xs font-medium text-zinc-500 transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-40 dark:hover:text-zinc-200"
                          >
                            {generating ? <Loader2 size={13} className="animate-spin" /> : <Key size={13} />}
                            {generating ? 'Generating your code…' : 'Generate verification code instead'}
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                          </button>

                          {generatedCode && (
                            <div className="mt-4 rounded-xl border border-black/[0.07] p-4 dark:border-white/[0.08]">
                              <div className="flex items-center justify-between gap-3">
                                <code className="select-all font-mono text-xl tracking-[0.25em]">
                                  {generatedCode}
                                </code>
                                <button type="button" onClick={copyCode} className={secondaryButton} aria-label="Copy verification code">
                                  <Copy size={14} />
                                  Copy
                                </button>
                              </div>
                              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                Send this 6-digit code to @ReelDash on Instagram DM to verify.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* 2. PROFILE & WORKSPACE */}
                    {activeTab === 'profile' && (
                      <>
                        <SectionHeading
                          eyebrow="02 / Workspace"
                          title="Profile & Workspace"
                          description="Manage your account profile, workspace handle, and identity."
                          icon={<User size={22} strokeWidth={1.3} />}
                        />

                        <form onSubmit={saveProfile} className="space-y-5">
                          <div>
                            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Alex Morgan"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@company.com"
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              Workspace Handle
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-3.5 text-sm text-zinc-400">@</span>
                              <input
                                type="text"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                placeholder="creative_studio"
                                className={`${inputClass} pl-8`}
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={!profileDirty || saving}
                              className={primaryButton}
                            >
                              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                          </div>

                          <InlineNotice notice={profileNotice} />
                        </form>

                        {/* Danger Zone */}
                        <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 sm:p-6">
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle size={16} />
                            <h4 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h4>
                          </div>
                          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Delete ReelDash Account
                              </p>
                              <p className="mt-1 max-w-md text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                Permanently remove your account, swipe library, connected profiles, and data. This action is irreversible.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openDialog({ type: 'delete' })}
                              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-700"
                            >
                              <Trash2 size={14} />
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 3. PLANS & BILLING */}
                    {activeTab === 'billing' && (
                      <>
                        <SectionHeading
                          eyebrow="03 / Billing"
                          title="Plans & Billing"
                          description="Your subscription status, workspace limits, and membership."
                          icon={<Sparkles size={22} strokeWidth={1.3} />}
                        />

                        <div className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-gradient-to-br from-[#FAFAF8] to-[#F1F2ED] p-6 dark:border-white/[0.08] dark:from-[#17181D] dark:to-[#121316] sm:p-8">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5ECDB] px-3 py-1 text-[11px] font-medium text-[#46533A] dark:bg-[#20291B] dark:text-[#A7C191]">
                                <Zap size={12} />
                                {isPaid ? 'Active Plan' : 'Free Tier'}
                              </span>
                              <h3 className="mt-3 text-2xl font-medium tracking-tight">
                                {isPaid ? 'ReelDash Pro Workspace' : 'ReelDash Starter'}
                              </h3>
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {isPaid
                                  ? 'All pro features unlocked. Unlimited library and team sync.'
                                  : 'Connect up to 1 Instagram account and save up to 100 Reels.'}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-3xl font-medium tracking-tight">
                                {isPaid ? '$19' : '$0'}
                              </span>
                              <span className="text-xs text-zinc-400"> / month</span>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-black/[0.06] pt-6 dark:border-white/[0.06]">
                            <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                              Included in your plan
                            </h4>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {[
                                'Instant Instagram DM bookmarking',
                                'Unlimited reel library and archive',
                                'Custom collections and tagging',
                                'Full-text transcript search',
                                'High-speed CSV / JSON data export',
                                'Priority syncing and uptime',
                              ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                                  <Check size={14} className="text-[#6D8A58] dark:text-[#9EC480]" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* 4. APPEARANCE */}
                    {activeTab === 'appearance' && (
                      <>
                        <SectionHeading
                          eyebrow="04 / Aesthetics"
                          title="Appearance"
                          description="Customize how ReelDash looks on your screen. Choose your visual theme."
                          icon={<Sun size={22} strokeWidth={1.3} />}
                        />

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          {/* Light Mode Card */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isDark) toggleTheme();
                            }}
                            className={`group relative flex flex-col rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                              !isDark
                                ? 'border-zinc-900 bg-white ring-2 ring-zinc-900 dark:border-white dark:ring-white'
                                : 'border-black/10 bg-[#FAFAF8] opacity-75 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02]'
                            }`}
                          >
                            <div className="overflow-hidden rounded-xl border border-black/[0.06]">
                              <ThemePreview dark={false} />
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Light</p>
                                <p className="text-xs text-zinc-500">Warm editorial paper</p>
                              </div>
                              {!isDark && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                  <Check size={13} strokeWidth={2.5} />
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Dark Mode Card */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!isDark) toggleTheme();
                            }}
                            className={`group relative flex flex-col rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                              isDark
                                ? 'border-zinc-900 bg-white ring-2 ring-zinc-900 dark:border-white dark:bg-[#191A1F] dark:ring-white'
                                : 'border-black/10 bg-[#FAFAF8] opacity-75 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02]'
                            }`}
                          >
                            <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                              <ThemePreview dark={true} />
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Dark</p>
                                <p className="text-xs text-zinc-500">Obsidian studio dark</p>
                              </div>
                              {isDark && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                  <Check size={13} strokeWidth={2.5} />
                                </span>
                              )}
                            </div>
                          </button>
                        </div>
                      </>
                    )}

                    {/* 5. DATA EXPORT */}
                    {activeTab === 'export' && (
                      <>
                        <SectionHeading
                          eyebrow="05 / Portability"
                          title="Data Export"
                          description="Download your complete swipe file and saved reels anytime. Your data belongs to you."
                          icon={<Download size={22} strokeWidth={1.3} />}
                        />

                        <div className="mb-6 rounded-2xl border border-black/[0.06] bg-[#FAFAF8] p-5 dark:border-white/[0.08] dark:bg-[#18191E]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-zinc-400">Library Summary</p>
                              <p className="mt-1 text-2xl font-medium font-bricolage tabular-nums tracking-tight">
                                {reelList.length} <span className="text-sm font-normal font-sans text-zinc-500">reels saved</span>
                              </p>
                            </div>
                            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-mono text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                              UTF-8 Encoded
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex flex-col justify-between rounded-2xl border border-black/[0.07] p-5 dark:border-white/[0.08]">
                            <div>
                              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <FileSpreadsheet size={20} />
                              </div>
                              <h4 className="text-sm font-medium">CSV Spreadsheet</h4>
                              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                Best for Excel, Google Sheets, Notion databases, and Airtable.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadExport('csv')}
                              className={`${secondaryButton} mt-5 w-full`}
                            >
                              <Download size={14} />
                              Download CSV
                            </button>
                          </div>

                          <div className="flex flex-col justify-between rounded-2xl border border-black/[0.07] p-5 dark:border-white/[0.08]">
                            <div>
                              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <FileCode size={20} />
                              </div>
                              <h4 className="text-sm font-medium">JSON Document</h4>
                              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                Best for developers, custom scripts, backups, and API integrations.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadExport('json')}
                              className={`${secondaryButton} mt-5 w-full`}
                            >
                              <Download size={14} />
                              Download JSON
                            </button>
                          </div>
                        </div>

                        <InlineNotice notice={exportNotice} />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {dialog && (
          <Modal
            title={
              dialog.type === 'delete'
                ? 'Delete ReelDash Account?'
                : `Disconnect @${dialog.account.handle}?`
            }
            busy={destructiveBusy}
            onClose={() => {
              if (!destructiveBusy) setDialog(null);
            }}
          >
            <form onSubmit={confirmDestructiveAction} className="mt-4 space-y-4">
              {dialog.type === 'delete' ? (
                <>
                  <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    This action is permanent. All your saved Reels, categories, connected Instagram accounts, and personal data will be completely erased.
                  </p>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className={inputClass}
                      autoFocus
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to disconnect @{dialog.account.handle}? New Reels sent from this account will no longer be captured until reconnected.
                </p>
              )}

              <InlineNotice notice={dialogNotice} />

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={destructiveBusy}
                  onClick={() => setDialog(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    destructiveBusy ||
                    (dialog.type === 'delete' && deleteConfirmation !== 'DELETE')
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
                >
                  {destructiveBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {dialog.type === 'delete' ? 'Permanently Delete' : 'Disconnect Account'}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}