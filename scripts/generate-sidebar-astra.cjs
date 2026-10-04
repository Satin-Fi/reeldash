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
  const SIDEBAR_PROMPT = `You are an elite, Awwwards-winning principal UI/UX designer and design systems engineer.
Rebuild the REELDASH SIDEBAR component (saved at src/components/shell/Sidebar.tsx) strictly matching the Payflow design references provided by the user.

---
### USER FEEDBACK & STRICT MANDATORY VISUAL SPECS:

1. ACTIVE NAVIGATION BAR FADED TOWARDS THE END (MATCHING IMAGE 2 EXACTLY):
   - Look at Image 2 from Payflow:
     * The active item is a rounded pill (rounded-full h-[46px] px-1.5 flex items-center gap-3).
     * Background MUST BE A HORIZONTAL GRADIENT THAT FADES OUT TOWARDS THE RIGHT END:
       style={{ background: 'linear-gradient(90deg, #44403C 0%, #322E2A 55%, rgba(38, 35, 32, 0) 100%)' }}
       In light mode: linear-gradient(90deg, #E8E5DF 0%, #F0EDE8 55%, rgba(240, 237, 232, 0) 100%).
     * On the left inside the pill: A circular disc (size-[34px] rounded-full bg-[#78716A] text-white flex items-center justify-center shrink-0 shadow-sm).
     * Inside this circle, the icon is FILLED, solid, and slightly bigger/scaled!
     * Text label: text-white font-medium text-[13.5px].
   - Inactive items:
     * Transparent background, rounded-full h-[46px] px-1.5 flex items-center gap-3 transition-colors hover:bg-white/[0.03].
     * Left: Subtle circle (size-[34px] rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/[0.04]).
     * Icon is outline / stroke (fill="none").
     * Text label: text-zinc-400 group-hover:text-zinc-200 text-[13.5px].

2. DYNAMIC FILLED SVGS THAT BECOME SOLID / BIGGER ON ACTIVE:
   - The user explicitly requested: "when i click on any menu like dashboard svgs get bigger or filled looks good just like payflow have".
   - Each icon component MUST accept { active: boolean, className?: string }:
     * NavDashboardIcon: Home glyph. Active: SOLID FILLED house shape (fill="currentColor", matching Image 2). Inactive: clean outlined house.
     * NavReelsIcon: Cinematic reel / play glyph. Active: SOLID FILLED play badge / reel. Inactive: clean outlined frame.
     * NavPostsIcon: Photo / media frame. Active: SOLID FILLED gallery canvas. Inactive: clean outline.
     * NavAudioIcon: Soundwave / note. Active: SOLID FILLED waveform pulse. Inactive: clean outline.
     * NavLibraryIcon: Stacked layers. Active: SOLID FILLED overlapping cards. Inactive: clean outline.
     * NavFavoritesIcon: Heart. Active: SOLID FILLED heart. Inactive: clean outline.
     * NavPricingIcon: Crown. Active: SOLID FILLED crown. Inactive: clean outline.
     * NavRecycleBinIcon: Archive / trash. Active: SOLID FILLED archive vault. Inactive: clean outline.
     * FolderGlyph: Folder. Active: SOLID FILLED folder. Inactive: clean outline.
   - When active, the icon can have a slight scale effect: className="scale-105 transition-transform" so it feels tactile and alive!

3. PROFILE BUTTON MATCHING PAYFLOW REFERENCE (MATCHING IMAGE 3 EXACTLY):
   - Look at Image 3 from Payflow:
     * Container: rounded-full p-2 bg-[#24211E] border border-white/[0.04] hover:border-white/[0.08] transition-all flex items-center justify-between.
     * Left: Circular avatar (size-10 rounded-full overflow-hidden bg-zinc-800 text-white font-medium flex items-center justify-center shrink-0).
     * Center: User Name (text-[13px] font-medium text-white truncate) and Email/Handle (text-[11px] text-zinc-400 font-mono truncate).
     * Right: The EXACT 6-petal daisy flower gear icon from Image 3:
       <svg viewBox="0 0 24 24" className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
         <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
         <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
       </svg>
     * Links to /settings.
     * NO second row with Sun and Logout buttons! Single row only!

4. ZERO VISIBLE SCROLLBARS:
   - 'no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' and msOverflowStyle: 'none'.

5. NO "CONNECT INSTAGRAM" BUTTON:
   - Completely deleted.

6. PROPER REELDASH ROUTES:
   - Dashboard: /dashboard
   - Reels: /reels?type=reel
   - Posts & Photos: /reels?type=post
   - Songs & Audio: /reels?type=audio
   - All Library: /reels?type=all
   - Favorites: /favorites
   - Collections: /reels?category=... and /categories
   - Pricing: /pricing
   - Recycle Bin: /recycle-bin

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
