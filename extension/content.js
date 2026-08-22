// ReelDash Chrome Extension - Content Script
(function () {
  console.log("[ReelDash Companion] Active on Instagram");

  // Helper to extract active Reel details from the current Instagram DOM
  function extractCurrentReel() {
    const url = window.location.href;
    const match = url.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (!match) return null;

    const shortcode = match[1];

    // Find active video tag
    const videos = Array.from(document.querySelectorAll("video"));
    let activeVideo = null;
    for (const v of videos) {
      if (v.src && v.src.startsWith("http") && !v.src.startsWith("blob:")) {
        activeVideo = v;
        break;
      }
    }

    const videoUrl = activeVideo ? activeVideo.src : "";

    // Extract creator username
    let creatorUsername = "";
    const creatorElem =
      document.querySelector("header a") ||
      document.querySelector("a[role='link'][tabindex='0']") ||
      document.querySelector("a[href^='/']");
    if (creatorElem) {
      const href = creatorElem.getAttribute("href") || "";
      const handle = href.replace(/\//g, "");
      if (handle && handle !== "explore" && handle !== "reels" && handle !== "direct") {
        creatorUsername = handle;
      }
    }

    // Extract caption text
    let caption = "";
    const captionElem =
      document.querySelector("h1") ||
      document.querySelector("article span") ||
      document.querySelector("div[class*='caption']");
    if (captionElem) {
      caption = captionElem.innerText || "";
    }

    // Extract likes count
    let likes = "";
    const likesElem = document.querySelector("section span[class*='like']");
    if (likesElem) {
      likes = likesElem.innerText;
    }

    return {
      id: `reel-${shortcode}`,
      instagramUrl: `https://www.instagram.com/reel/${shortcode}/`,
      shortcode,
      creatorUsername: creatorUsername || `creator_${shortcode.substring(0, 6)}`,
      creatorFullName: creatorUsername || "Instagram Creator",
      caption: caption || `Saved Instagram Reel (${shortcode})`,
      likes: likes || "1.2k likes",
      commentsCount: "42 comments",
      duration: "0:30",
      mediaUrl: videoUrl,
      thumbnailUrl: `https://reeldash-nine.vercel.app/api/proxy-image?shortcode=${shortcode}`,
      category: "Saved",
      tags: ["instagram", "saved"],
      savedAt: new Date().toISOString(),
      isFavorite: false,
    };
  }

  // Inject Floating ReelDash Save Button
  function injectSaveButton() {
    if (document.getElementById("reeldash-floating-btn")) return;
    if (!window.location.href.includes("/reel/") && !window.location.href.includes("/p/")) return;

    const btn = document.createElement("div");
    btn.id = "reeldash-floating-btn";
    btn.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #ffffff;
        padding: 10px 18px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 8px 10px -6px rgba(99, 102, 241, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        user-select: none;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span id="reeldash-btn-text">Save to ReelDash</span>
      </div>
    `;

    btn.addEventListener("click", async () => {
      const textElem = document.getElementById("reeldash-btn-text");
      if (textElem) textElem.innerText = "Saving...";

      const reelData = extractCurrentReel();
      if (!reelData) {
        if (textElem) textElem.innerText = "Open a Reel first";
        setTimeout(() => {
          if (textElem) textElem.innerText = "Save to ReelDash";
        }, 2000);
        return;
      }

      // Save to chrome storage
      chrome.storage.local.get(["savedReels"], (result) => {
        const list = result.savedReels || [];
        const existingIdx = list.findIndex((r) => r.shortcode === reelData.shortcode);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...reelData };
        } else {
          list.unshift(reelData);
        }
        chrome.storage.local.set({ savedReels: list }, () => {
          if (textElem) textElem.innerText = "✓ Saved to ReelDash!";
          setTimeout(() => {
            if (textElem) textElem.innerText = "Save to ReelDash";
          }, 2500);
        });
      });
    });

    document.body.appendChild(btn);
  }

  // Observe URL changes (Instagram is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(injectSaveButton, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

  setTimeout(injectSaveButton, 1500);
})();
