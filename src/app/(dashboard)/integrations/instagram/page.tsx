"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useReels } from "@/context/ReelContext";
import { motion } from "framer-motion";

const ease = [0.32, 0.72, 0, 1];

const REELDASH_IG_HANDLE = "@ReelDash_app";

const steps = [
  {
    n: "01",
    title: "Connect your Instagram username",
    desc: "Enter your Instagram handle below. When you DM a Reel to @ReelDash_app, we match your Instagram ID to your library.",
    action: "input",
  },
  {
    n: "02",
    title: "Follow @ReelDash_app on Instagram",
    desc: "You need to follow our account so we can send you confirmation DMs back.",
    action: "link",
    href: "https://instagram.com/ReelDash_app",
  },
  {
    n: "03",
    title: "Send any Reel to @ReelDash_app",
    desc: "Open any Reel → Share → Send message → search \"ReelDash\" → tap Send. That's it.",
    action: "none",
  },
  {
    n: "04",
    title: "Reel appears in your library",
    desc: "Within seconds, the Reel is saved, categorized, and searchable in your dashboard.",
    action: "link",
    href: "/dashboard",
  },
];

export default function InstagramIntegrationPage() {
  const { showToast } = useReels();
  const [igUsername, setIgUsername] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = "https://reeldash-nine.vercel.app/api/instagram/webhook";

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveUsername() {
    if (!igUsername.replace("@", "").trim()) return;
    // In production: save to Supabase profiles table
    setSaved(true);
    showToast(`✓ Instagram @${igUsername.replace("@", "")} linked to your account`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">

      {/* Back nav */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[13px] text-secondaryText-dark hover:text-primaryText-dark transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Back to Settings
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="space-y-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-rd-xl bg-gradient-to-br from-purple-600 via-rose-500 to-amber-500 flex items-center justify-center shrink-0 shadow-rd-glow">
            <MessageCircle className="w-6 h-6 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primaryText-dark">
              Instagram DM Integration
            </h1>
            <p className="text-[13px] text-secondaryText-dark mt-1">
              Send any Reel to <span className="text-brand-400 font-medium">{REELDASH_IG_HANDLE}</span> on Instagram and it's instantly saved to your ReelDash library.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Username linking */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease }}
        className="p-[5px] rounded-rd-xl bg-white/[0.02] border border-white/[0.05]"
      >
        <div className="p-6 rounded-[13px] bg-surface-dark border border-borderSubtle-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-primaryText-dark">Link your Instagram account</h2>
              <p className="text-[12px] text-secondaryText-dark mt-0.5">
                Enter your handle so we can match your DMs to your library.
              </p>
            </div>
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[12px] font-medium">
                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                Connected
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mutedText-dark text-[13px]">@</span>
              <input
                type="text"
                value={igUsername}
                onChange={(e) => { setIgUsername(e.target.value.replace("@", "")); setSaved(false); }}
                placeholder="your_handle"
                className="w-full pl-7 pr-3 py-2.5 bg-surfaceSecondary-dark border border-borderSubtle-dark hover:border-borderDefault-dark focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 rounded-rd-lg text-[13px] text-primaryText-dark placeholder:text-mutedText-dark outline-none transition-all duration-200"
              />
            </div>
            <button
              onClick={saveUsername}
              disabled={!igUsername.trim()}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-rd-lg transition-all duration-200 active:scale-[0.97] cursor-pointer"
            >
              Link account
            </button>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-mutedText-dark p-3 bg-surfaceSecondary-dark rounded-rd-md border border-borderSubtle-dark">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" strokeWidth={1.75} />
            <span>Your Instagram handle is only used to match DMs to your library. We never post on your behalf.</span>
          </div>
        </div>
      </motion.div>

      {/* Step-by-step */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease }}
        className="space-y-3"
      >
        <h2 className="text-[14px] font-semibold text-primaryText-dark">How it works</h2>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 p-4 bg-surface-dark border border-borderSubtle-dark rounded-rd-xl hover:border-borderDefault-dark transition-colors">
              <span className="text-3xl font-bold tracking-tighter text-brand-500/20 shrink-0 leading-none mt-0.5">
                {step.n}
              </span>
              <div className="flex-1 space-y-1.5">
                <h3 className="text-[13px] font-semibold text-primaryText-dark">{step.title}</h3>
                <p className="text-[12px] text-secondaryText-dark leading-relaxed">{step.desc}</p>

                {step.action === "input" && igUsername && saved && (
                  <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-[12px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    @{igUsername} linked
                  </div>
                )}

                {step.action === "link" && step.href && (
                  <Link
                    href={step.href}
                    target={step.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    {step.href.startsWith("http") ? "Open on Instagram" : "Go to dashboard"}
                    {step.href.startsWith("http") ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Developer webhook info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease }}
        className="p-5 bg-surfaceSecondary-dark border border-borderSubtle-dark rounded-rd-xl space-y-3"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-400" strokeWidth={1.75} />
          <h3 className="text-[13px] font-semibold text-primaryText-dark">Webhook endpoint</h3>
          <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
            active
          </span>
        </div>
        <p className="text-[12px] text-secondaryText-dark">
          Configure this URL in your Meta app's Messenger webhook settings:
        </p>
        <div className="flex items-center gap-2 p-3 bg-surface-dark border border-borderSubtle-dark rounded-rd-lg font-mono text-[11px] text-secondaryText-dark">
          <span className="flex-1 truncate">{webhookUrl}</span>
          <button
            onClick={copyWebhook}
            className="flex items-center gap-1 text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors shrink-0"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[11px] text-mutedText-dark">
          Verify token:{" "}
          <code className="px-1.5 py-0.5 bg-surfaceTertiary-dark rounded text-primaryText-dark font-mono">
            reeldash_webhook_2026
          </code>
          {" "}— set as <code className="px-1.5 py-0.5 bg-surfaceTertiary-dark rounded text-primaryText-dark font-mono">INSTAGRAM_VERIFY_TOKEN</code> in Vercel.
        </p>
      </motion.div>
    </div>
  );
}
