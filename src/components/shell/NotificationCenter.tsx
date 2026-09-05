"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { AppNotification } from "@/types/reel";
import {
  Bell,
  CheckCheck,
  Film,
  Image as ImageIcon,
  Music2,
  Instagram,
  Play,
  Inbox,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Standalone notification bell trigger button with live counter badge.
 */
export function NotificationBellButton({
  className,
  iconSize = 16,
}: {
  className?: string;
  iconSize?: number;
}) {
  const { unreadNotificationsCount, setIsNotificationOpen } = useReels();

  return (
    <button
      type="button"
      onClick={() => setIsNotificationOpen(true)}
      className={
        className ||
        "w-9 h-9 rounded-full bg-white dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-center text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-white transition-colors relative cursor-pointer"
      }
      title="Notifications & Activity"
      aria-label="Open notifications & activity"
    >
      <Bell style={{ width: iconSize, height: iconSize }} strokeWidth={1.6} />
      {unreadNotificationsCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-surface-dark shadow-xs animate-in zoom-in-50 duration-200">
          {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
        </span>
      )}
    </button>
  );
}

/**
 * Global Notification Center Slide-Over Drawer
 * Managed via ReelContext (`isNotificationOpen`, `setIsNotificationOpen`)
 */
export function NotificationCenter() {
  const {
    notifications,
    unreadNotificationsCount,
    isNotificationOpen,
    setIsNotificationOpen,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    reels,
    setActiveNotificationReel,
  } = useReels();

  const [activeTab, setActiveTab] = useState<"all" | "media" | "accounts">("all");
  const router = useRouter();

  // Close drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isNotificationOpen) {
        setIsNotificationOpen(false);
      }
    }
    if (isNotificationOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isNotificationOpen, setIsNotificationOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "media") {
      return n.type === "saved_reel" || n.type === "saved_post" || n.type === "saved_audio";
    }
    if (activeTab === "accounts") {
      return n.type === "new_account";
    }
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    setIsNotificationOpen(false);

    if (notif.reelId) {
      const matched = reels.find((r) => r.id === notif.reelId || r.shortcode === notif.shortcode);
      if (matched) {
        setActiveNotificationReel(matched);
        return;
      }
    }

    if (notif.type === "new_account") {
      if (notif.accountUsername) {
        router.push(`/creator/${notif.accountUsername}`);
      } else {
        router.push("/settings");
      }
    }
  };

  return (
    <AnimatePresence>
      {isNotificationOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsNotificationOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <motion.aside
            role="dialog"
            aria-label="Notifications panel"
            aria-modal="true"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative z-10 w-full sm:w-[440px] max-w-full h-full bg-[#FAFAF9] dark:bg-[#111419] border-l border-black/[0.08] dark:border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-primaryText-light dark:text-zinc-100"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#14181F] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-primaryText-light dark:text-white font-bricolage tracking-tight">
                      Activity & Alerts
                    </h2>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {unreadNotificationsCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-secondaryText-light dark:text-zinc-400">
                    Saved reels, photo posts, and synced accounts
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </button>
                )}

                <button
                  onClick={() => setIsNotificationOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-secondaryText-light dark:text-zinc-400 hover:text-primaryText-light dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Close notifications (Esc)"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/50 dark:bg-[#14181F]/50 shrink-0">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  activeTab === "media"
                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                Saved Media ({notifications.filter((n) => n.type !== "new_account").length})
              </button>
              <button
                onClick={() => setActiveTab("accounts")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  activeTab === "accounts"
                    ? "bg-brand-600 text-white shadow-xs font-semibold"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                Accounts ({notifications.filter((n) => n.type === "new_account").length})
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 mx-auto flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-primaryText-light dark:text-white">
                      No notifications in this view
                    </h3>
                    <p className="text-[11px] text-secondaryText-light dark:text-zinc-400 max-w-xs mx-auto leading-relaxed mt-1">
                      When you save reels, photo posts, or connect new Instagram handles, activity alerts will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isAccount = notif.type === "new_account";
                  const isAudio = notif.type === "saved_audio";
                  const isPost = notif.type === "saved_post";

                  return (
                    <motion.div
                      key={notif.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 relative border ${
                        !notif.read
                          ? "bg-brand-500/[0.06] dark:bg-brand-500/[0.1] border-brand-500/25 shadow-xs"
                          : "bg-white dark:bg-[#161A22] border-black/[0.04] dark:border-white/[0.05] hover:border-black/[0.1] dark:hover:border-white/[0.1] hover:shadow-xs"
                      }`}
                    >
                      {/* Left: Avatar / Thumbnail */}
                      <div className="relative shrink-0">
                        {isAccount ? (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center shadow-md">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                              <Instagram className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : notif.thumbnailUrl ? (
                          <div className="w-11 h-15 rounded-xl overflow-hidden bg-black border border-black/10 dark:border-white/10 relative shadow-xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={notif.thumbnailUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-3.5 h-3.5 fill-white text-white drop-shadow-md" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20">
                            {isAudio ? (
                              <Music2 className="w-5 h-5" />
                            ) : isPost ? (
                              <ImageIcon className="w-5 h-5" />
                            ) : (
                              <Film className="w-5 h-5" />
                            )}
                          </div>
                        )}

                        {/* Media type mini badge */}
                        {!isAccount && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-zinc-300 shadow-xs">
                            {isAudio ? (
                              <Music2 className="w-2.5 h-2.5 text-emerald-400" />
                            ) : isPost ? (
                              <ImageIcon className="w-2.5 h-2.5 text-blue-400" />
                            ) : (
                              <Film className="w-2.5 h-2.5 text-brand-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Middle: Content details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h3 className="text-xs font-semibold text-primaryText-light dark:text-white truncate">
                            {notif.title}
                          </h3>
                          <span className="text-[10px] text-mutedText-light dark:text-zinc-500 shrink-0 font-medium">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        </div>

                        <p className="text-[11px] text-secondaryText-light dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {notif.description}
                        </p>

                        <div className="mt-2 flex items-center space-x-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                          {isAccount ? (
                            <span>View Account Profile &rarr;</span>
                          ) : (
                            <span className="flex items-center space-x-1 group-hover:underline">
                              <span>Watch now</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Unread Dot Indicator */}
                      {!notif.read && (
                        <div
                          className="w-2 h-2 rounded-full bg-brand-500 shrink-0 self-center shadow-xs shadow-brand-500/50"
                          title="Unread"
                        />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 px-4 border-t border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#14181F] flex items-center justify-between text-[11px] text-secondaryText-light dark:text-zinc-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-brand-500" />
                <span>Auto-synced with Instagram DM bot</span>
              </span>
              <button
                onClick={() => {
                  setIsNotificationOpen(false);
                  router.push("/integrations/instagram");
                }}
                className="text-brand-600 dark:text-brand-400 font-medium hover:underline cursor-pointer"
              >
                DM Bot Settings
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

