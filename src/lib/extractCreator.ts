/**
 * REELDASH — Robust Creator Extraction Utility
 *
 * Prevents sender handle misattribution on shared in-app posts/reels.
 * In Meta's webhooks, when a user shares another creator's post via DM,
 * Meta provides a CDN URL and caption, but NOT the original creator's username.
 *
 * This utility:
 * 1. Checks if the URL is an explicit Instagram profile URL (e.g. instagram.com/{user}/p/...).
 * 2. Scans captions for recognized major brands/studios (Marvel, DC, Netflix, Disney, etc.).
 * 3. Scans for explicit attribution patterns (credit: @handle, via @handle, etc.).
 * 4. Scans for Meta OpenGraph / description attribution formats.
 * 5. Extracts valid @mentions in the caption.
 * 6. Under NO condition returns the sender's own Instagram handle as the creator.
 * 7. Safely falls back to a neutral "Instagram Creator" (handle: "instagram").
 */

export interface ExtractedCreator {
  handle: string;
  name: string;
}

const RESERVED_IG_PATHS = new Set([
  "reel",
  "reels",
  "p",
  "stories",
  "audio",
  "share",
  "explore",
  "direct",
  "accounts",
  "instagram",
  "reeldash",
  "creator",
]);

interface BrandRule {
  pattern: RegExp;
  handle: string;
  name: string;
}

const KNOWN_BRANDS: BrandRule[] = [
  // Marvel Studios
  {
    pattern: /\b(marvel|marvelstudios|avengers|mcu|iron man|captain america|thor|spider-man|spiderman|black widow|hawkeye|hulk|black panther|wakanda|guardians of the galaxy|thanos|loki|doctor strange|scarlet witch|deadpool|wolverine|doomsday|secret wars)\b/i,
    handle: "marvel",
    name: "Marvel Studios",
  },
  // DC Studios
  {
    pattern: /\b(dc studios|dc comics|batman|superman|wonder woman|joker|harley quinn|gotham|justice league|snyder cut|peacemaker)\b/i,
    handle: "dcstudios",
    name: "DC Studios",
  },
  // Star Wars
  {
    pattern: /\b(star wars|starwars|lucasfilm|mandalorian|grogu|darth vader|luke skywalker|jedi|sith|lightsaber|ahsoka|obi-wan|andor)\b/i,
    handle: "starwars",
    name: "Star Wars",
  },
  // Pixar
  {
    pattern: /\b(pixar|disney pixar|toy story|inside out|finding nemo|the incredibles|monsters inc)\b/i,
    handle: "pixar",
    name: "Pixar",
  },
  // Disney
  {
    pattern: /\b(walt disney|disney animation|disney\+|disneyplus|disneystudios)\b/i,
    handle: "disney",
    name: "Disney",
  },
  // Netflix
  {
    pattern: /\b(netflix|stranger things|squid game|bridgerton|money heist|the witcher)\b/i,
    handle: "netflix",
    name: "Netflix",
  },
  // HBO / Max
  {
    pattern: /\b(hbo|streamonmax|max original|game of thrones|house of the dragon|succession|euphoria|the last of us|white lotus)\b/i,
    handle: "streamonmax",
    name: "Max",
  },
  // Apple TV
  {
    pattern: /\b(apple tv\+|apple tv|apple original|ted lasso|severance|the morning show|slow horses)\b/i,
    handle: "appletv",
    name: "Apple TV",
  },
  // Prime Video
  {
    pattern: /\b(prime video|amazon prime|the boys|rings of power|invincible|reacher|fallout)\b/i,
    handle: "primevideo",
    name: "Prime Video",
  },
  // Warner Bros
  {
    pattern: /\b(warner bros|warner brothers|wb pictures|warnerbros)\b/i,
    handle: "warnerbrosentertainment",
    name: "Warner Bros.",
  },
  // Paramount
  {
    pattern: /\b(paramount\+|paramount plus|paramount pictures|yellowstone|top gun)\b/i,
    handle: "paramountplus",
    name: "Paramount+",
  },
  // Sony Pictures
  {
    pattern: /\b(sony pictures|columbia pictures|sonypictures)\b/i,
    handle: "sonypictures",
    name: "Sony Pictures",
  },
  // A24
  {
    pattern: /\b(a24|a24films|everything everywhere all at once|midsommar|hereditary)\b/i,
    handle: "a24",
    name: "A24",
  },
  // National Geographic
  {
    pattern: /\b(national geographic|nat geo|natgeo|nat geowild)\b/i,
    handle: "natgeo",
    name: "National Geographic",
  },
  // Red Bull
  {
    pattern: /\b(red bull|redbull|red bull racing)\b/i,
    handle: "redbull",
    name: "Red Bull",
  },
  // Formula 1
  {
    pattern: /\b(formula 1|formula one|\bf1\b|scuderia ferrari|mercedes-amg petronas|red bull racing|verstappen|hamilton|leclerc|norris)\b/i,
    handle: "f1",
    name: "Formula 1",
  },
  // Premier League
  {
    pattern: /\b(premier league|\bepl\b|manchester united|manchester city|arsenal fc|chelsea fc|liverpool fc)\b/i,
    handle: "premierleague",
    name: "Premier League",
  },
  // Champions League
  {
    pattern: /\b(champions league|\bucl\b|uefa champions league)\b/i,
    handle: "championsleague",
    name: "UEFA Champions League",
  },
  // NBA
  {
    pattern: /\b(\bnba\b|lakers|warriors|celtics|lebron|curry|giannis)\b/i,
    handle: "nba",
    name: "NBA",
  },
  // UFC
  {
    pattern: /\b(\bufc\b|dana white|mcgregor|khabib|adesanya|pereira)\b/i,
    handle: "ufc",
    name: "UFC",
  },
  // WWE
  {
    pattern: /\b(\bwwe\b|wrestlemania|smackdown|\braw\b|roman reigns|cody rhodes|john cena)\b/i,
    handle: "wwe",
    name: "WWE",
  },
  // NASA
  {
    pattern: /\b(\bnasa\b|james webb|artemis|hubble|mars rover|spacex)\b/i,
    handle: "nasa",
    name: "NASA",
  },
  // Spotify
  {
    pattern: /\b(spotify|spotify wrapped)\b/i,
    handle: "spotify",
    name: "Spotify",
  },
  // IGN
  {
    pattern: /\b(\bign\b|ign entertainment)\b/i,
    handle: "ign",
    name: "IGN",
  },
  // PlayStation
  {
    pattern: /\b(playstation|\bps5\b|\bps4\b|sony interactive entertainment)\b/i,
    handle: "playstation",
    name: "PlayStation",
  },
  // Xbox
  {
    pattern: /\b(\bxbox\b|xbox game pass|microsoft gaming)\b/i,
    handle: "xbox",
    name: "Xbox",
  },
  // Nintendo
  {
    pattern: /\b(nintendo|nintendo switch|super mario|zelda|pokemon)\b/i,
    handle: "nintendo",
    name: "Nintendo",
  },
  // BBC
  {
    pattern: /\b(bbc news|bbc earth|bbc sport|doctor who)\b/i,
    handle: "bbc",
    name: "BBC",
  },
];

