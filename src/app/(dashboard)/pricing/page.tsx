"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useReels } from "@/context/ReelContext";
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Crown,
  Instagram,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useReels();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const currentPlan = user?.plan || "Pro Plan";

  const handleSelectPlan = (planName: "Free Plan" | "Pro Plan") => {
    updateUser({ plan: planName });
    showToast(`Switched to ${planName}`, "Your account capabilities have been updated");
  };

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      priceMonthly: "$0",
      priceYearly: "$0",
      period: "forever",
      description: "For individuals looking to save and organize reference reels.",
      badge: null,
      features: [
        "1 Connected Instagram Account",
        "Up to 50 Saved Reels & Clips",
        "Direct Web & DM Ingestion",
        "Basic Smart Categories",
        "Export Library to CSV",
        "Standard Metadata Resolution",
      ],
      ctaText: currentPlan === "Free Plan" ? "Current Plan" : "Downgrade to Free",
      isCurrent: currentPlan === "Free Plan",
      planKey: "Free Plan" as const,
    },
    {
      id: "pro",
      name: "Pro Plan",
      priceMonthly: "$9",
      priceYearly: "$79",
      period: billingCycle === "monthly" ? "per month" : "per year",
      savings: billingCycle === "yearly" ? "Save 27%" : null,
      description: "For creators, designers, and curators managing multiple accounts.",
      badge: "MOST POPULAR",
      features: [
        "Up to 5 Connected Instagram Accounts",
        "Unlimited Saved Reels, Posts & Audio",
        "Multi-Account Sidebar Switcher",
        "AI Summaries & Bullet Takeaways",
        "Real-Time Multi-Device Sync",
        "High-Speed Priority Media Proxy",
        "Full CSV & JSON Backup Exports",
        "Priority Support",
      ],
      ctaText: currentPlan === "Pro Plan" ? "Current Plan" : "Upgrade to Pro",
      isCurrent: currentPlan === "Pro Plan",
      planKey: "Pro Plan" as const,
    },
    {
      id: "creator",
      name: "Power / Creator",
      priceMonthly: "$19",
      priceYearly: "$179",
      period: billingCycle === "monthly" ? "per month" : "per year",
      savings: billingCycle === "yearly" ? "Save 22%" : null,
      description: "For creative studios, agencies, and power curators with high volume.",
      badge: "CREATOR STUDIO",
      features: [
        "15+ Connected Instagram Accounts",
        "Unlimited Saved Reels & Archives",
        "Team Workspaces & Shared Boards",
        "Dedicated Webhook Priority Ingest",
        "Custom Tagging & Smart Rules",
        "Full High-Res Video Storage",
        "Direct Support & Custom Integrations",
      ],
      ctaText: "Get Power Studio",
      isCurrent: false,
      planKey: "Pro Plan" as const,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 font-semibold text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Pricing & Plans</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primaryText-light dark:text-primaryText-dark sm:text-4xl">
          Scale your creative visual library
        </h1>
        <p className="text-sm text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
          Connect your personal and brand Instagram accounts. Save reels instantly via DM and organize them with AI.
        </p>

        {/* Billing Switcher */}
        <div className="pt-3 flex items-center justify-center gap-3">
          <span className={`text-xs font-medium ${billingCycle === "monthly" ? "text-primaryText-light dark:text-primaryText-dark font-semibold" : "text-secondaryText-light dark:text-secondaryText-dark"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className="w-12 h-6 rounded-full bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark border border-borderSubtle-light dark:border-borderSubtle-dark p-0.5 transition-colors relative cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-full bg-brand-500 transition-transform ${billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"}`} />
          </button>
          <span className={`text-xs font-medium flex items-center gap-1 ${billingCycle === "yearly" ? "text-primaryText-light dark:text-primaryText-dark font-semibold" : "text-secondaryText-light dark:text-secondaryText-dark"}`}>
            Yearly <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">Save 25%</span>
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isFeatured = plan.id === "pro";
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-rd-xl border transition-all ${
                isFeatured
                  ? "bg-surface-light dark:bg-surface-dark border-brand-500/50 shadow-rd-glow ring-1 ring-brand-500/30"
                  : "bg-surface-light dark:bg-surface-dark border-borderSubtle-light dark:border-borderSubtle-dark shadow-rd-subtle"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primaryText-light dark:text-primaryText-dark">
                    {plan.name}
                  </h3>
                  {plan.isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-semibold">
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed min-h-[2.5rem]">
                  {plan.description}
                </p>

                <div className="mt-5 pb-5 border-b border-borderSubtle-light dark:border-borderSubtle-dark">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-primaryText-light dark:text-primaryText-dark font-mono">
                      {billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                    </span>
                    <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
                      /{plan.period}
                    </span>
                  </div>
                  {plan.savings && (
                    <p className="text-[11px] font-medium text-emerald-500 mt-1">
                      {plan.savings} with annual billing
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondaryText-light dark:text-secondaryText-dark">
                    Included Features:
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-primaryText-light dark:text-primaryText-dark">
                        <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <button
                  onClick={() => handleSelectPlan(plan.planKey)}
                  disabled={plan.isCurrent}
                  className={`w-full py-2.5 px-4 rounded-rd-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    plan.isCurrent
                      ? "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark text-secondaryText-light dark:text-secondaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark cursor-default"
                      : isFeatured
                      ? "bg-brand-600 hover:bg-brand-700 active:scale-95 text-white shadow-rd-glow"
                      : "bg-surfaceSecondary-light dark:bg-surfaceSecondary-dark hover:bg-brand-500/10 text-primaryText-light dark:text-primaryText-dark border border-borderSubtle-light dark:border-borderSubtle-dark hover:border-brand-500/40"
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  {!plan.isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / Trust Box */}
      <div className="p-6 rounded-rd-xl border border-borderSubtle-light dark:border-borderSubtle-dark bg-surface-light dark:bg-surface-dark grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm text-primaryText-light dark:text-primaryText-dark">
            <Instagram className="w-4 h-4 text-brand-500" />
            <span>How does multi-account work?</span>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
            Connect personal, curation, or brand accounts in Settings. When you DM reels from any of them to @reeldash_app, they save to your account.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm text-primaryText-light dark:text-primaryText-dark">
            <Shield className="w-4 h-4 text-brand-500" />
            <span>Is my data private?</span>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
            Yes. Every saved reel is strictly isolated to your internal ReelDash account ID. No other user can access your library.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm text-primaryText-light dark:text-primaryText-dark">
            <Zap className="w-4 h-4 text-brand-500" />
            <span>Can I change plans anytime?</span>
          </div>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark leading-relaxed">
            Yes. You can upgrade or switch plans anytime with instant access to extra account slots and AI summaries.
          </p>
        </div>
      </div>
    </div>
  );
}
