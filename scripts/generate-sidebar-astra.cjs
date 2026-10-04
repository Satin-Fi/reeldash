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
  const SIDEBAR_PROMPT = `You are an elite, Awwwards-winning principal UI/UX engineer and design systems architect specializing in high-agency workspaces (Linear, Raycast, Cosmos, Payflow, Apple).
Rebuild the REELDASH SIDEBAR component from scratch (saved at src/components/shell/Sidebar.tsx).

---
### USER FEEDBACK & STRICT MANDATORY REQUIREMENTS:
1. REMOVE THE SCROLL BAR (MANDATORY):
   - Zero visible scrollbars anywhere in the sidebar across all browsers (Chrome, Safari, Firefox, Edge).
   - Use 'no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' on any scrollable container. It must scroll smoothly with pointer wheel without any ugly scrollbar track or thumb.

2. REMOVE CONNECT TO INSTAGRAM BUTTON (MANDATORY):
   - Completely remove the "Connect Instagram" button and banner. Do not render any connect button or placeholder banner in the sidebar.

3. ORIGINAL BESPOKE SVGS ONLY — STRICTLY BAN GENERIC LUCIDE ICONS (MANDATORY):
   - The user explicitly rejected generic stock icons (like default Lucide Home, Film, Image, Music, Layers, Heart).
   - You MUST write ORIGINAL, ART-DIRECTED, HAND-CRAFTED BESPOKE INLINE SVGs for every navigation item:
     * NavDashboardIcon: Bespoke geometric 4-cell bento architecture glyph with delicate 1.4px stroke and rounded micro-vertices.
     * NavReelsIcon: Bespoke vertical 9:16 cinematic frame glyph with dual film perforation markers.
     * NavPostsIcon: Bespoke canvas / media artboard glyph with delicate aspect frame and geometric sun/horizon disc.
     * NavAudioIcon: Bespoke acoustic waveform pulse glyph with stylized alternating sound bars.
     * NavLibraryIcon: Bespoke architectural stack of 3 floating rounded media planes.
     * NavFavoritesIcon: Bespoke geometric faceted heart crest with fine precision contouring.
     * NavPricingIcon: Bespoke minimalist crown / celestial sparkle glyph.
     * NavRecycleBinIcon: Bespoke archive vault / translucent wireframe canister glyph.
     * FolderGlyph: Bespoke minimalist folder tab glyph.
     * SettingsGearGlyph: Bespoke refined 6-tooth micro-machined gear glyph matching Payflow reference.
   - All bespoke SVGs must be 17px or 18px with stroke="currentColor" and strokeWidth="1.5", rendering cleanly in both dark and light modes.

4. PROFILE BUTTON MATCHING THE PAYFLOW REFERENCE IMAGE (STRICT MANDATORY):
   - The user provided the "Payflow" dashboard design reference image.
   - The profile card at the bottom MUST be a single, elegant horizontal row:
     * Left: Circular avatar (size-9 rounded-full ring-1 ring-white/[0.08] overflow-hidden bg-zinc-800 text-xs font-medium text-white flex items-center justify-center) with avatar image or fallback letter.
     * Center: Column with User Name (text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate) and Email/Handle (text-[11px] font-mono text-zinc-500 truncate).
     * Right: A single sleek Settings gear button (size-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors).
     * STRICTLY BANNED: The awkward 2-row layout with Sun, Gear, and Logout buttons dumped underneath.
     * Clicking the profile card navigates to /settings.
     * Clicking the gear button navigates to /settings.

5. ZERO UNNECESSARY DATABASE COUNTS:
   - No counter numbers (no 172, 48, 1, 221, etc.) on the navigation links. Keep the sidebar serene, clean, and distraction-free.

6. REFINED ACTIVE STATE & PROPORTIONS:
   - Width: 256px (w-64 min-w-[256px] max-w-[256px]).
   - Active nav item: Subtle elevated pill (bg-black/[0.05] dark:bg-white/[0.08] text-zinc-950 dark:text-white font-medium) with a delicate vertical pastel lavender (#CBB5FD) accent indicator on the left edge.
   - Inactive: text-zinc-500 dark:text-zinc-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-zinc-800 dark:hover:text-zinc-200.

7. BRAND HEADER:
   - Header with <ReelDashLogo href="/dashboard" size={24} showText={true} textSize="text-[17px]" /> and a subtle Pro pill badge (Crown icon + "Pro") linking to "/pricing".

8. MULTI-ACCOUNT SWITCHER:
   - If user has multiple active Instagram accounts, show a clean dropdown trigger. If only 0 or 1 account, do not render extra buttons.

---
### TECHNICAL SPECIFICATIONS:
- 'use client' at top.
- Full TypeScript React component. Export function Sidebar().
- Imports from '@/context/ReelContext': import { useReels } from '@/context/ReelContext';
- Imports from '@/context/AuthContext': import { useAuth } from '@/context/AuthContext';
- Import { ReelDashLogo } from '@/components/ui/ReelDashLogo';
- Import Link from 'next/link';
- Import usePathname, useSearchParams from 'next/navigation';
- Wrap SidebarContent in <Suspense> inside export function Sidebar().
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