/**
 * Clean and normalize handle string
 */
function cleanHandle(raw: string): string {
  return raw.replace(/^@+/, "").trim().toLowerCase();
}

/**
 * Main creator extraction logic
 */
export function extractCreatorFromPost(
  caption: string = "",
  mediaUrl: string = "",
  attachments: any[] = [],
  senderUsername?: string
): ExtractedCreator {
  const cleanSender = senderUsername ? cleanHandle(senderUsername) : "";

  // 1. Check if the URL is an explicit Instagram profile post/reel URL:
  // e.g. https://www.instagram.com/marvel/reel/C2... or https://instagram.com/natgeo/p/D...
  if (mediaUrl) {
    const userMatch = mediaUrl.match(/instagram\.com\/([A-Za-z0-9_.]+)\/(?:reel|reels|p|stories)\//i);
    if (userMatch && userMatch[1]) {
      const handle = cleanHandle(userMatch[1]);
      if (!RESERVED_IG_PATHS.has(handle) && (!cleanSender || handle !== cleanSender)) {
        return {
          handle,
          name: `@${userMatch[1].replace(/^@/, "").trim()}`,
        };
      }
    }
  }

  // Combine caption and attachment titles for text analysis
  const attTitle =
    attachments?.find((a) => a?.payload?.title || a?.title)?.payload?.title ||
    attachments?.find((a) => a?.title)?.title ||
    "";
  const fullText = `${caption} ${attTitle}`.trim();

  if (fullText) {
    // 2. Check known brands/studios
    for (const brand of KNOWN_BRANDS) {
      if (brand.pattern.test(fullText)) {
        return { handle: brand.handle, name: brand.name };
      }
    }

    // 3. Explicit attribution patterns:
    // "via @creator", "credit: @creator", "by: @creator", "c/o @creator", "repost: @creator"
    const attrMatch = fullText.match(
      /(?:credit|cr|via|by|source|c\/o|from|follow|repost|original\s+post\s+by)\s*[:：-]?\s*@([A-Za-z0-9_.]+)/i
    );
    if (attrMatch && attrMatch[1]) {
      const handle = cleanHandle(attrMatch[1]);
      if (!RESERVED_IG_PATHS.has(handle) && (!cleanSender || handle !== cleanSender)) {
        return { handle, name: `@${handle}` };
      }
    }

    // 4. Meta quote / OpenGraph style header patterns:
    // e.g. "marvel on Instagram: '...'" or "12,345 likes, 100 comments - marvel on October 12"
    const metaMatch =
      fullText.match(/(?:likes,\s+[0-9.,KMkm]+\s+comments\s*-\s*|\s+-\s*|^)([A-Za-z0-9_.]+)\s+on\s+[A-Za-z]+\s+\d{1,2}/i) ||
      fullText.match(/^([A-Za-z0-9_.]+)\s+on\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/i) ||
      fullText.match(/\(@([A-Za-z0-9_.]+)\)/i) ||
      fullText.match(/(?:Photo|Video|Reel)\s+by\s+@?([A-Za-z0-9_.]+)/i);

    if (metaMatch && metaMatch[1]) {
      const handle = cleanHandle(metaMatch[1]);
      if (!RESERVED_IG_PATHS.has(handle) && (!cleanSender || handle !== cleanSender)) {
        return { handle, name: `@${handle}` };
      }
    }

    // 5. First mention @handle in caption (if any, excluding sender and common system names)
    const mentions = fullText.matchAll(/@([A-Za-z0-9_.]+)/g);
    for (const m of mentions) {
      const cand = cleanHandle(m[1]);
      if (
        cand &&
        !RESERVED_IG_PATHS.has(cand) &&
        (!cleanSender || cand !== cleanSender) &&
        cand.length >= 2
      ) {
        return { handle: cand, name: `@${cand}` };
      }
    }
  }

  // 6. Neutral fallback — NEVER attribute to the sender's own handle!
  return {
    handle: "instagram",
    name: "Instagram Creator",
  };
}
