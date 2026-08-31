/**
 * Category / Collection Slash Command Parser:
 * Matches "/category <name>", "/cat <name>", "/collection <name>", "/col <name>", "/tag <name>", "/c <name>", "#<hashtag>"
 */
export function parseCategoryCommand(text: string): {
  cleanText: string;
  category: string | null;
} {
  if (!text) return { cleanText: text, category: null };

  let category: string | null = null;
  const clean = text;

  // 1. Extract any full URL first
  const urlMatch = clean.match(/https?:\/\/[^\s]+/i);
  const foundUrl = urlMatch ? urlMatch[0] : null;

  // Temporarily remove the URL to avoid slash conflicts
  const textWithoutUrl = foundUrl ? clean.replace(foundUrl, " ").trim() : clean;

  // 2. Match slash command: /category <name>, /cat <name>, /collection <name>, /col <name>, /tag <name>, /c <name>
  const slashMatch = textWithoutUrl.match(/(?:^|\s)\/(?:category|cat|collection|col|tag|c)\s+([^/\n\r]+)/i);
  if (slashMatch) {
    category = slashMatch[1].trim();
  }

  // 3. Fallback: match hashtag e.g. #Fitness_Motivation
  if (!category) {
    const hashMatch = textWithoutUrl.match(/(?:^|\s)#([A-Za-z0-9_-]+)(?:\s|$)/);
    if (hashMatch) {
      category = hashMatch[1].replace(/_/g, " ").trim();
    }
  }

  if (category) {
    // Strip surrounding quotes or brackets
    category = category.replace(/^["'\[]+|["'\]]+$/g, "").trim();
    if (category.length > 50) {
      category = category.substring(0, 50).trim();
    }
    category = category.replace(/\s+/g, " ");
  }

  // Clean text is the found URL if present, otherwise clean stripped text
  const cleanResult = foundUrl || textWithoutUrl.replace(/(?:^|\s)\/(?:category|cat|collection|col|tag|c)\s+([^/\n\r]+)/i, "").trim();

  return {
    cleanText: cleanResult,
    category: category && category.length > 0 ? category : null,
  };
}
