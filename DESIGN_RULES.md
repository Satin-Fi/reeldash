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
- **Top-Left**:
  - Multi-image Carousels (> 1 images): `[ 🖼 {count} ]` (e.g., `[ 🖼 6 ]`).
  - Video Reels with Duration: `[ ▶ 0:30 ]`.
  - Single Photos / Videos without duration: None (clean).
- **Top-Right Controls**:
  - Contextual `[ ⋮ Menu ]` options trigger (appears cleanly on hover).
- **Center Action Disk**:
  - Semi-transparent glassmorphic disk (`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20`).
  - **Video Reels**: `<Play className="fill-white" />` (Play video).
  - **Image Carousels (> 1 images)**: `<Images />` (Browse photo gallery).
  - **Audio Tracks**: `<Music2 />` (Audio waveform/track).
  - **Single Photo Posts**: `<ImageIcon />` (View photo).
- **Bottom-Right Corner**:
  - **Favorite Heart Button**: `w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10` with spring physics tap.
  - **Real Metrics**: `[ 👍 {likes} ]` pill beside the heart button ONLY when real likes data exists from Instagram.

---

## 3. TopBar & Application Shell
- **Height**: `64px`, sticky, `#0B0D10`, bottom border `rgba(255,255,255,0.06)`.
- **Left**: Bespoke stacked `<Layers />` icon for `Visual Library`.
- **Sidebar**: Uses `<LayoutGrid />` for `All Library` to prevent icon collisions.
- **Center**: Linear / Raycast style command search palette trigger (`⌘K` / `Ctrl+K`).
- **Right**: Theme toggle + User profile avatar.
