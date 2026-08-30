"use client";

import React, { useState, useEffect } from "react";
import { useReels } from "@/context/ReelContext";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Sun,
  Moon,
  Download,
  Instagram,
  Plus,
  Trash2,
  CheckCircle2,
  Crown,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { theme, toggleTheme, reels, showToast } = useReels();
  const { user, updateUser, addInstagramAccount, removeInstagramAccount, refreshAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState<"accounts" | "profile" | "plans" | "appearance" | "export">("accounts");

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
        showToast(`@${clean} connected successfully`);
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
          Manage your connected Instagram handles, workspace plans, profile, and export options.
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
            onClick={() => setActiveTab("plans")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "plans"
                ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold"
                : "text-secondaryText-light dark:text-secondaryText-dark hover:bg-surfaceSecondary-light dark:hover:bg-surfaceSecondary-dark"
            }`}
          >
            <Crown className="w-4 h-4 text-brand-500" />
            <span>Plans & Billing</span>
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
                    Manage the handles you use to capture reels and media references.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="px-2.5 py-1 rounded-full bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-500 font-medium transition-colors"
                >
                  {connectedAccounts.length} of {maxLimit} accounts ({user?.plan || "Pro Plan"})
                </Link>
              </div>

              {/* Connected Accounts List */}
              <div className="space-y-2.5">
                {connectedAccounts.length === 0 ? (
                  <div className="p-4 rounded-rd-md border border-dashed border-borderSubtle-light dark:border-borderSubtle-dark text-center text-secondaryText-light dark:text-secondaryText-dark">
                    No Instagram accounts connected yet. Add your handle below to start saving references.
                  </div>
                ) : (
                  connectedAccounts.map((acc) => (
                    <div
                      key={acc.id || acc.username}
                      className="flex items-center justify-between p-3.5 rounded-rd-md border border-borderSubtle-light dark:border-borderSubtle-dark bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-500 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/proxy-image?username=${encodeURIComponent(acc.username)}`}
                            alt={acc.username}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover"
                          />
                          <span className="text-xs uppercase font-mono">
                            {acc.username.replace(/^_/, "").charAt(0) || acc.username.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primaryText-light dark:text-primaryText-dark font-mono text-sm truncate">
                              @{acc.username}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Active
                            </span>
                          </div>
                          {acc.displayName && (
                            <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark truncate mt-0.5">
                              {acc.displayName}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveAccount(acc.id, acc.username)}
                        className="p-2 text-mutedText-light dark:text-mutedText-dark hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-rd-sm transition-colors cursor-pointer shrink-0"
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
                  <Link
                    href="/pricing"
                    className="px-3 py-1.5 rounded-rd-md bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs flex items-center gap-1 shrink-0"
                  >
                    <span>Upgrade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Plans & Billing Tab */}
          {activeTab === "plans" && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between pb-4 border-b border-borderSubtle-light dark:border-borderSubtle-dark">
                <div>
                  <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                    Current Workspace Plan
                  </h3>
                  <p className="text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
                    Your active subscription and library capacity.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-bold">
                  {user?.plan || "Pro Plan"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark space-y-1.5">
                  <span className="text-secondaryText-light dark:text-secondaryText-dark">Instagram Accounts</span>
                  <p className="text-base font-bold text-primaryText-light dark:text-primaryText-dark font-mono">
                    {connectedAccounts.length} / {maxLimit} Connected
                  </p>
                </div>
                <div className="p-4 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark space-y-1.5">
                  <span className="text-secondaryText-light dark:text-secondaryText-dark">Saved Media Capacity</span>
                  <p className="text-base font-bold text-primaryText-light dark:text-primaryText-dark font-mono">
                    {user?.plan === "Free Plan" ? "50 Reels Limit" : "Unlimited Reels"}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-rd-md bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-rd-glow transition-all"
                >
                  <Crown className="w-4 h-4" />
                  <span>Compare All Plans & Upgrades</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Profile Form */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Account Information
              </h3>
              <div>
                <label className="block font-medium text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
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
                  className="w-full px-3 py-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-brand-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-rd-sm shadow-rd-subtle transition-colors cursor-pointer"
              >
                Save Profile
              </button>
            </form>
          )}

          {/* Appearance Form */}
          {activeTab === "appearance" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Theme Customization
              </h3>
              <div className="flex items-center justify-between p-3 rounded-rd-md bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark">
                <div>
                  <span className="font-semibold text-primaryText-light dark:text-primaryText-dark block">
                    Dark Mode
                  </span>
                  <span className="text-secondaryText-light dark:text-secondaryText-dark text-[11px]">
                    Toggle between light and dark visual interfaces.
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-surface-light dark:hover:bg-surface-dark transition-colors cursor-pointer border border-borderSubtle-light dark:border-borderSubtle-dark"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-500" />}
                </button>
              </div>
            </div>
          )}

          {/* Export Options */}
          {activeTab === "export" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Library Data Backup
              </h3>
              <p className="text-secondaryText-light dark:text-secondaryText-dark">
                Download your complete reference library in machine-readable formats.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 text-primaryText-light dark:text-primaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/30 rounded-rd-md transition-all cursor-pointer font-medium"
                >
                  <Download className="w-4 h-4 text-brand-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 text-primaryText-light dark:text-primaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/30 rounded-rd-md transition-all cursor-pointer font-medium"
                >
                  <Download className="w-4 h-4 text-brand-500" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
