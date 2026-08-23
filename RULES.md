# ReelDash Architectural Rules

## 1. INSTAGRAM EMBEDDED PLAYER & REFERENCE LAYOUT (USER AUTHORIZED)
- When playing a Reel, render the split Instagram layout matching the reference UI:
  - **Left Side**: 9:16 Vertical Video Player (supports authorized Instagram Embed `<iframe src="https://www.instagram.com/reel/[shortcode]/embed/">` or direct HTML5 `<video>` player).
  - **Right Side**: Full Instagram Post/Reel Social Sidebar:
    - Creator Header: Avatar + Username + Blue Verified Badge + `• Follow` button + `•••` menu.
    - Scrollable Post Body: Full caption with highlighted hashtags/mentions, Audio info, and Comments thread.
    - Engagement Bar: Like (Heart) + Comment bubble + Share (Paper plane) + Bookmark + Likes/Comments count + Timestamp.
    - ReelDash Actions: Download MP4, AI Summary, Category picker, Collection picker, and Personal Notes.

## 2. ZERO FAKE / RANDOM VIDEOS
- NEVER play ocean videos, zencdn sample videos, or unrelated reels.

## 3. STRICT 11-PHASE PROGRESS TRACKER
- Maintain the 11-phase progress tracker block in all responses.
