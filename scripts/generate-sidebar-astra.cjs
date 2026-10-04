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
  const cleaned = content.replace(/<design_plan>[\s\S]*?<\/design_plan>/gi, "").trim();
  return cleaned;
}

async function main() {
  const SIDEBAR_PROMPT = `You are an elite, Awwwards-winning frontend design engineer and principal design systems architect specializing in high-agency workspaces (Linear, Raycast, Cosmos, Folk, Apple).
Rebuild the REELDASH SIDEBAR component from scratch (to be saved at src/components/shell/Sidebar.tsx).

---
### PRODUCT CONTEXT & DESIGN AUDIT:
The previous sidebar looked clunky, cluttered, and dated (like a 2018 admin template):
1. Every icon was awkwardly trapped inside an oversized circular background container (w-[38px] h-[38px] rounded-full bg-[#332F2C]).
2. Heavy, dirty brown gradient bubbles on active states (linear-gradient(90deg, #4A4540, ...)).
3. Redundant, visual-noise count badges on every single menu row (172, 48, 1, 221, 101, 59).
4. Cluttered, cramped bottom user card with four mismatched icons shoved into a tiny pill.
5. Inability to seamlessly adapt to dark/light theme.

---
### STRICT DESIGN REQUIREMENTS (AWWWARDS-TIER CRAFTSMANSHIP):
1. MINIMALIST, HIGH-AGENCY AESTHETIC (LINEAR / RAYCAST / COSMOS):
   - Background: Pure obsidian surface in dark mode (dark:bg-[#0C0D10] or dark:bg-[#090A0D]), crisp warm paper in light mode (bg-[#FAFAF9] or bg-[#F7F7F4]), with a razor-thin border (border-r border-black/[0.06] dark:border-white/[0.06]).
   - Width: Exactly 256px (w-64 min-w-[256px] max-w-[256px]).
   - High visual calm: NO redundant circular badges behind every icon! Icons sit naturally, cleanly, and gracefully beside the text (17px icon size, stroke width 1.5).
   - NO UNNECESSARY COUNTS: Zero counter numbers on the main navigation links! Keep the interface serene, quiet, and editorial.
2. REFINED NAVIGATION ITEMS:
   - Primary links:
     * Dashboard (href: "/dashboard", Home icon)
     * Reels (href: "/reels?type=reel", Film icon)
     * Posts & Photos (href: "/reels?type=post", ImageIcon)
     * Audio & Songs (href: "/reels?type=audio", Music2 icon)
     * All Library (href: "/reels?type=all", Layers icon)
     * Favorites (href: "/favorites", Heart icon)
   - Interaction states:
     * Active state: Refined, subtle pill (bg-black/[0.05] dark:bg-white/[0.08] text-zinc-950 dark:text-white font-medium) with an optional delicate pastel lavender (#CBB5FD) left accent indicator or dot.
     * Hover state: Smooth, restrained hover (hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-300).
     * Inactive state: Quiet text-zinc-500 dark:text-zinc-400.
3. COLLECTIONS & CATEGORIES SECTION:
   - Quiet, letter-spaced section header: "Collections" or "Categories" (text-[11px] font-semibold tracking-[0.14em] uppercase text-zinc-400 dark:text-zinc-500) with a subtle Plus icon button linking to "/categories".
   - List top categories with clean contextual icons (Folder, Code2, Music2, Palette, etc.), active selection matching /reels?category=...
   - Clean "View all collections" shortcut link with micro-arrow.
4. UTILITIES & WORKSPACE TOOLS:
   - Plans & Pricing (href: "/pricing", Crown or Sparkles icon).
   - Recycle Bin (href: "/recycle-bin", Trash2 icon) - quiet, elegant, zero loud red badges.
5. INSTAGRAM MULTI-ACCOUNT SWITCHER:
   - When accounts are connected, sleek account pill switcher with avatar, @username, and smooth dropdown to switch between accounts or "All Accounts".
   - If not connected, clean "Connect Instagram" button.
6. ELEVATED USER & WORKSPACE FOOTER:
   - Refined user surface at bottom:
     * Circular avatar with fallback letter.
     * User name (text-[13px] font-medium truncate) and handle/email (text-[11px] font-mono text-zinc-500 truncate).
     * Clean interactive action buttons: Theme toggle (Sun/Moon), Settings (Settings), and Logout (LogOut).
7. SEAMLESS LIGHT & DARK THEME SUPPORT:
   - Fully dynamic classes with dark: variants for every surface, text, and border.
   - Clean layout height: h-full flex flex-col justify-between p-3.5.

---
### TECHNICAL SPECIFICATIONS:
- 'use client' at top.
- Full TypeScript React component. Export function Sidebar().
- Imports from '@/context/ReelContext' (reels, favorites, recycleBin, collections, smartCategories, activeCategory, setActiveCategory, activeCollection, setActiveCollection, activeMediaType, setActiveMediaType, selectedInstagramAccount, setSelectedInstagramAccount, setSearchQuery, theme, toggleTheme).
- Imports from '@/context/AuthContext' (user, logout).
- Import ReelDashLogo from '@/components/ui/ReelDashLogo'.
- Import usePathname from 'next/navigation'.
- Import Link from 'next/link'.
- Lucide icons (Home, Film, Image as ImageIcon, Music2, Layers, Heart, Folder, Settings, Plus, LogOut, Instagram, ChevronsUpDown, Check, Crown, Trash2, Sun, Moon, Sparkles, ArrowRight, Code2, Palette, Compass, Camera, ShoppingBag, Activity, Utensils, Cpu).
- Complete, unabridged, bug-free TypeScript code.
- CRITICAL: Output ONLY the code block wrapped in \`\`\`tsx ... \`\`\`. No markdown text outside the code fence.
`;

  const raw = await callAstraStream(SIDEBAR_PROMPT, "Sidebar Component");
  const code = extractTsx(raw);
  const dest = path.resolve(__dirname, "../src/components/shell/Sidebar.tsx");
  fs.writeFileSync(dest, code, "utf8");
  console.log(`💾 Saved Sidebar to ${dest} (${code.length} chars)`);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
