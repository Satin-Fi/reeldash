const fs = require("fs");
const path = require("path");

async function callAstraStream(prompt, label) {
  console.log(`\n========================================`);
  console.log(`🚀 [Astra] Starting generation: ${label}`);
  console.log(`========================================`);

  const t0 = Date.now();
  const res = await fetch("https://api.experientiallabs.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer xpl_4ac60bcd007a45c0ca62d8bef39af62cc78ae7ab",
    },
    body: JSON.stringify({
      model: "gpt-6-astra",
      max_tokens: 12000,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }

  const decoder = new TextDecoder("utf-8");
  let fullContent = "";
  let buffer = "";
  let charsReceived = 0;

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            charsReceived += delta.length;
            if (charsReceived % 200 < delta.length) {
              process.stdout.write(`\r⚡ Received ${charsReceived} chars...`);
            }
          }
        } catch (e) {
          // ignore chunk boundary
        }
      }
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ [Astra] Completed in ${elapsed}s (Total: ${fullContent.length} chars)`);
  return fullContent;
}

function extractTsx(content) {
  const firstFence = content.indexOf("```");
  if (firstFence === -1) {
    return content.replace(/<design_plan>[\s\S]*?<\/design_plan>/gi, "").trim();
  }
  const nextNewline = content.indexOf("\n", firstFence);
  const lastFence = content.lastIndexOf("```");
  if (lastFence > nextNewline) {
    return content.slice(nextNewline + 1, lastFence).trim();
  }
  return content.slice(nextNewline + 1).trim();
}

