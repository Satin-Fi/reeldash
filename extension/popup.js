document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("reels-container");
  const openBtn = document.getElementById("open-reeldash-btn");

  openBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://reeldash-nine.vercel.app" });
  });

  chrome.storage.local.get(["savedReels"], (result) => {
    const list = result.savedReels || [];
    if (list.length === 0) return;

    container.innerHTML = list
      .slice(0, 4)
      .map(
        (r) => `
        <div class="reel-item">
          <img class="reel-thumb" src="${r.thumbnailUrl}" alt="Thumb" onerror="this.style.display='none'" />
          <div class="reel-info">
            <div class="reel-creator">@${r.creatorUsername}</div>
            <div class="reel-caption">${r.caption}</div>
          </div>
        </div>
      `
      )
      .join("");
  });
});
