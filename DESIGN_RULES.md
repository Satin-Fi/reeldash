# ReelDash Architectural & Design Rules (Strictly Enforced)

This document serves as the permanent source of truth for UI/UX interaction logic and media classification in ReelDash.

---

## 1. Media Type & Carousel Classification
- **Video Reels**:
  - Any video/reel (regardless of URL format `/reel/`, `/reels/`, or `/p/`) is a **Reel/Video**.
  - On hover: Center disk **MUST ALWAYS be a Play button (`<Play className="fill-white" />`)**.
  - Top-Left: Shows `[ ▶ 0:30 ]` only if valid video duration is present. Never shows gallery badges.
- **Carousel (Multi-Image Post)**:
  - **Condition**: Must contain **strictly more than 1 image (`count > 1`)**.
  - Top-Left: Shows `[ 🖼 {count} ]` (e.g., `[ 🖼 6 ]`).
  - **BANNED**: Never render `[ 🖼 1 ]` or `[ 🖼 ]` for single photos or videos.
- **Single Photo / Post**:
  - No top-left badge (clean unobstructed canvas).
- **Audio**:
  - Top-Left: `[ 🎵 ]`.

---

## 2. Card Overlay System
- **Top-Right Controls**:
  - Grouped horizontally in a single row (`[ ♥ Favorite ] [ ⋮ Menu ]`) with identical dimensions (`w-7 h-7`), glassmorphic styling, and smooth hover dynamics.
  - No vertical stacking or arbitrary offsets.
- **Center Action Disk**:
  - Semi-transparent glassmorphic disk (`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20`).
  - Displays the universal **`<Play />`** button to launch the media viewer modal.
- **Bottom Metrics**:
  - Clean `[ 👍 {likes} ]` pill ONLY when real likes data exists from Instagram.
  - Zero mock or generated numbers.
  - No raw `Carousel (6)` or `Photo Post` debug strings.

---

## 3. TopBar & Application Shell
- **Height**: `64px`, sticky, `#0B0D10`, bottom border `rgba(255,255,255,0.06)`.
- **Left**: Bespoke stacked `<Layers />` icon for `Visual Library`.
- **Sidebar**: Uses `<LayoutGrid />` for `All Library` to prevent icon collisions.
- **Center**: Linear / Raycast style command search palette trigger (`⌘K` / `Ctrl+K`).
- **Right**: Theme toggle + User profile avatar.
