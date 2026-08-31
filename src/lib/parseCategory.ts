/**
 * REELDASH — Category Slash Command Parser & Registry
 *
 * Syntax: /<category> (e.g. /yoga, /fitness, /travel, /saas, /ai)
 * Multiple categories: /yoga /fitness /mobility
 * Category with note: /yoga morning routine I want to try
 * Reserved system commands: /maps, /music, /summary, /transcript, /recipe
 *
 * CRITICAL RULE: Hashtags (#fitness, #gym) are metadata describing Instagram content,
 * NOT categories. They are never converted into categories by this parser.
 */

export const RESERVED_COMMANDS = new Set([
  "maps",
  "map",
  "music",
  "audio",
  "summary",
  "summarize",
  "transcript",
  "transcribe",
  "recipe",
  "recipes",
  "recipes_skill",
  "help",
  "settings",
  "export",
  "download",
  "search",
  "favorite",
  "fav",
  "status",
  "start",
  "stop",
]);

export function isReservedCommand(cmd: string): boolean {
  return RESERVED_COMMANDS.has(cmd.toLowerCase().trim());
}

const SPECIAL_CASE_ACRONYMS: Record<string, string> = {
  ai: "AI",
  saas: "SaaS",
  ui: "UI",
  ux: "UX",
  seo: "SEO",
  api: "API",
  ios: "iOS",
  vr: "VR",
  ar: "AR",
  ml: "ML",
  llm: "LLM",
  gpt: "GPT",
  diy: "DIY",
  b2b: "B2B",
  b2c: "B2C",
  pr: "PR",
  hr: "HR",
  crm: "CRM",
  nft: "NFT",
  crypto: "Crypto",
  vlog: "Vlog",
  pov: "POV",
  asmr: "ASMR",
};

/**
 * Format clean, human-readable canonical display names:
 * /yoga -> "Yoga"
 * /saas -> "SaaS"
 * /ai -> "AI"
 * /morningroutine -> "Morning Routine"
 * /tech-dev -> "Tech Dev"
 */
export function formatCategoryDisplayName(raw: string): string {
  const trimmed = raw.trim().replace(/^["'\[]+|["'\]]+$/g, "").replace(/\s+/g, " ");
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (SPECIAL_CASE_ACRONYMS[lower]) {
    return SPECIAL_CASE_ACRONYMS[lower];
  }

  // Handle camelCase or compound words like morningroutine -> Morning Routine if obvious
  let separated = trimmed;
  if (/^[a-z]+[A-Z][a-z]+$/.test(trimmed)) {
    separated = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  return separated
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => {
      const wLower = word.toLowerCase();
      if (SPECIAL_CASE_ACRONYMS[wLower]) {
        return SPECIAL_CASE_ACRONYMS[wLower];
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export interface ParsedCategoryResult {
  cleanText: string;
  cleanUrl: string | null;
  categories: string[];
  primaryCategory: string | null;
  note: string | null;
  reservedCommands: string[];
}

/**
 * Parse Category Commands:
 * - Direct shortcut: /yoga, /fitness, /travel, /saas, /ai
 * - Multiple shortcuts: /yoga /fitness
 * - Backward compatibility: /category yoga
 * - Filters out reserved system commands: /maps, /summary, etc.
 * - Extracts post hashtags separately without turning them into categories.
 */
export function parseCategoryCommand(text: string): ParsedCategoryResult & { category: string | null } {
  if (!text) {
    return {
      cleanText: "",
      cleanUrl: null,
      categories: [],
      primaryCategory: null,
      category: null,
      note: null,
      reservedCommands: [],
    };
  }

  // 1. Extract any full URL first
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  const foundUrl = urlMatch ? urlMatch[0] : null;

  // Working text without the URL so slashes in https:// don't get matched
  let workingText = foundUrl ? text.replace(foundUrl, " ").trim() : text.trim();

  const detectedCategories: string[] = [];
  const detectedReserved: string[] = [];

  // 2. Match backward-compatible explicit commands: /category <name>, /cat <name>, /collection <name>, etc.
  const explicitCategoryMatch = workingText.match(/(?:^|\s)\/(?:category|cat|collection|col|tag|c)\s+([^/\n\r]+)/i);
  if (explicitCategoryMatch) {
    const rawCat = explicitCategoryMatch[1].trim();
    if (rawCat) {
      const formatted = formatCategoryDisplayName(rawCat);
      if (formatted && !detectedCategories.some((c) => c.toLowerCase() === formatted.toLowerCase())) {
        detectedCategories.push(formatted);
      }
    }
    workingText = workingText.replace(explicitCategoryMatch[0], " ").trim();
  }

  // 3. Match /<category> slash shortcuts e.g. /yoga, /fitness, /saas, /ai, /travel
  const slashCommandRegex = /(?:^|\s)\/([a-zA-Z0-9_.-]+)/g;
  let match: RegExpExecArray | null;

  while ((match = slashCommandRegex.exec(workingText)) !== null) {
    const rawCmd = match[1].trim();
    if (!rawCmd) continue;

    if (isReservedCommand(rawCmd)) {
      if (!detectedReserved.includes(rawCmd.toLowerCase())) {
        detectedReserved.push(rawCmd.toLowerCase());
      }
    } else {
      const formatted = formatCategoryDisplayName(rawCmd);
      if (formatted && !detectedCategories.some((c) => c.toLowerCase() === formatted.toLowerCase())) {
        detectedCategories.push(formatted);
      }
    }
  }

  // Remove all matched slash commands from workingText
  workingText = workingText.replace(/(?:^|\s)\/[a-zA-Z0-9_.-]+/g, " ").trim();

  // 4. Clean up any remaining text to use as note / cleanText
  workingText = workingText.replace(/\s+/g, " ").trim();
  const note = workingText.length > 0 ? workingText : null;
  const primaryCategory = detectedCategories.length > 0 ? detectedCategories[0] : null;

  return {
    cleanText: foundUrl || workingText,
    cleanUrl: foundUrl,
    categories: detectedCategories,
    primaryCategory,
    category: primaryCategory,
    note,
    reservedCommands: detectedReserved,
  };
}
