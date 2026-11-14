/**
 * Sannivesham Common Game Level Select Module
 * 
 * Generates responsive cultural game level grids with lock/unlock states
 * and progress completion indicators.
 */
export function initLevelSelect(config = {}) {
  const {
    levels = [],
    containerId = "levelGrid",
    getUrl = (lvl) => `game.html?level=${lvl.id}`,
    getMeta = (lvl) => lvl.meta || "",
    getImage = (lvl) => lvl.image || null
  } = config;

  function renderGrid() {
    const gridEl = document.getElementById(containerId);
    if (!gridEl || !Array.isArray(levels) || levels.length === 0) return;
    gridEl.innerHTML = "";

    levels.forEach((level) => {
      const isUnlocked = typeof window.Progress?.isUnlocked === "function"
        ? window.Progress.isUnlocked(level.id)
        : (Number(level.id) === 1);

      const progress = typeof window.Progress?.getLevelProgress === "function"
        ? window.Progress.getLevelProgress(level.id)
        : { completed: false };

      const card = document.createElement(isUnlocked ? "a" : "div");
      card.className = `level-card ${isUnlocked ? "" : "locked"}`;
      if (isUnlocked) card.href = getUrl(level);

      const img = getImage(level);
      let imgHtml = "";
      if (img) {
        imgHtml = `<div class="level-thumbnail" style="height: 120px; overflow: hidden; border-radius: 8px; margin-bottom: 12px; background: rgba(0,0,0,0.2);">
          <img src="${img}" alt="${level.titleTelugu || 'స్థాయి'}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
        </div>`;
      }

      const metaText = getMeta(level);
      const metaHtml = metaText ? `<div class="level-meta">${metaText}</div>` : "";

      let innerHTML = `
        ${imgHtml}
        <div class="level-number">LEVEL ${level.id}</div>
        <div class="level-title">${level.titleTelugu || ''}</div>
        ${level.titleEnglish ? `<div class="level-subtitle">(${level.titleEnglish})</div>` : ''}
        ${metaHtml}
      `;

      if (progress.completed) {
        innerHTML += `<div style="position: absolute; bottom: 20px; right: 20px; color: var(--gold, #ffd166); font-weight: bold;">✔ పూర్తయింది</div>`;
      } else if (!isUnlocked) {
        innerHTML += `<div style="position: absolute; bottom: 20px; right: 20px;">🔒</div>`;
      }

      card.innerHTML = innerHTML;
      gridEl.appendChild(card);
    });
  }

  // Initial render
  renderGrid();

  // Re-render when auth/cloud progress is resolved
  window.addEventListener("progress:ready", renderGrid);

  // Fallback poll in case Progress initializes asynchronously
  let polls = 0;
  const timer = setInterval(() => {
    renderGrid();
    polls++;
    if (polls >= 5) clearInterval(timer);
  }, 600);
}

if (typeof window !== "undefined") {
  window.initLevelSelect = initLevelSelect;
}
