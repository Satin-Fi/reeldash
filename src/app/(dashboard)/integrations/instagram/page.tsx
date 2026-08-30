"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Copy,
  Zap,
  Instagram,
  ShieldCheck,
  Send,
  UserCheck,
  UserX,
  Bot,
  RefreshCw,
  ExternalLink,
  Film,
} from "lucide-react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";

const REELDASH_IG_HANDLE = "@ReelDash_app";

const steps = [
  {
    n: "1",
    title: "User DMs @ReelDash",
    desc: "A user sends any message or Reel link to @ReelDash on Instagram.",
  },
  {
    n: "2",
    title: "Follower Check & Welcome",
    desc: "If not following, the bot replies: 'Please follow @reeldash to activate sync'.",
  },
  {
    n: "3",
    title: "Automatic Profile Creation",
    desc: "When the user follows @reeldash, ReelDash auto-provisions their library profile.",
  },
  {
    n: "4",
    title: "Reel Auto-Saved to Library",
    desc: "Any Reel sent is automatically parsed and saved with instant DM confirmation.",
  },
];

interface DmMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  status?: string;
  profileCreated?: boolean;
  buttons?: Array<{
    type: "postback" | "web_url";
    title: string;
    payload?: string;
    url?: string;
  }>;
}

export default function InstagramIntegrationPage() {
  const { showToast, saveReel } = useReels();
  const { user, updateUser } = useAuth();
  const [igUsername, setIgUsername] = useState(user?.instagramUsername || "");
  const [isSaved, setIsSaved] = useState(!!user?.instagramUsername);
  const [copied, setCopied] = useState(false);

  // Simulator State
  const [simSender, setSimSender] = useState(user?.instagramUsername || "crypto_investor");
  const [simIsFollowing, setSimIsFollowing] = useState(false);
  const [simMessage, setSimMessage] = useState("https://www.instagram.com/reel/DbZkDwZsHgd/");
  const [simLoading, setSimLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<DmMessage[]>([
    {
      id: "initial-1",
      sender: "bot",
      text: "⚡ ReelDash Instagram Bot Online. Send any message or Reel link to test the follower check & auto-save flow.",
      timestamp: "Just now",
    },
  ]);

  const webhookUrl = "https://reeldash-nine.vercel.app/api/instagram/webhook";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    showToast("Webhook URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = igUsername.replace("@", "").trim();
    if (!clean) return;

    updateUser({ instagramUsername: clean });
    setIsSaved(true);
    showToast(`Linked Instagram account @${clean}`);
  };

  const sendDm = async (text: string, postbackPayload?: string, overrideFollowing?: boolean) => {
    const userMsg: DmMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setSimLoading(true);

    try {
      const isFollow = overrideFollowing !== undefined ? overrideFollowing : simIsFollowing;
      const res = await fetch("/api/instagram/bot-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: simSender.replace("@", "").trim() || "instagram_user",
          senderIgId: `sim_ig_${simSender.replace(/[^a-zA-Z0-9]/g, "")}`,
          message: text,
          isFollowing: isFollow,
          postbackPayload,
        }),
      });

      const data = await res.json();
      const result = data?.result;

      if (data?.isFollowing && !simIsFollowing) {
        setSimIsFollowing(true);
      }

      const botReplyText =
        result?.replyMessage ||
        result?.replySent ||
        (result?.status === "follow_required"
          ? "Oh no! You aren't following, so ReelDash sync won't activate. ✨\n\nMake sure you're following so we can auto-save any Reel you send!"
          : "⚡ Saved to your ReelDash library!");

      const botMsg: DmMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: result?.status,
        profileCreated: result?.status === "profile_created" || result?.status === "reel_saved" || result?.isFollowing,
        buttons: result?.buttons,
      };

      setChatHistory((prev) => [...prev, botMsg]);

      // If reel was saved in simulation, also save into active local library
      if (result?.status === "reel_saved" && text.includes("instagram.com")) {
        await saveReel(text, {
          creator: result.username || simSender,
          mediaType: result.savedReel?.media_type || "reel",
          caption: `Saved via Instagram DM from @${simSender}`,
        });
        showToast("Reel synced to your active dashboard!");
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "❌ Error processing DM event. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  const handleSendSimulatedDm = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = simMessage.trim();
    if (!text) return;
    setSimMessage("");
    await sendDm(text);
  };

  const handleButtonClick = async (button: { type: "postback" | "web_url"; title: string; payload?: string; url?: string }) => {
    if (button.type === "web_url" && button.url) {
      window.open(button.url, "_blank");
      return;
    }

    if (button.type === "postback" || button.payload) {
      // Send verification request respecting actual follower status
      await sendDm(button.title, button.payload || "CHECK_FOLLOW_STATUS", simIsFollowing);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center space-x-2 text-xs font-medium text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Settings</span>
      </Link>

      {/* Main Header Card */}
      <div className="p-6 md:p-8 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6 transition-colors duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-rd-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-rd-glow shrink-0">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
                  Instagram DM Sync & Automation
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  Automated Bot Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-secondaryText-light dark:text-secondaryText-dark mt-1">
                When users DM <span className="font-semibold text-brand-600 dark:text-brand-400">{REELDASH_IG_HANDLE}</span>, the bot verifies their follower status, auto-creates their profile, and saves any Reel directly into their ReelDash gallery.
              </p>
            </div>
          </div>
        </div>

        {/* Username Linking Box */}
        <form
          onSubmit={handleSaveUsername}
          className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
              Your Instagram Handle
            </label>
            {isSaved && user?.instagramUsername && (
              <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Linked (@{user.instagramUsername})</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondaryText-light dark:text-secondaryText-dark text-xs">
                @
              </span>
              <input
                type="text"
                value={igUsername}
                onChange={(e) => {
                  setIgUsername(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="your_instagram_handle"
                className="w-full pl-7 pr-3 py-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark placeholder:text-mutedText-light dark:placeholder:text-mutedText-dark focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={!igUsername.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs rounded-rd-md shadow-rd-subtle transition-all cursor-pointer shrink-0"
            >
              {isSaved ? "Update Handle" : "Link Account"}
            </button>
          </div>

          <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
            We use your handle solely to match incoming DMs to your library. No Instagram login or password required.
          </p>
        </form>
      </div>

      {/* 4-Step Architecture Banner */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-4">
        <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark flex items-center space-x-2">
          <Zap className="w-4 h-4 text-brand-500" />
          <span>Follower Verification & Auto-Save Logic</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {steps.map((step) => (
            <div
              key={step.n}
              className="p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-2 relative overflow-hidden"
            >
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
                {step.n}
              </div>
              <h3 className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
                {step.title}
              </h3>
              <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE INSTAGRAM DM BOT SIMULATOR & TEST CONSOLE */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-brand-500/20 rounded-rd-lg shadow-rd-subtle space-y-5">
        <div className="flex items-center justify-between border-b border-borderSubtle-light dark:border-borderSubtle-dark pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Instagram Bot DM Simulator
              </h2>
              <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
                Test the follower verification, automatic profile provisioning, and Reel extraction live.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setChatHistory([
                {
                  id: "initial-reset",
                  sender: "bot",
                  text: "⚡ ReelDash Instagram Bot ready. Send any message or Reel link to test.",
                  timestamp: "Just now",
                },
              ]);
              showToast("Chat reset");
            }}
            className="p-1.5 rounded-md hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark transition-colors"
            title="Reset Chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Simulator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-md border border-borderSubtle-light dark:border-borderSubtle-dark text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-primaryText-light dark:text-primaryText-dark">
              Sender Instagram Handle
            </label>
            <input
              type="text"
              value={simSender}
              onChange={(e) => setSimSender(e.target.value)}
              placeholder="e.g. crypto_trader"
              className="w-full px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="font-semibold text-primaryText-light dark:text-primaryText-dark">
              Follower Status with @reeldash
            </label>
            <button
              type="button"
              onClick={() => setSimIsFollowing(!simIsFollowing)}
              className={`w-full py-1.5 px-3 rounded-rd-md font-semibold text-xs transition-all flex items-center justify-center space-x-2 border cursor-pointer ${
                simIsFollowing
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
              }`}
            >
              {simIsFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Following @reeldash (Profile will Auto-Create)</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Not Following (Bot prompts to follow)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Chat Window */}
        <div className="p-4 bg-zinc-950 rounded-rd-md border border-zinc-800/80 space-y-3 min-h-[220px] max-h-[340px] overflow-y-auto custom-scrollbar font-sans text-xs">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white rounded-br-none"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.text}

                {/* Interactive Instagram Action Buttons */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1.5">
                    {msg.buttons.map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleButtonClick(btn)}
                        className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700/90 text-zinc-100 font-semibold text-xs rounded-xl border border-zinc-700/60 flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                      >
                        <span>{btn.title}</span>
                        {btn.type === "web_url" && <ExternalLink className="w-3 h-3 text-zinc-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {msg.profileCreated && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center space-x-1.5 text-[10px] text-emerald-400 font-medium">
                    <span>ReelDash Profile Provisioned & Synced</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-zinc-500 px-1 mt-0.5">{msg.timestamp}</span>
            </div>
          ))}
          {simLoading && (
            <div className="flex items-center space-x-2 text-xs text-zinc-400 p-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span>@ReelDash Bot is typing response...</span>
            </div>
          )}
        </div>

        {/* Quick Example Reel Links */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
          <span className="font-semibold">Quick links:</span>
          <button
            type="button"
            onClick={() => setSimMessage("https://www.instagram.com/reel/DbZkDwZsHgd/")}
            className="px-2 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 hover:text-brand-500 rounded border border-borderSubtle-light dark:border-borderSubtle-dark cursor-pointer truncate max-w-[180px]"
          >
            🎬 Reel: DbZkDwZsHgd
          </button>
          <button
            type="button"
            onClick={() => setSimMessage("https://www.instagram.com/reels/audio/27987161810943092/")}
            className="px-2 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 hover:text-brand-500 rounded border border-borderSubtle-light dark:border-borderSubtle-dark cursor-pointer truncate max-w-[180px]"
          >
            🎵 Audio: 27987161810943092
          </button>
          <button
            type="button"
            onClick={() => setSimMessage("Hey I just followed you!")}
            className="px-2 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 hover:text-brand-500 rounded border border-borderSubtle-light dark:border-borderSubtle-dark cursor-pointer"
          >
            💬 "Hey I just followed you!"
          </button>
        </div>

        {/* Simulator Input Box */}
        <form onSubmit={handleSendSimulatedDm} className="flex gap-2">
          <input
            type="text"
            value={simMessage}
            onChange={(e) => setSimMessage(e.target.value)}
            placeholder="Type message or paste Instagram link..."
            className="flex-1 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!simMessage.trim() || simLoading}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs rounded-rd-md shadow-rd-subtle transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send DM</span>
          </button>
        </form>
      </div>

      {/* Webhook Configuration for Meta Developers */}
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
              Meta Webhook Endpoint (Production Integration)
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            Live Endpoint
          </span>
        </div>

        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
          In your Meta Developer Console for Instagram Messenger API, configure your Callback URL to:
        </p>

        <div className="flex items-center space-x-2 p-2.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md font-mono text-xs text-primaryText-light dark:text-primaryText-dark">
          <span className="flex-1 truncate">{webhookUrl}</span>
          <button
            onClick={handleCopyWebhook}
            className="px-2 py-1 bg-surface-light dark:bg-surface-dark hover:bg-brand-500/10 hover:text-brand-500 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-[11px] font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark space-y-1">
          <p>
            • Verification Token: <code className="px-1 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded text-brand-600 dark:text-brand-400 font-mono">reeldash_webhook_2026</code>
          </p>
          <p>
            • Required Webhook fields: <code className="px-1 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded font-mono">messages</code>, <code className="px-1 py-0.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded font-mono">messaging_postbacks</code>
          </p>
        </div>
      </div>
    </div>
  );
}
