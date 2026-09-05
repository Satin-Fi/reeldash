"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsNotificationOpen(false);
      }
    }
    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
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
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-full aspect-square border border-borderSubtle-light dark:border-white/[0.08] bg-surfaceSecondary-light dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/[0.08] flex items-center justify-center text-secondaryText-light dark:text-[#AEB2BF] hover:text-primaryText-light dark:hover:text-white transition-all cursor-pointer relative"
        title="Notifications"
        aria-label="View notifications"
        aria-expanded={isNotificationOpen}
      >
        <Bell className="w-[16px] sm:w-[17px] h-[16px] sm:h-[17px]" strokeWidth={1.8} />

        {/* Unread Counter Badge */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-light dark:ring-[#0D0F12] shadow-sm animate-in zoom-in-50 duration-200">
            {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
          </span>
        )}
      </motion.button>

      {/* Notification Center Dropdown */}
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-[390px] max-w-[420px] bg-surface-light dark:bg-[#111419] border border-borderSubtle-light dark:border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden text-primaryText-light dark:text-zinc-100 flex flex-col max-h-[85vh] sm:max-h-[540px]"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-borderSubtle-light dark:border-white/[0.06] flex items-center justify-between bg-surfaceSecondary-light/50 dark:bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-primaryText-light dark:text-white font-bricolage">
                    Notifications
                  </h3>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {unreadNotificationsCount} new
                  </span>
                )}
              </div>

              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-1 border-b border-borderSubtle-light dark:border-white/[0.04]">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === "all"
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === "media"
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Saved Media ({notifications.filter((n) => n.type !== "new_account").length})
              </button>
              <button
                onClick={() => setActiveTab("accounts")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === "accounts"
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-secondaryText-light dark:text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Accounts ({notifications.filter((n) => n.type === "new_account").length})
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 divide-y divide-borderSubtle-light/40 dark:divide-white/[0.04] custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center text-zinc-500">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-primaryText-light dark:text-white">
                    No notifications in this view
                  </p>
                  <p className="text-[11px] text-secondaryText-light dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    When you save reels, photo posts, or connect new Instagram handles, activity alerts will appear here.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isAccount = notif.type === "new_account";
                  const isAudio = notif.type === "saved_audio";
                  const isPost = notif.type === "saved_post";

                  return (
                    <motion.div
                      key={notif.id}
                      whileHover={{ x: 2 }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 relative ${
                        !notif.read
                          ? "bg-brand-500/[0.06] dark:bg-brand-500/[0.1] border border-brand-500/20"
                          : "hover:bg-surfaceSecondary-light dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Left: Avatar / Thumbnail */}
                      <div className="relative shrink-0">
                        {isAccount ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center shadow-md">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                              <Instagram className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : notif.thumbnailUrl ? (
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-black border border-white/10 relative shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={notif.thumbnailUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-3.5 h-3.5 fill-white text-white drop-shadow-md" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                            {isAudio ? (
                              <Music2 className="w-4 h-4" />
                            ) : isPost ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <Film className="w-4 h-4" />
                            )}
                          </div>
                        )}

                        {/* Media type mini badge */}
                        {!isAccount && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-zinc-300">
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
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-semibold text-primaryText-light dark:text-white truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        </div>

                        <p className="text-[11px] text-secondaryText-light dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {notif.description}
                        </p>

                        <div className="mt-1.5 flex items-center space-x-2 text-[10px] font-medium text-brand-600 dark:text-brand-400">
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
                        <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 self-center shadow-xs shadow-brand-500/50" />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 px-4 border-t border-borderSubtle-light dark:border-white/[0.06] bg-surfaceSecondary-light/30 dark:bg-white/[0.01] flex items-center justify-between text-[11px] text-zinc-400">
              <span>Auto-synced with Instagram DM bot</span>
              <button
                onClick={() => {
                  setIsNotificationOpen(false);
                  router.push("/settings");
                }}
                className="text-brand-500 hover:underline cursor-pointer"
              >
                Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
