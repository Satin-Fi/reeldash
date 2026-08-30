"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Sun,
  Moon,
  Bell,
  Download,
  ShieldCheck,
  MessageCircle,
  Instagram,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SettingsPage() {
  const { theme, toggleTheme, reels, showToast } = useReels();
  const { user, updateUser, addInstagramAccount, removeInstagramAccount, refreshAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState<"accounts" | "profile" | "appearance" | "export">("accounts");

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newHandle, setNewHandle] = useState("");
  const [isAddingHandle, setIsAddingHandle] = useState(false);

  useEffect(() => {
    refreshAccounts();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim() || user?.name,
      email: email.trim() || user?.email,
    });
    showToast("Profile settings saved");
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newHandle.replace(/^@/, "").trim();
    if (!clean || isAddingHandle) return;

    setIsAddingHandle(true);
    try {
      const res = await addInstagramAccount(clean);
      if (res.success) {
        setNewHandle("");
        showToast(`@${clean} connected successfully`, "Reels sent from this handle will save to your library");
      } else {
        showToast("Could not link account", res.error);
      }
    } finally {
      setIsAddingHandle(false);
    }
  };

  const handleRemoveAccount = async (accountId: string, username: string) => {
    if (confirm(`Are you sure you want to unlink @${username}?`)) {
      const ok = await removeInstagramAccount(accountId);
      if (ok) {
        showToast(`@${username} unlinked`);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Instagram Account", "Creator", "Caption", "Category", "Instagram URL", "Date Saved"];
    const rows = reels.map((r) => [
      r.id,
      r.instagramUsername || "default",
      `@${r.creatorUsername}`,
      `"${(r.caption || "").replace(/"/g, '""')}"`,
      r.category || "General",
      r.instagramUrl,
      r.createdAt,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reeldash_library.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV library exported");
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reels, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", "reeldash_library.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("JSON library exported");
  };

  const connectedAccounts = user?.connectedAccounts || [];
  const maxLimit = user?.plan === "Free Plan" ? 1 : 5;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          Settings & Preferences
        </h1>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          Manage your connected Instagram handles, profile, appearance, and export options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-3 space-y-1 bg-surface-light dark:bg-surface-dark p-2 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "accounts"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
            }`}
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram Accounts</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "profile"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "appearance"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "export"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Data Export</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-9 p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6">
          {/* Instagram Accounts Multi-Account Management */}
          {activeTab === "accounts" && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                    Connected Instagram Accounts
                  </h3>
                  <p className="text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
                    Any Reel, Post, or Audio sent to <strong className="text-brand-500">@reeldash_app</strong> from these handles will auto-save to your library.
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-medium">
                  {connectedAccounts.length} of {maxLimit} accounts ({user?.plan || "Pro Plan"})
                </div>
              </div>

              {/* Connected Accounts List */}
              <div className="space-y-3">
                {connectedAccounts.length === 0 ? (
                  <div className="p-4 rounded-rd-md border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark text-center text-secondaryText-light dark:text-secondaryText-dark">
                    No Instagram accounts connected yet. Add your handle below to start saving from DMs.
                  </div>
                ) : (
                  connectedAccounts.map((acc) => (
                    <div
                      key={acc.id || acc.username}
                      className="flex items-center justify-between p-3.5 rounded-rd-md border border-borderSubtle-light dark:border-borderSubtle-dark bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-500">
                          {acc.avatarUrl ? (
                            <img src={acc.avatarUrl} alt={acc.username} className="w-full h-full object-cover" />
                          ) : (
                            acc.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-primaryText-light dark:text-primaryText-dark font-mono text-sm">
                              @{acc.username}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Active
                            </span>
                          </div>
                          <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
                            {acc.displayName ? `${acc.displayName} • ` : ""}DM sync enabled
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveAccount(acc.id, acc.username)}
                        className="p-2 text-mutedText-light dark:text-mutedText-dark hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-rd-sm transition-colors cursor-pointer"
                        title="Unlink account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Account Form */}
              {connectedAccounts.length < maxLimit ? (
                <form onSubmit={handleAddAccount} className="pt-2 space-y-3">
                  <label className="block font-medium text-secondaryText-light dark:text-secondaryText-dark">
                    Connect Another Instagram Account
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondaryText-light dark:text-secondaryText-dark font-mono">
                        @
                      </span>
                      <input
                        type="text"
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        placeholder="your_other_instagram_handle"
                        className="w-full pl-7 pr-3 py-2.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md text-xs text-primaryText-light dark:text-primaryText-dark font-mono focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newHandle.trim() || isAddingHandle}
                      className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-rd-md shadow-rd-subtle flex items-center space-x-1.5 cursor-pointer transition-all"
                    >
                      {isAddingHandle ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add Handle</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-rd-md bg-brand-500/5 border border-brand-500/20 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                      You have reached the maximum account limit ({maxLimit}) for your plan.
                    </p>
                    <p className="text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
                      Upgrade to connect more Instagram accounts and unlock team workspaces.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Account Information
              </h3>
              
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full p-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full p-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold rounded-rd-md shadow-rd-subtle transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Appearance Settings
              </h3>
              <p className="text-secondaryText-light dark:text-secondaryText-dark">
                Select your preferred interface theme.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`p-4 border rounded-rd-md flex flex-col items-center space-y-2 cursor-pointer transition-all ${
                    theme === "light"
                      ? "border-brand-500 bg-brand-500/5 font-semibold text-brand-600 dark:text-brand-400"
                      : "border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light dark:text-secondaryText-dark hover:border-brand-500/30"
                  }`}
                >
                  <Sun className="w-6 h-6" />
                  <span>Light Mode</span>
                </button>

                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`p-4 border rounded-rd-md flex flex-col items-center space-y-2 cursor-pointer transition-all ${
                    theme === "dark"
                      ? "border-brand-500 bg-brand-500/10 font-semibold text-brand-400"
                      : "border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light dark:text-secondaryText-dark hover:border-brand-500/30"
                  }`}
                >
                  <Moon className="w-6 h-6" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          )}

          {/* Data Export Tab */}
          {activeTab === "export" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Data Export & Backup
              </h3>
              <p className="text-secondaryText-light dark:text-secondaryText-dark">
                Download your entire visual library, captions, metadata, and collection structures.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark">
                  <h4 className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                    Spreadsheet (CSV)
                  </h4>
                  <p className="text-secondaryText-light dark:text-secondaryText-dark text-[11px]">
                    Export all saved reels, creator handles, links, and categories in standard CSV format.
                  </p>
                  <button
                    onClick={handleExportCSV}
                    className="w-full py-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500 rounded-rd-sm font-medium transition-colors cursor-pointer text-center block"
                  >
                    Export CSV
                  </button>
                </div>

                <div className="p-4 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md space-y-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark">
                  <h4 className="font-semibold text-primaryText-light dark:text-primaryText-dark">
                    JSON Backup
                  </h4>
                  <p className="text-secondaryText-light dark:text-secondaryText-dark text-[11px]">
                    Complete backup including notes, timestamps, tags, and all custom metadata.
                  </p>
                  <button
                    onClick={handleExportJSON}
                    className="w-full py-2 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500 rounded-rd-sm font-medium transition-colors cursor-pointer text-center block"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
