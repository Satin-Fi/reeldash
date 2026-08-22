# ReelDash Strict Architectural Rules

## 1. ABSOLUTE ZERO INSTAGRAM EMBED IFRAME RULE
- **NEVER use `<iframe src="https://www.instagram.com/reel/.../embed">` under any circumstances.**
- The Instagram embed widget is explicitly forbidden in this codebase.
- ReelDash video player must ONLY be a native, styled HTML5 `<video>` element in 9:16 aspect ratio.

## 2. PLAYER STATES (STRICT 4-STATE ARCHITECTURE)
The ReelPlayer component must ONLY render one of these 4 states:
1. **Idle**: High-resolution cover photo + play button + duration badge.
2. **Loading**: Reel cover photo blurred + "Preparing preview..." spinner.
3. **Available**: Native HTML5 `<video src={directCdnUrl} controls playsInline crossOrigin="anonymous">`.
4. **Unavailable**: Reel cover photo + "Preview unavailable" badge + "Open on Instagram ↗" action button.

## 3. ZERO PLACEHOLDER / UNRELATED FALLBACK VIDEOS
- NEVER play ocean videos, zencdn sample videos, or unrelated reels.
- If a Reel's media stream cannot be resolved, show State 4 (Unavailable with Reel thumbnail).

## 4. EXPIRING CDN URLS
- Treat Instagram CDN `.mp4` URLs as temporary session data (15-min cache).
- Never store ephemeral CDN URLs as permanent database links.
- Use the canonical Instagram Reel URL (`https://www.instagram.com/reel/XXXXX/`) as the permanent identifier.
