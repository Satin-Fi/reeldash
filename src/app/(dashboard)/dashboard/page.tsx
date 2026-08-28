"use client";

import React from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import { ReelGrid } from "@/components/reels/ReelGrid";
import { Plus, Film, Heart, Zap, ArrowRight, MessageCircle, Search, Layers } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.32, 0.72, 0, 1];

const statCards = [
  { label: "Reels", key: "reel",  color: "text-violet-400", bg: "bg-violet-500/10", border: "hover:border-violet-500/30", href: "/reels?type=reel",  icon: Film },
  { label: "Posts",  key: "post",  color: "text-sky-400",    bg: "bg-sky-500/10",    border: "hover:border-sky-500/30",    href: "/reels?type=post",  icon: Layers },
  { label: "Favs",   key: "favs",  color: "text-rose-400",   bg: "bg-rose-500/10",   border: "hover:border-rose-500/30",   href: "/favorites",        icon: Heart },
  { label: "Total",  key: "all",   color: "text-brand-400",  bg: "bg-brand-500/10",  border: "hover:border-brand-500/30",  href: "/reels?type=all",   icon: Layers },
];

export default function DashboardPage() {
  const { reels, favorites, collections, setIsSaveModalOpen } = useReels();
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Still up?" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const recentlySaved = [...reels]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  const counts: Record<string, number> = {
    reel: reels.filter((r) => !r.mediaType || r.mediaType === "reel").length,
    post: reels.filter((r) => r.mediaType === "post").length,
    favs: favorites.length,
    all:  reels.length,
  };

  return (
    <div className="space-y-8 pb-8">

      {/* ─── Greeting header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-[12px] text-mutedText-dark font-medium uppercase tracking-[0.1em] mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-primaryText-dark">
            {greeting}, {user?.name?.split(" ")[0] || "there"}
          </h1>
        </div>
        <button
          onClick={() => setIsSaveModalOpen(true)}
          className="group flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-[0.97] text-white text-[13px] font-semibold rounded-rd-lg transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer shadow-rd-glow shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Save Reel
        </button>
      </motion.div>

      {/* ─── Stats row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`group p-4 bg-surface-dark border border-borderSubtle-dark ${card.border} rounded-rd-xl shadow-rd-subtle hover:shadow-rd-card transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)]`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-rd-md ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-250`}>
                  <Icon className={`w-4 h-4 ${card.color}`} strokeWidth={1.75} />
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${card.color} opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200`} />
              </div>
              <p className="text-2xl font-bold font-mono tracking-tight text-primaryText-dark">
                {counts[card.key]}
              </p>
              <p className="text-[11px] text-mutedText-dark mt-0.5">{card.label}</p>
            </Link>
          );
        })}
      </motion.div>

      {/* ─── Content: Recently saved OR empty state ─── */}
      {reels.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12, ease }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-primaryText-dark tracking-tight">Recently saved</h2>
            <Link
              href="/reels"
              className="flex items-center gap-1 text-[12px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ReelGrid reels={recentlySaved} />
        </motion.div>
      ) : (
        /* ─── Zero-data empty state ─── */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          {/* Double bezel empty state */}
          <div className="p-[5px] rounded-[22px] bg-brand-500/5 border border-brand-500/15">
            <div className="p-10 md:p-16 rounded-[18px] bg-surface-dark border border-borderSubtle-dark text-center space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/4 via-transparent to-transparent pointer-events-none" />

              {/* Icon */}
              <div className="relative z-10 flex justify-center">
                <div className="w-16 h-16 rounded-[20px] bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Film className="w-7 h-7 text-brand-400" strokeWidth={1.5} />
                </div>
              </div>

              <div className="relative z-10 space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-primaryText-dark">
                  Your Reel library starts here
                </h3>
                <p className="text-[14px] text-secondaryText-dark max-w-sm mx-auto leading-relaxed">
                  Paste an Instagram Reel link, or DM any Reel to{" "}
                  <span className="text-brand-400 font-medium">@ReelDash_app</span> on Instagram.
                </p>
              </div>

              {/* Quick actions grid */}
              <div className="relative z-10 grid sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                {[
                  {
                    icon: Plus,
                    label: "Paste a link",
                    desc: "Add any Instagram reel URL",
                    action: () => setIsSaveModalOpen(true),
                    color: "text-brand-400",
                    bg: "bg-brand-500/10",
                  },
                  {
                    icon: MessageCircle,
                    label: "DM to save",
                    desc: "Send reels via @ReelDash_app",
                    href: "/integrations/instagram",
                    color: "text-violet-400",
                    bg: "bg-violet-500/10",
                  },
                  {
                    icon: Search,
                    label: "Browse creator",
                    desc: "Search any Instagram account",
                    href: "/search",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  const inner = (
                    <div className="p-4 rounded-rd-xl bg-surfaceSecondary-dark border border-borderSubtle-dark hover:border-borderDefault-dark transition-all duration-200 text-left space-y-2 cursor-pointer group">
                      <div className={`w-8 h-8 rounded-rd-md ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-4 h-4 ${item.color}`} strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-primaryText-dark">{item.label}</p>
                        <p className="text-[11px] text-mutedText-dark mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );

                  return item.href ? (
                    <Link key={i} href={item.href}>{inner}</Link>
                  ) : (
                    <button key={i} onClick={item.action} className="text-left">{inner}</button>
                  );
                })}
              </div>

              <div className="relative z-10">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-1.5 text-[12px] text-mutedText-dark hover:text-secondaryText-dark transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Or explore demo mode first
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Collections shortcut (only if user has some) ─── */}
      {collections.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2, ease }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-primaryText-dark tracking-tight">Collections</h2>
            <Link href="/collections" className="flex items-center gap-1 text-[12px] font-medium text-brand-400 hover:text-brand-300 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {collections.slice(0, 4).map((col) => (
              <Link
                key={col.id}
                href="/collections"
                className="flex items-center gap-3 p-3 bg-surface-dark border border-borderSubtle-dark hover:border-borderDefault-dark rounded-rd-xl transition-all duration-200 group"
              >
                <span className="text-xl">{col.icon || "📁"}</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-primaryText-dark truncate">{col.name}</p>
                  <p className="text-[10px] text-mutedText-dark">{col.reelCount} reels</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
