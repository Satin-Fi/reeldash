"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Search,
  MessageCircle,
  Film,
  BookOpen,
  ChevronRight,
  Play,
} from "lucide-react";

const ease = [0.32, 0.72, 0, 1];

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: MessageCircle,
    label: "DM to Save",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    desc: "Send any Reel to @ReelDash_app on Instagram. It appears in your library within seconds — no copy-paste needed.",
  },
  {
    icon: Zap,
    label: "Auto-Categorized",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    desc: "AI reads captions, hashtags, and creator metadata. Every Reel is filed under the right category automatically.",
  },
  {
    icon: Search,
    label: "Search Anything",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    desc: "Find that recipe Reel from 3 months ago. Search by topic, creator, keyword, or your own notes.",
  },
  {
    icon: BookOpen,
    label: "Browse Creators",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    desc: "Search any public Instagram account and browse their posts directly inside ReelDash.",
  },
];

const stats = [
  { value: "2s", label: "DM to saved" },
  { value: "100%", label: "Free forever" },
  { value: "0", label: "Ads, ever" },
];

export default function LandingPage() {
  // Dark mode by default for landing
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {}; // keep dark on leave — user picks in dashboard
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background-dark text-primaryText-dark selection:bg-brand-500/30 selection:text-white overflow-x-hidden">

      {/* Ambient mesh gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-dark-mesh" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-500/4 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/3 blur-[100px]" />
      </div>

      {/* ─── NAV ─── */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-rd-md bg-brand-500 flex items-center justify-center shadow-rd-glow shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-primaryText-dark">ReelDash</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {["Features", "How it works", "Creators"].map((item) => (
            <button key={item} className="px-3.5 py-2 text-[13px] text-secondaryText-dark hover:text-primaryText-dark transition-colors duration-200">
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-[13px] text-secondaryText-dark hover:text-primaryText-dark transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-semibold rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] shadow-rd-glow"
          >
            Get started free
            <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-medium uppercase tracking-[0.14em]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
                Free public beta
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.03em] leading-[1.05]"
            >
              Your Reels.
              <br />
              <span className="text-brand-400">Organized.</span>
              <br />
              Instantly.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              className="text-[15px] text-secondaryText-dark leading-relaxed max-w-[420px]"
            >
              Stop losing Reels you loved. Send any Reel to{" "}
              <span className="text-brand-400 font-medium">@ReelDash_app</span> on Instagram and
              it's instantly saved, categorized, and searchable in your personal library.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-[14px] font-semibold rounded-rd-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] shadow-rd-glow"
              >
                Start free — no card needed
                <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
              <Link
                href="/demo"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surfaceSecondary-dark border border-borderSubtle-dark hover:border-borderDefault-dark text-[14px] font-medium rounded-rd-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <Play className="w-4 h-4" />
                Live demo
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25, ease }}
              className="flex items-center gap-8 pt-2"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold tracking-tight text-primaryText-dark">{s.value}</p>
                  <p className="text-[11px] text-mutedText-dark mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Product preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="relative hidden md:block"
          >
            {/* Outer bezel */}
            <div className="p-[6px] rounded-[22px] bg-white/[0.03] border border-white/[0.06] shadow-rd-dark">
              {/* Inner card */}
              <div className="rounded-[17px] bg-surface-dark border border-borderSubtle-dark overflow-hidden shadow-rd-inner">
                {/* Mock top bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-borderSubtle-dark">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-rd-sm bg-brand-500 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[12px] font-semibold text-primaryText-dark">ReelDash</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-mutedText-dark bg-surfaceSecondary-dark px-3 py-1.5 rounded-rd-md border border-borderSubtle-dark">
                    <Search className="w-3 h-3" />
                    Search your Reels...
                    <kbd className="ml-1 px-1 py-0.5 rounded bg-surfaceTertiary-dark text-[9px] font-mono">⌘K</kbd>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-[10px] font-bold text-brand-400">
                    PK
                  </div>
                </div>
                {/* Mock reel grid */}
                <div className="p-3 grid grid-cols-3 gap-2">
                  {[
                    { color: "from-violet-900 to-purple-800", label: "@fitlife" },
                    { color: "from-rose-900 to-pink-800", label: "@chef_rami" },
                    { color: "from-sky-900 to-blue-800", label: "@devtips" },
                    { color: "from-amber-900 to-orange-800", label: "@travelwith" },
                    { color: "from-emerald-900 to-green-800", label: "@codeaday" },
                    { color: "from-indigo-900 to-brand-800", label: "@lifestyle" },
                  ].map((card, i) => (
                    <div key={i} className={`aspect-[9/16] rounded-rd-md bg-gradient-to-b ${card.color} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-1.5 left-1.5">
                        <span className="px-1.5 py-0.5 rounded-full bg-violet-500/80 text-[8px] font-medium text-white">Reel</span>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <p className="text-[9px] text-white/80 font-medium truncate">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating DM badge */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease }}
              className="absolute -bottom-4 -left-6 flex items-center gap-2.5 px-4 py-2.5 bg-surfaceSecondary-dark border border-borderDefault-dark rounded-rd-xl shadow-rd-dark"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-primaryText-dark">Reel saved ✓</p>
                <p className="text-[10px] text-mutedText-dark">via Instagram DM</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <FadeUp className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.025em]">
            Everything your Reels deserve
          </h2>
          <p className="mt-3 text-[14px] text-secondaryText-dark max-w-md mx-auto">
            Built around how you actually discover and consume Instagram content.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeUp key={f.label} delay={i * 0.07}>
                {/* Double bezel card */}
                <div className="p-[5px] rounded-rd-xl bg-white/[0.02] border border-white/[0.05] h-full">
                  <div className="h-full p-5 rounded-[13px] bg-surface-dark border border-borderSubtle-dark shadow-rd-inner space-y-4">
                    <div className={`w-9 h-9 rounded-rd-md ${f.bg} border ${f.border} flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${f.color}`} strokeWidth={1.75} />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-[13px] font-semibold text-primaryText-dark">{f.label}</h3>
                      <p className="text-[12px] text-secondaryText-dark leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <FadeUp className="max-w-lg">
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.025em] mb-2">
            Works in 2 steps
          </h2>
          <p className="text-[14px] text-secondaryText-dark">
            No extensions. No copy-paste. Just send a DM.
          </p>
        </FadeUp>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {[
            {
              step: "01",
              title: "Send the Reel to @ReelDash_app",
              desc: "While browsing Instagram, tap Share → Send to @ReelDash_app. Or paste any Instagram reel link directly in the app.",
              color: "brand",
            },
            {
              step: "02",
              title: "It's in your library instantly",
              desc: "ReelDash fetches metadata, auto-categorizes it, and sends you a confirmation DM. Open your dashboard on any device.",
              color: "emerald",
            },
          ].map((item, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="p-[5px] rounded-rd-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="p-6 rounded-[13px] bg-surface-dark border border-borderSubtle-dark shadow-rd-inner space-y-4">
                  <span className={`text-5xl font-bold tracking-tighter ${item.color === "brand" ? "text-brand-500/20" : "text-emerald-500/20"}`}>
                    {item.step}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-[15px] font-semibold text-primaryText-dark">{item.title}</h3>
                    <p className="text-[13px] text-secondaryText-dark leading-relaxed">{item.desc}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${item.color === "brand" ? "text-brand-400" : "text-emerald-400"}`} />
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <FadeUp>
          <div className="p-[5px] rounded-[22px] bg-brand-500/10 border border-brand-500/20">
            <div className="p-10 md:p-16 rounded-[18px] bg-surface-dark border border-brand-500/10 text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-violet-500/5 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-400 text-[11px] font-medium uppercase tracking-[0.14em]">
                  <Film className="w-3 h-3" />
                  Start free today
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em]">
                  Build your Reel library.
                  <br />
                  <span className="text-brand-400">Stop losing content you love.</span>
                </h2>
                <p className="text-[14px] text-secondaryText-dark max-w-sm mx-auto">
                  Free forever. No credit card. Starts working from your first DM.
                </p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2.5 px-7 py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-[14px] font-semibold rounded-rd-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] shadow-rd-glow"
                >
                  Create free account
                  <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-borderSubtle-dark py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-rd-sm bg-brand-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-primaryText-dark">ReelDash</span>
          </div>
          <p className="text-[12px] text-mutedText-dark">
            © 2026 ReelDash. Not affiliated with Instagram or Meta.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms"].map((l) => (
              <button key={l} className="text-[12px] text-mutedText-dark hover:text-secondaryText-dark transition-colors">
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