async function main() {
  const DASHBOARD_CARD_PROMPT = `You are an elite, Awwwards-winning Principal UI/UX Architect for ReelDash.
The user wants to redesign the main Dashboard page (src/app/(dashboard)/dashboard/page.tsx) into a high-end, card-style bento dashboard inspired by the two reference images provided by the user.

CRITICAL USER DIRECTIVE:
"can you make dashboard in card style? don't bring any useless card titles from image to my dashboard, you can use astra"

STRICT ANTI-PATTERNS & BANNED TITLES:
- DO NOT bring useless/irrelevant titles or placeholder text from the sample images (e.g. "Select a course", "Speak with Confidence", "Homework", "Do 1 grammar task", "Friends Score", "Crypter NFT", "Balance 256k", "Popular products", etc.).
- EVERY SINGLE CARD, TITLE, METRIC, AND INTERACTION MUST BE 100% RELEVANT TO REELDASH (Instagram Reels curation, saved videos, creators, smart categories, audio tracks, AI topics, personal notes, and playback).

---
### CARD-STYLE BENTO ARCHITECTURE (INSPIRED BY REFERENCE DESIGNS):

1. **CANVAS & CARD STYLING**:
   - Layout is built with clean, modular, rounded cards (\`rounded-[24px]\` or \`rounded-3xl\`).
   - Cards have crisp border: \`border border-black/[0.08] dark:border-white/[0.08]\`, background \`bg-white dark:bg-[#16181D]\`, and soft ambient shadow \`shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]\`.
   - Subtle nested sub-cards have soft tints: \`bg-[#F8F9FA] dark:bg-[#1C1F26]\`, with concentric border radiuses.
   - Smooth hover micro-interactions (subtle border color change, slight shadow lift).

2. **TOP BAR / COMMAND AREA**:
   - Welcome greeting: "Good [morning/afternoon/evening], [UserName]." + subtle badge "Reel Memory Vault".
   - Search bar with ⌘K shortcut linking to /search.
   - Quick Action button: "Save Reel" (triggers \`setIsSaveModalOpen(true)\` from context) or "Explore Library".

3. **HERO ROW / MAIN BENTO GRID**:
   - **Card A: Curation Overview (Top-Left / Center-Left, Span 8 on lg)**:
     - Header: "Vault Overview" + Time Filter pill toggle ("All Time", "Last 30 Days", "Last 7 Days").
     - Two elevated metric stat boxes inside:
       * Stat 1: **Saved Reels & Media** (displays real count from \`reels.length\`, e.g. "1,293" or real number, with a positive growth pill badge e.g. "+18.4% saves").
       * Stat 2: **Tracked Creators** (displays count of unique creators, e.g. "256", with pill badge "+12.8% active").
     - Spotlight Creators Strip:
       * Subheader: "[N] creators saved in your library" + "Explore creators →" linking to /reels.
       * Horizontal row of circular creator avatars with real creator avatars or stylish monogram fallbacks. Clicking an avatar routes to \`/creator/[username]\` or filters reels!

   - **Card B: Save Velocity & Activity Chart (Top-Right or Span 4 on lg)**:
     - Header: "Save Velocity" + time pill ("Weekly" / "Monthly").
     - Legend pills: "Reels" (purple dot), "Audio" (blue dot), "Carousels" (emerald dot).
     - Interactive SVG Bar Chart / Wave chart:
       * Visual bars for days (Mon, Tue, Wed, Thu, Fri, Sat, Sun) computed dynamically or nicely proportioned from reels timestamps.
       * Peak day highlighted with a vibrant gradient bar and a floating hover tooltip pill showing the count (e.g. "24 reels").

4. **MIDDLE ROW / SECONDARY BENTO**:
   - **Card C: Smart Category Decks (Left Column, Span 4 or 5)**:
     - Header: "Smart Categories" + "View all" linking to /categories.
     - Search or quick filter within categories.
     - 3-4 stacked cards with soft pastel accent cards (like the left column of reference Image 1):
       * Deck 1: Soft Purple tint (\`bg-purple-500/[0.08] border-purple-500/20 text-purple-900 dark:text-purple-200\`) e.g. "Creative Direction" or top category from \`smartCategories[0]\`.
       * Deck 2: Soft Blue tint (\`bg-blue-500/[0.08] border-blue-500/20\`) e.g. "AI & Tech" or \`smartCategories[1]\`.
       * Deck 3: Soft Emerald tint (\`bg-emerald-500/[0.08] border-emerald-500/20\`) e.g. "Soundtracks & Audio" or \`smartCategories[2]\`.
       * Each card shows category name, reel count badge, description/topic, and miniature overlapping creator avatars in the bottom right!
       * Clicking routes to \`/reels?category=[name]\`.

   - **Card D: Curation Health & AI Pipeline (Span 3 or 4)**:
     - Header: "AI Pipeline & Tags" + "Auto-Indexing".
     - Progress meters with clean rounded bars and percentages:
       * "AI Semantic Topics" (e.g. 94% tagged)
       * "Auto Categorized" (e.g. 88% sorted)
       * "Audio Tracks Extracted" (e.g. 76% recognized)
       * "Personal Notes & Insights" (e.g. 45% curated)

   - **Card E: Top Curations & Highlights (Span 4 or 5)**:
     - Header: "Top Curations" + "View Library" (link to /reels).
     - List of 4-5 top saved reels with:
       * Rounded 9:16 or square thumbnail with play overlay.
       * @creator username + verified badge.
       * Clean caption snippet or AI topic.
       * Category tag badge or audio sound pill.
       * Clicking ANY reel instantly opens \`activePlayerReel\` in \`ReelPlayerModal\`!

5. **BOTTOM ROW**:
   - **Card F: Recent Notes & Insights (Span 12)**:
     - Header: "Recent Activity & Notes" + time stamp.
     - Interactive list of recent items showing creator avatar, @creator, personal note snippet (or caption quote), relative time (e.g. "2h ago"), and instant click to play.

---
### TECHNICAL REQUIREMENTS:
- Path: src/app/(dashboard)/dashboard/page.tsx
- Use Next.js client component ('use client';)
- Icons: lucide-react (Search, Command, Play, ArrowRight, Bookmark, Users, Folder, Clock, Sparkles, TrendingUp, Music2, CheckCircle2, ChevronRight, BarChart3, Filter, Plus, Flame)
- Imports:
  import React, { useState, useEffect, useMemo } from 'react';
  import Link from 'next/link';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/context/AuthContext';
  import { useReels } from '@/context/ReelContext';
  import { Reel } from '@/types/reel';
  import { ReelPlayerModal } from '@/components/reels/ReelPlayerModal';
- Must be fully typed and compile cleanly with TypeScript (\`npx tsc --noEmit\`).
- Must handle empty state gracefully when user has 0 reels.
- Must support both light mode and dark mode seamlessly using Tailwind CSS.

Output ONLY the complete, production-ready, compilable TypeScript React code inside a single \`\`\`tsx ... \`\`\` code fence. No markdown text outside the code fence.`;

  const raw = await callAstraStream(DASHBOARD_CARD_PROMPT, "Card-Style Bento Dashboard");
  fs.writeFileSync(path.resolve(__dirname, "raw-dashboard-output.txt"), raw, "utf8");
  const code = extractTsx(raw);
  const dest = path.resolve(__dirname, "../src/app/(dashboard)/dashboard/page.tsx");
  fs.writeFileSync(dest, code, "utf8");
  console.log(`💾 Saved Card Dashboard to ${dest} (${code.length} chars)`);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
