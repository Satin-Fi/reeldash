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
  const SMART_MODAL_PROMPT = `You are an elite, Awwwards-winning principal UI/UX designer and software architect for ReelDash.
Redesign the REEL PLAYER MODAL (src/components/reels/ReelPlayerModal.tsx) to be an ultra-clean, sensible, Instagram-grade masterpiece.

---
### USER FEEDBACK & RED CIRCLE CRITIQUE (EXACT PROBLEMS TO SOLVE):
The user sent a screenshot with 4 items circled in red, stating:
"all useless component, you arev not using chatgpt astra smartly, redesign ui and remove useless component, put something actually usefull"

Look at the 4 items circled in red by the user:
1. CIRCLE 1 (Top right header): The Up/Down chevrons ("^ v").
   -> REMOVE COMPLETELY. It clutters the header. A clean header only needs the creator info on the left, and the "•••" options menu + Close "✕" on the right.
2. CIRCLE 2 (Center body): An awkward empty box with "Extract Key Takeaways" button.
   -> REMOVE THIS USELESS BOX. Instead of an empty card with an orphaned button, make the sidebar ACTUALLY USEFUL: an authentic Instagram post discussion & notes thread, smart AI breakdown tab, and clean organization.
3. CIRCLE 3 (Bottom left): Clunky text "Like", broken link icons, and external link icon.
   -> REMOVE COMPLETELY. Replace with the authentic Instagram-standard action icons: Heart (Like with filled state), MessageCircle (Comment/Note), Send (Share / Copy link), and Bookmark (Save/Collection).
4. CIRCLE 4 (Bottom right): A giant bright cyan "Download MP4" button dominating the bottom corner.
   -> REMOVE THE GIANT CYAN BUTTON. Download MP4 is a utility action that belongs neatly in the "•••" options menu, or as a subtle icon, NOT a garish cyan brick.
5. CAPTION SCRAPER JUNK: In the screenshot, the caption ended with "View all 500 comments".
   -> Clean all scraper artifacts from captions: strip "View all \\d+ comments", "View more comments", and bracketed scraper tags "[..., ...]".

---
### WHAT IS "ACTUALLY USEFUL" — THE REDESIGNED ARCHITECTURE:

A. DUAL-PANE DESKTOP MODAL (>= md screens):
   - Left side: 9:16 Vertical Video Player using <ReelPlayer reel={activeReel} autoPlay={true} className="w-full h-full rounded-none border-0 shadow-none bg-black" />.
   - Right side: Instagram-Standard Social & Creator Workspace Inspector:
     1. Header:
        - Creator Avatar (36px, ring-1 ring-white/10).
        - @creatorUsername (with blue verified badge if verified, links to /creator/[username]).
        - "• Follow" link (opens activeReel.instagramUrl in new tab).
        - Right: "•••" options dropdown (Download MP4, Copy Link, Open in Instagram, Delete Reel) + Close button (✕).
     2. Middle Scrollable Body (clean, spacious, authentic):
        - Creator Post Block:
          * Avatar + @username + Cleaned Caption (all scraper junk stripped, #tags and @mentions as clickable links with safe word-wrap).
          * Soundtrack audio pill (if activeReel.audioTitle exists): Music note + Title • Artist + "Save audio" button.
          * Post date (e.g. "Oct 6, 2026").
        - Interactive Content Tabs (ACTUALLY USEFUL!):
          * Tab 1: "Notes & Discussion" (Default):
            - Shows user's personal notes and insights formatted like an elegant note card.
            - If no notes yet, shows a clean empty state: "No notes yet. Add your thoughts or hooks below."
          * Tab 2: "AI Analysis":
            - Hook Breakdown: What grabs attention in the first 3 seconds.
            - Strategy & Takeaways: Bullet points synthesizing key ideas.
            - Semantic tags & topics.
            - A clean "Analyze Reel" or "Regenerate" action.
          * Tab 3: "Organize":
            - Category selector (clean pill dropdown with available categories).
            - Add to Collection selector.
     3. Bottom Engagement & Composer Dock (Authentic Instagram Standard):
        - Action Icons Row:
          * Heart (Like toggle with filled rose-500 state).
          * MessageCircle (switches to Notes/Discussion tab).
          * Send (Paper plane / Copy link with toast feedback).
          * Bookmark (Save to collection toggle).
        - Likes count: e.g. "12,450 likes" or "1 like".
        - Timestamp: e.g. "OCTOBER 6, 2026".
        - Inline Composer:
          * "Add a note or thought..." text input + "Post" button that instantly saves to reel notes!

B. MOBILE EXPERIENCE (< md screens):
   - Fullscreen 100dvh Reels player with right floating action rail (Heart, Notes drawer, Category, Share, IG), bottom creator info, and slide-up drawers for notes/category.

C. TECHNICAL CONSTRAINTS:
   - Use icons from 'lucide-react': Heart, MessageCircle, Send, Bookmark, MoreHorizontal, X, Music2, Sparkles, Folder, Download, Check, Trash2, ExternalLink, Copy, Tag, etc.
   - ALL React hooks (useState, useRef, useMemo, useEffect) MUST be placed unconditionally at the very top of ReelPlayerModal, before any early return!
   - Export named export { ReelPlayerModal } AND default export default ReelPlayerModal.
   - Defensively parse captions, tags, and dates with fallback values.

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

  const raw = await callAstraStream(SMART_MODAL_PROMPT, "Smart ReelPlayerModal");
  fs.writeFileSync(path.resolve(__dirname, "raw-modal-output.txt"), raw, "utf8");
  const code = extractTsx(raw);
  const dest = path.resolve(__dirname, "../src/components/reels/ReelPlayerModal.tsx");
  fs.writeFileSync(dest, code, "utf8");
  console.log(`💾 Saved ReelPlayerModal to ${dest} (${code.length} chars)`);
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
