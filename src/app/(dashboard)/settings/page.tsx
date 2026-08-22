"use client";

import React, { useState } from "react";
import { useReels } from "@/context/ReelContext";
import { User, Sun, Moon, Bell, Download, ShieldCheck, HardDrive, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme, reels, showToast } = useReels();
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "notifications" | "export">("account");

  const handleExportCSV = () => {
    const headers = ["ID", "Creator", "Caption", "Category", "Instagram URL", "Date Saved"];
    const rows = reels.map((r) => [
      r.id,
      `@${r.creatorUsername}`,
      `"${r.caption.replace(/"/g, '""')}"`,
      r.category,
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
    showToast("✓ CSV library exported");
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reels, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", "reeldash_library.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ JSON library exported");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primaryText-light dark:text-primaryText-dark">
          Settings & Preferences
        </h1>
        <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-0.5">
          Manage your account, appearance, notifications, and library exports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="md:col-span-3 space-y-1 bg-surface-light dark:bg-surface-dark p-2 border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-md shadow-rd-subtle">
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "account" ? "bg-brand-500/10 text-brand-500 font-semibold" : "text-secondaryText-light"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "appearance" ? "bg-brand-500/10 text-brand-500 font-semibold" : "text-secondaryText-light"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "notifications" ? "bg-brand-500/10 text-brand-500 font-semibold" : "text-secondaryText-light"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-rd-sm text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === "export" ? "bg-brand-500/10 text-brand-500 font-semibold" : "text-secondaryText-light"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Data Export</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-9 p-6 bg-surface-light dark:bg-surface-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-lg shadow-rd-subtle space-y-6">
          {activeTab === "account" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Account Information
              </h3>
              <div className="space-y-3 max-w-md">
                <div>
                  <label className="block font-medium text-secondaryText-light mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Piyush Kumar"
                    className="w-full p-2 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-secondaryText-light mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue="piyush@example.com"
                    className="w-full p-2 bg-background-light dark:bg-background-dark border border-borderSubtle-light dark:border-borderSubtle-dark rounded-rd-sm text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-secondaryText-light mb-1">Connected Instagram Handle</label>
                  <div className="flex items-center space-x-2 p-2 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-sm font-mono text-xs">
                    <span>@piyush_kumar</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      ? "border-brand-500 bg-brand-500/5 font-semibold text-brand-500"
                      : "border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light"
                  }`}
                >
                  <Sun className="w-6 h-6" />
                  <span>Light Mode</span>
                </button>

                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`p-4 border rounded-rd-md flex flex-col items-center space-y-2 cursor-pointer transition-all ${
                    theme === "dark"
                      ? "border-brand-500 bg-brand-500/5 font-semibold text-brand-500"
                      : "border-borderSubtle-light dark:border-borderSubtle-dark text-secondaryText-light"
                  }`}
                >
                  <Moon className="w-6 h-6" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Notification Preferences
              </h3>
              <div className="space-y-3 max-w-md">
                <label className="flex items-center justify-between p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-sm cursor-pointer">
                  <span>Save notifications</span>
                  <input type="checkbox" defaultChecked className="accent-brand-500" />
                </label>
                <label className="flex items-center justify-between p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-sm cursor-pointer">
                  <span>AI categorization toasts</span>
                  <input type="checkbox" defaultChecked className="accent-brand-500" />
                </label>
                <label className="flex items-center justify-between p-3 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark rounded-rd-sm cursor-pointer">
                  <span>Weekly library summary digest</span>
                  <input type="checkbox" defaultChecked className="accent-brand-500" />
                </label>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark">
                Data Export & Ownership
              </h3>
              <p className="text-secondaryText-light dark:text-secondaryText-dark">
                Export your saved Reel library metadata at any time. Your library belongs to you.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-rd-md shadow-rd-subtle transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500 text-primaryText-light font-medium rounded-rd-md shadow-rd-subtle transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export as JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
