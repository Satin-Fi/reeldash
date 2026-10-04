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
  const match = content.match(/```(?:tsx|typescript|jsx|js)?\s*\n([\s\S]*?)(?:```|$)/);
  if (match && match[1].trim()) return match[1].trim();
  // Strip any leading <design_plan>...</design_plan>
  const cleaned = content.replace(/<design_plan>[\s\S]*?<\/design_plan>/gi, "").trim();
  return cleaned;
}

async function main() {
  const target = process.argv[2] || "all";

  // ─────────────────────────────────────────────────────────────
  // 1. RECYCLE BIN
  // ─────────────────────────────────────────────────────────────
  const RECYCLE_BIN_PROMPT = `You are an elite, Awwwards-winning frontend design engineer embodying the high-aesthetic design system of Reeldash.
Rebuild the RECYCLE BIN page from scratch (to be saved at src/app/(dashboard)/recycle-bin/page.tsx).

---
### PRODUCT CONTEXT & DESIGN CRITIQUE:
The previous Recycle Bin page was a generic, bland empty white screen with a tiny stock trash icon and a blue button.
The user wants an Awwwards-tier, editorial interface with original SVG artwork, refined typography, and high-agency polish.

---
### STRICT DESIGN REQUIREMENTS:
1. ORIGINAL SVGS & BESPOKE ARTWORK (NO GENERIC ICONS):
   - For the empty state, render a bespoke, hand-crafted original SVG illustration:
     * A minimalist geometric vault/archive wireframe with subtle 45-degree isometric projection, delicate lavender/violet accent traces (#CBB5FD / #6E47C7), and an ambient soft radial glow.
     * Do NOT use a bare Lucide trash icon as the primary illustration!
2. EDITORIAL TYPOGRAPHY & ZERO FLUFF:
   - Clean, confident typography with negative tracking (tracking-[-0.04em]).
   - Elegant header: "Recycle Bin" with subtle item indicator when items exist.
   - For the empty state: Headline "Archive is clear" or "Recycle Bin is clear", followed by concise editorial copy: "Items removed from your workspace rest here before permanent erasure."
   - High-contrast action CTA button: "Return to Dashboard" or "Explore Library" with subtle arrow, styled in solid dark/light pill (matching Reeldash primaryButton).
3. NON-EMPTY STATE (WHEN ITEMS EXIST):
   - Grid of deleted items in true 9:16 aspect ratio:
     * High-res cover thumbnail with subtle border and rounded-2xl.
     * Creator handle (@handle), deletion date.
     * Actions: "Restore" button (restores reel to library) and "Delete Forever" button.
   - Header action: "Empty Bin" with clean confirmation modal or inline state.
4. PALETTE:
   - Dark mode: bg-[#090A0D] / surface bg-[#121316] / border border-white/[0.08] / text-white.
   - Light mode: bg-[#FAFAF9] / surface bg-white / border border-black/[0.07] / text-zinc-950.
   - Accent: Lavender #CBB5FD, text #6E47C7.

---
### TECHNICAL SPECIFICATIONS:
- 'use client' at top.
- Full TypeScript React component.
- Import useReels from '@/context/ReelContext' (uses: recycleBin, restoreReel, permanentlyDeleteReel, emptyRecycleBin, showToast).
- Import Link from 'next/link'.
- Import motion, AnimatePresence from 'framer-motion'.
- Import icons from 'lucide-react' (e.g. RotateCcw, Trash2, ArrowRight, AlertTriangle, X, Check).
- Helper function to safely get thumbnail and creator:
  function getMediaUrl(reel: any): string {
    return reel.thumbnailUrl || reel.thumbnail || reel.coverUrl || reel.imageUrl || reel.displayUrl || '';
  }
  function getCreator(reel: any): string {
    return reel.creatorUsername || reel.username || (typeof reel.creator === 'string' ? reel.creator : reel.creator?.username) || 'instagram';
  }
- Complete unabridged code with no truncation.
- Output brief <design_plan> followed immediately by code in a \`\`\`tsx code fence.
`;

  // ─────────────────────────────────────────────────────────────
  // 2. CATEGORIES
  // ─────────────────────────────────────────────────────────────
  const CATEGORIES_PROMPT = `You are an elite, Awwwards-winning frontend design engineer embodying the high-aesthetic design system of Reeldash.
Rebuild the CATEGORIES page from scratch (to be saved at src/app/(dashboard)/categories/page.tsx).

---
### PRODUCT CONTEXT & DESIGN CRITIQUE:
The previous Categories page had heavy, clunky black cards with three squashed, distorted video previews and generic blue buttons.
The user wants an Awwwards-tier visual curation experience with original SVGs, editorial typography, and high-taste visual card architecture.

---
### STRICT DESIGN REQUIREMENTS:
1. ORIGINAL CARD ARCHITECTURE (ELEVATED VISUAL CURATION):
   - Instead of 3 squished vertical slices, design a stunning layered visual deck for each category:
     * Overlapping cascading preview cards (Cosmos / Apple Photos / Figma style) showcasing the category's top reel covers with gentle rotations (-4deg, 0deg, +4deg) and subtle drop shadows.
     * OR a clean, gapless mosaic preview with rounded-xl corners.
   - Category metadata: Category Name (bold, tracking-tight), item count, and clean description.
   - Subtle hover physics: Cards expand slightly on hover, revealing an "Explore Collection" indicator.
   - Action controls: Subtle three-dot or edit/delete icon buttons for managing custom categories.
2. HEADER & CONTROLS:
   - Header: "Categories" in editorial Bricolage Grotesque typography with brief subtext.
   - Action Bar:
     * Real-time search filter for category names.
     * "+ New Category" button: Pill button in solid contrast (bg-[#090A0D] dark:bg-white text-white dark:text-[#090A0D] rounded-full px-5 py-2.5 font-semibold text-xs).
3. ORIGINAL BESPOKE SVGS:
   - For empty states or category placeholder artwork, render bespoke geometric line-art vector illustrations (custom SVGs with lavender traces #CBB5FD, subtle nodes, and layered frames).
4. MODAL / CREATION FLOW:
   - Modal or slide-over for creating and editing categories with clean inputs (Name, Description).
5. PALETTE & TOKENS:
   - Dark: bg-[#090A0D] / cards bg-[#121316] / border border-white/[0.08] / text-white.
   - Light: bg-[#FAFAF9] / cards bg-white / border border-black/[0.07] / text-zinc-950.
   - Pastel lavender (#CBB5FD) and sage (#80CFA0) accents.

---
### TECHNICAL SPECIFICATIONS:
- 'use client' at top.
- Full TypeScript React component.
- Import useReels from '@/context/ReelContext' (uses: reels, smartCategories, userCategories, createUserCategory, updateUserCategory, deleteUserCategory, setActiveCategory).
- Import Link from 'next/link'.
- Import motion, AnimatePresence from 'framer-motion'.
- Import icons from 'lucide-react' (e.g. Plus, Search, Edit3, Trash2, X, ArrowRight, Check, Folder, Layers).
- Helper function for thumbnails:
  function getMediaUrl(reel: any): string {
    return reel.thumbnailUrl || reel.thumbnail || reel.coverUrl || reel.imageUrl || reel.displayUrl || '';
  }
- Complete unabridged code with no truncation.
- Output brief <design_plan> followed immediately by code in a \`\`\`tsx code fence.
`;

  // ─────────────────────────────────────────────────────────────
  // 3. SETTINGS & PREFERENCES
  // ─────────────────────────────────────────────────────────────
  const SETTINGS_PROMPT = `You are an elite, Awwwards-winning frontend design engineer embodying the high-aesthetic design system of Reeldash.
Rebuild the SETTINGS & PREFERENCES page from scratch (to be saved at src/app/(dashboard)/settings/page.tsx).

---
### PRODUCT CONTEXT & DESIGN CRITIQUE:
The previous Settings page looked like a generic 2018 Bootstrap admin template (clunky white container, blue tabs, generic buttons).
The user wants an Awwwards-tier, Linear / Stripe / Raycast-inspired workspace settings experience with original SVGs, editorial typography, and high-taste craft.

---
### STRICT DESIGN REQUIREMENTS:
1. ELEVATED MODERN LAYOUT (LINEAR / RAYCAST TASTE):
   - Two-column layout on desktop:
     * Left Column (w-64 shrink-0): Vertical tab navigation with subtle pill hover states, clean indicator line, and original/refined icon marks:
       - Connected Accounts (Instagram icon)
       - Profile & Workspace (User icon)
       - Plans & Billing (Crown / Sparkle icon)
       - Appearance (Sun / Moon icon)
       - Data Export (Download icon)
     * Right Column (flex-1 max-w-3xl): Elevated settings surface with rounded-[24px] border border-white/[0.08] dark:bg-[#121316] p-8 shadow-xl.
2. INSTAGRAM ACCOUNTS TAB (KEY CORE FEATURE):
   - Connected Accounts:
     * High-contrast card with Instagram gradient icon or verified badge.
     * Displays connected handle (@clumsy_asfuck), "Active & Verified" status pill in pastel sage (bg-[#F0FDF4] text-[#286641] dark:bg-[#101C15] dark:text-[#80CFA0]).
     * Disconnect / Unlink button with subtle confirmation.
   - Verification Section (DM Code Linking):
     * Clear, elegant instructions: "Send any Reel to @ReelDash on Instagram. We'll reply with your 6-digit code to link your account."
     * Large, letter-spaced 6-digit verification code input (tracking-[0.25em] font-mono text-center text-lg h-12 rounded-xl bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10).
     * High-contrast "Verify & Connect" button with loader state.
     * Alternative "Generate verification code" flow.
3. PROFILE TAB:
   - Clean inputs for Full Name, Email Address, Workspace handle with subtle save action.
4. APPEARANCE TAB:
   - Modern theme switcher: Segmented card options for "Light" and "Dark" with bespoke minimal interface preview illustrations (SVGs showing miniature light and dark layouts).
5. DATA EXPORT TAB:
   - Export your entire swipe file as CSV or JSON with instant download buttons.
6. DANGER ZONE (DELETE ACCOUNT):
   - Minimal red-tinted warning card with "Delete Workspace" action requiring typing "DELETE".
7. ORIGINAL SVGS & CRAFTSMANSHIP:
   - Custom SVG icons and illustrations for theme switchers, empty account states, and status badges.
   - No generic emojis or cheap badges.

---
### TECHNICAL SPECIFICATIONS:
- 'use client' at top.
- Full TypeScript React component. Export default function SettingsPage().
- Import useReels from '@/context/ReelContext' (uses: theme, toggleTheme, reels, showToast).
- Import useAuth from '@/context/AuthContext' (uses: user, updateUser, removeInstagramAccount, refreshAccounts, deleteAccount).
- Import getClientAuthHeaders from '@/lib/clientAuth'.
- Import motion, AnimatePresence from 'framer-motion'.
- Import Link from 'next/link'.
- Import icons from 'lucide-react' (Instagram, User, Sparkles, Sun, Moon, Download, Check, Trash2, AlertTriangle, ArrowRight, Loader2, Copy, ExternalLink, ShieldCheck, RefreshCw, Key).
- Render bespoke SVG artwork for Theme Preview cards (minimalist light and dark dashboard mockups) and Instagram verified badge.
- Implement all 5 tabs: Connected Accounts (with 6-digit DM code input and unlink), Profile (with Save and Danger Zone Delete Account modal), Plans & Billing (Awwwards-tier pro card with features list), Appearance (theme toggle with visual preview SVGs), Data Export (CSV/JSON swipe file export).
- CRITICAL: Output ONLY the code wrapped in \`\`\`tsx ... \`\`\`. Do NOT output <design_plan> or any text outside the code fence. Ensure the file is 100% complete with all closing tags and brackets.
`;

  if (target === "recycle-bin" || target === "all") {
    const raw = await callAstraStream(RECYCLE_BIN_PROMPT, "Recycle Bin Page");
    const code = extractTsx(raw);
    const dest = path.resolve(__dirname, "../src/app/(dashboard)/recycle-bin/page.tsx");
    fs.writeFileSync(dest, code, "utf8");
    console.log(`💾 Saved Recycle Bin Page to ${dest} (${code.length} chars)`);
  }

  if (target === "categories" || target === "all") {
    const raw = await callAstraStream(CATEGORIES_PROMPT, "Categories Page");
    const code = extractTsx(raw);
    const dest = path.resolve(__dirname, "../src/app/(dashboard)/categories/page.tsx");
    fs.writeFileSync(dest, code, "utf8");
    console.log(`💾 Saved Categories Page to ${dest} (${code.length} chars)`);
  }

  if (target === "settings" || target === "all") {
    const raw = await callAstraStream(SETTINGS_PROMPT, "Settings Page");
    const code = extractTsx(raw);
    const dest = path.resolve(__dirname, "../src/app/(dashboard)/settings/page.tsx");
    fs.writeFileSync(dest, code, "utf8");
    console.log(`💾 Saved Settings Page to ${dest} (${code.length} chars)`);
  }

  console.log("\n🎉 All requested pages generated by GPT-6 Astra!");
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
