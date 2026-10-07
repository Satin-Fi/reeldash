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
      max_tokens: 14000,
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
  const MODAL_PROMPT = `You are an elite, Awwwards-winning principal UI/UX designer and software architect for ReelDash.
Your task is to completely rewrite the REEL PLAYER MODAL (src/components/reels/ReelPlayerModal.tsx) into a high-craft, sensible, agency-grade masterpiece.

---
### CRITICAL USER FEEDBACK & PROBLEMS TO FIX:
1. "if this UI made by chatgpt astra then its wrost, its very bad, you are not chatgpt astra properly just wasting its tokens"
   "change this UI, should look good, sensible things should be there"
   - The user shared a screenshot exposing terrible design flaws that you MUST eliminate:
     a) BROKEN CAPTION & OVERFLOW: Long hashtags like "#fypppppppppppppppppppppppppppppppppppppppppppppppppppppppp" were rendering in giant neon font with zero word-break, breaking out of the container.
        Fix: Use text-sm text-zinc-200 leading-relaxed break-words [overflow-wrap:anywhere] break-all select-text. Clean subtle link color for hashtags and mentions (text-sky-400 hover:text-sky-300).
     b) USELESS "TOPICS & KEYWORDS" SHELF: Do NOT render a redundant "TOPICS & KEYWORDS" shelf that repeats the exact hashtags already visible in the caption! Filter out junk/spam tags longer than 25 chars or repetitive letters.
     c) CHEESY FAKE AI LABELS: DO NOT stamp tacky monospaced labels like "ASTRA AI INSIGHTS" across big empty boxed cards!
        Design a sleek, integrated AI summary section that is compact and quiet when empty (a single elegant button: "✨ Generate Key Takeaways"), and expands into crisp, beautiful bullet points when available.
     d) DUPLICATE CONTROLS EVERYWHERE: In the old UI, there was a Category picker at the top AND another Category picker at the bottom. There was a Like count at the top and a Like button at the bottom.
        ELIMINATE ALL DUPLICATION! Every control must have ONE clear, sensible home.
     e) BOXES INSIDE BOXES: The old sidebar was cluttered with harsh borders and nested boxes ("WORKSPACE NOTES", "ASTRA AI INSIGHTS").
        Replace with a cohesive, fluid Linear/Raycast/Apple Notes style layout with restrained border contrast (border-white/[0.07]), layered rich dark surfaces (#090A0E -> #11131A), and breathing room.

---
### ARCHITECTURAL RULES (RULES.md):
1. DUAL-PANE DESKTOP MODAL (>= md screens):
   - Left side: 9:16 Vertical Video Player using <ReelPlayer reel={activeReel} autoPlay={true} className="w-full h-full rounded-none border-0 shadow-none bg-black" />.
   - Right side: ReelDash Social & Management Inspector.
     - Header:
       * Creator Avatar (36px, ring-1 ring-white/10).
       * @creatorUsername (with blue verified badge if verified, links to /creator/[username]).
       * "Follow" link (opens activeReel.instagramUrl in new tab).
       * Up/Down or Prev/Next navigation if multiple reels exist (with keyboard arrow support).
       * Clean "•••" menu: Copy link, Download MP4, Open on Instagram, Delete Reel.
       * Close button (✕).
     - Scrollable Body (custom-scrollbar, select-text, spacious):
       * Full caption (beautifully formatted with clickable #tags, @mentions, URLs, safe word breaking).
       * Timestamp (e.g. "Oct 7, 2026").
       * Soundtrack / Audio Bar (if activeReel.audioTitle exists): Music icon, title, artist, "+ Save Audio" button.
       * Organization Section:
         - Category selector (clean dropdown popover with availableCategories).
         - AI Summary / Key Takeaways: If present, shows refined bullet points / takeaways with a quiet "Regenerate" button. If not generated, a clean, sleek action button "✨ Extract Key Takeaways".
         - Personal Notes: Clean Notion-like inline notepad for jotting hooks, scripts, or remix ideas.
     - Bottom Dock / Action Bar:
       * Favorite toggle (Heart with active filled rose-500 state and likes count).
       * Comments count (if available).
       * Quick Copy Link button.
       * Open on Instagram button.
       * Primary CTA: "Download MP4" button (sleek brand pill button).

2. MOBILE EXPERIENCE (< md screens):
   - 100dvh full-screen native Reels experience with swipe/drag navigation, right-side action rail (Heart, Notes drawer, Category, Instagram link, Next/Prev), bottom creator info, and slide-up drawers for notes/category.

3. ZERO CRASHES & REACT RULES OF HOOKS:
   - ALL React hooks (useState, useRef, useMemo, useEffect) MUST be placed unconditionally at the very top of ReelPlayerModal, BEFORE any "if (!isOpen || !activeReel || !mounted) return null;".
   - Defensively parse captions, tags, and dates with fallback values so undefined/null fields never throw exceptions.

---
### TYPES & CONTEXT:
import { Reel } from "@/types/reel";
import { useReels } from "@/context/ReelContext";
// useReels provides:
// { reels, toggleFavorite, deleteReel, updateNote, generateAiSummary, smartCategories, updateCategory, showToast, saveReel }

export interface ReelPlayerModalProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
}

Output ONLY the complete, production-ready, compilable TypeScript React code inside a single \`\`\`tsx ... \`\`\` code fence. No markdown text outside the code fence.`;

  const raw = await callAstraStream(MODAL_PROMPT, "ReelPlayerModal Component");
  const code = extractTsx(raw);
  const dest = path.resolve(__dirname, "../src/components/reels/ReelPlayerModal.tsx");
  fs.writeFileSync(dest, code, "utf8");
  console.log(`💾 Saved ReelPlayerModal to ${dest} (${code.length} chars)`);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
