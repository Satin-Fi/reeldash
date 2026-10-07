const fs = require("fs");
const path = require("path");

const rawPath = path.resolve(__dirname, "raw-modal-output.txt");
const raw = fs.readFileSync(rawPath, "utf8");

const lines = raw.split("\n");

// Skip leading ```tsx line if present
let startIdx = 0;
if (lines[0].trim().startsWith("```")) {
  startIdx = 1;
}

// Find line where renderComposer starts (around 1338)
let composerLineIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes("function renderComposer(mobile: boolean)")) {
    composerLineIdx = i;
    break;
  }
}

if (composerLineIdx === -1) {
  throw new Error("Could not find renderComposer in raw-modal-output.txt");
}

const baseCode = lines.slice(startIdx, composerLineIdx).join("\n");

const completionCode = `  function renderComposer(mobile: boolean) {
    return (
      <form
        className="flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void postNote();
        }}
      >
        <label
          htmlFor={\`\${componentId}-\${mobile ? "mobile" : "desktop"}-note\`}
          className="sr-only"
        >
          Add a private note or thought
        </label>
        <textarea
          ref={mobile ? mobileComposerRef : desktopComposerRef}
          id={\`\${componentId}-\${mobile ? "mobile" : "desktop"}-note\`}
          rows={1}
          maxLength={10_000}
          value={draft}
          disabled={posting}
          onChange={(event) => {
            setDraft(event.target.value);
            event.currentTarget.style.height = "auto";
            event.currentTarget.style.height = \`\${Math.min(event.currentTarget.scrollHeight, 112)}px\`;
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void postNote();
            }
          }}
          placeholder="Add a note or thought…"
          className="min-h-10 max-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!draft.trim() || posting}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {posting ? <Loader2 size={14} className="animate-spin" /> : "Post"}
        </button>
      </form>
    );
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={\`Reel by \${username}\`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-0 backdrop-blur-md select-none md:p-6"
    >
      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {/* Desktop Backdrop Close */}
      <div
        className="fixed inset-0 bg-transparent"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-black text-white md:h-[88vh] md:max-h-[720px] md:max-w-[960px] md:flex-row md:rounded-2xl md:border md:border-white/[0.08] md:bg-[#0B0C10] md:shadow-[0_24px_70px_rgba(0,0,0,0.85)]">
        {/* LEFT COLUMN: 9:16 Vertical Video Player */}
        <div className="relative flex h-[50vh] w-full shrink-0 items-center justify-center overflow-hidden bg-black md:h-full md:w-[380px] lg:w-[410px] md:border-r md:border-white/[0.08]">
          <ReelPlayer
            key={reelId}
            reel={activeReel}
            autoPlay={true}
            className="h-full w-full rounded-none border-0 bg-black shadow-none"
          />
        </div>

        {/* RIGHT COLUMN: Clean, High-Craft Social & Creator Workspace */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0B0C10] text-zinc-100 min-w-0">
          {/* 1. Header (Clean: Creator left, Menu + Close right. NO up/down chevrons!) */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0C0D13]/95 px-5 py-3.5 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar username={username} src={avatarUrl} />
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  {renderCreatorName()}
                  {instagramUrl && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                      >
                        Follow
                      </a>
                    </>
                  )}
                </div>
                {shortDate && (
                  <span className="text-[11px] text-zinc-500">{shortDate}</span>
                )}
              </div>
            </div>

            {/* Header Controls: Options Menu + Close (✕) */}
            <div className="flex items-center gap-1">
              <div className="relative" ref={menuRef}>
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={ICON_BUTTON}
                  title="Options"
                  aria-label="More options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-white/[0.1] bg-[#181A22] p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void copyLink()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                    >
                      <Copy size={14} className="text-zinc-400" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void downloadVideo()}
                      disabled={downloading || !videoUrl}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-40 cursor-pointer"
                    >
                      <Download size={14} className="text-zinc-400" />
                      {downloading ? "Downloading…" : "Download MP4"}
                    </button>
                    {instagramUrl && (
                      <a
                        role="menuitem"
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                      >
                        <ExternalLink size={14} className="text-zinc-400" />
                        Open on Instagram
                      </a>
                    )}
                    <div className="my-1 h-px bg-white/[0.08]" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void removeReel()}
                      disabled={deleting}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      {deleting ? "Deleting…" : "Delete Reel"}
                    </button>
                  </div>
                )}
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => onCloseRef.current()}
                className={ICON_BUTTON}
                title="Close (Esc)"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4 select-text">
            {/* Clean Creator Caption (Scraper junk stripped!) */}
            <div className="flex gap-3">
              <Avatar username={username} src={avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="text-xs leading-relaxed">
                  {renderCreatorName("mr-2")}
                  <Caption value={caption} />
                </div>
                {shortDate && (
                  <span className="mt-2 block text-[11px] text-zinc-500">
                    {shortDate}
                  </span>
                )}
              </div>
            </div>

            {/* Audio Track Pill */}
            {audioTitle && (
              <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0 mr-2">
                  <Music2 size={14} className="shrink-0 text-emerald-400" />
                  <span className="truncate text-xs text-zinc-300">
                    {audioTitle} {audioArtist ? \`• \${audioArtist}\` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    persistWorkspace({ audioSaved: !workspace.audioSaved });
                    notify(workspace.audioSaved ? "Audio reference removed." : "Audio reference saved.");
                  }}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  {workspace.audioSaved ? "Saved" : "Save audio"}
                </button>
              </div>
            )}

            {/* Interactive Tabs: Notes & Discussion | AI Analysis | Organize */}
            <div className="pt-2">
              {renderTabs("desktop")}
              {renderPanel("desktop")}
            </div>
          </div>

          {/* 3. Bottom Engagement & Composer Dock (Authentic Instagram standard) */}
          <div className="shrink-0 border-t border-white/[0.08] bg-[#0C0D13] p-4 space-y-3">
            {/* Action Icons Row: Heart, Comment, Share, Bookmark */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleLike()}
                  disabled={liking}
                  className="text-zinc-300 hover:text-white transition cursor-pointer"
                  title={liked ? "Unlike" : "Like"}
                  aria-label={liked ? "Unlike reel" : "Like reel"}
                >
                  <Heart
                    size={22}
                    className={liked ? "fill-rose-500 text-rose-500 transition-transform scale-110" : "transition-transform"}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab("notes");
                    desktopComposerRef.current?.focus();
                  }}
                  className="text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Comment / Notes"
                  aria-label="Add comment or note"
                >
                  <MessageCircle size={22} />
                </button>

                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Share link"
                  aria-label="Share reel link"
                >
                  <Send size={20} />
                </button>
              </div>

              <button
                type="button"
                onClick={toggleCollection}
                className="text-zinc-300 hover:text-white transition cursor-pointer"
                title={workspace.collection ? "Saved" : "Save to collection"}
                aria-label="Bookmark reel"
              >
                <Bookmark
                  size={22}
                  className={workspace.collection ? "fill-white text-white" : ""}
                />
              </button>
            </div>

            {/* Likes count */}
            <div className="text-xs font-semibold text-zinc-100">
              {likes > 0 ? \`\${new Intl.NumberFormat("en").format(likes)} likes\` : "Be the first to like this"}
            </div>

            {/* Date */}
            {longDate && (
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                {longDate}
              </div>
            )}

            {/* Inline Composer */}
            <div className="pt-1">
              {renderComposer(false)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#12141C] p-5 shadow-2xl md:hidden"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-sm font-semibold text-white">
              {tab === "notes" ? "Notes & Discussion" : tab === "analysis" ? "AI Analysis" : "Organize"}
            </span>
            <button
              ref={drawerCloseRef}
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          {renderTabs("mobile")}
          {renderPanel("mobile")}
          <div className="pt-4 border-t border-white/[0.08]">
            {renderComposer(true)}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default ReelPlayerModal;
export { ReelPlayerModal };
`;

const finalFileContent = baseCode + "\n" + completionCode;
const destPath = path.resolve(__dirname, "../src/components/reels/ReelPlayerModal.tsx");
fs.writeFileSync(destPath, finalFileContent, "utf8");
console.log(`Successfully assembled ReelPlayerModal to ${destPath} (${finalFileContent.length} chars)`);
