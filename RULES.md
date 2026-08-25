# ReelDash Architectural Rules

## 1. INSTAGRAM EMBEDDED PLAYER & REFERENCE LAYOUT (USER AUTHORIZED)
- When playing a Reel, render the split layout. The left side uses the **official Instagram embed** (`<iframe src="https://www.instagram.com/reel/[shortcode]/embed/">`). Show Instagram's native chrome as-is — do not crop or hide their header/controls/attribution.
- The split layout:
  - **Left Side**: Instagram's 9:16 embed player, contained and framed by ReelDash (our card, spacing, CTA badge around it).
  - **Right Side**: ReelDash-owned Social & Management Sidebar:
    - Creator Header: Avatar + Username + Blue Verified Badge + `• Follow` button + `•••` menu.
    - Scrollable Post Body: Full caption with highlighted hashtags/mentions, Audio info, and Comments thread.
    - Engagement Bar: Like (Heart) + Comment bubble + Share (Paper plane) + Bookmark + Likes/Comments count + Timestamp.
    - ReelDash Actions: Download MP4, AI Summary, Category picker, Collection picker, and Personal Notes.

## 2. ZERO FAKE / RANDOM VIDEOS
- NEVER play ocean videos, zencdn sample videos, or unrelated reels. If a stream cannot be resolved, show a clean "Open on Instagram" state instead of another video.

## 3. STRICT 11-PHASE PROGRESS TRACKER
- Maintain the 11-phase progress tracker block in all responses.
