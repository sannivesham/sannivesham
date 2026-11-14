import { LEVELS, getDifficultyLabel } from "./levels.js";

(function () {
  function renderGrid() {
    const gridEl = document.getElementById("levelGrid");
    if (!gridEl) return;
    gridEl.innerHTML = "";
    LEVELS.forEach((level) => {
      const isUnlocked = typeof window.Progress?.isUnlocked === "function"
        ? window.Progress.isUnlocked(level.id)
        : (level.id === 1);
      const progress = typeof window.Progress?.getLevelProgress === "function"
        ? window.Progress.getLevelProgress(level.id)
        : { completed: false, bestTime: null };
      const card = document.createElement(isUnlocked ? "a" : "div");
      card.className = `level-card ${isUnlocked ? "" : "locked"}`;

      if (isUnlocked) {
        card.href = `game.html?level=${level.id}`;
      }
      let innerHTML = `
        <div class="level-number">LEVEL ${level.id}</div>
        <div class="level-title" style="font-weight: 600; font-size: 1.35rem; margin-bottom: 2px;">${level.titleTelugu}</div>
        <div class="level-subtitle" style="font-family: 'Cinzel', serif; font-size: 0.95rem; color: var(--gold); opacity: 0.85; margin-bottom: 12px;">(${level.titleEnglish})</div>
        <div class="level-meta" style="font-size: 0.85rem; opacity: 0.75;">
          <span>గడులు: ${level.size}×${level.size} · ${getDifficultyLabel(level.difficulty)}</span>
      `;
      if (progress.completed && progress.bestTime) {
        const m = String(Math.floor(progress.bestTime / 60)).padStart(2, "0");
        const s = String(progress.bestTime % 60).padStart(2, "0");
        innerHTML += `<span> · ఉత్తమ సమయం: ${m}:${s}</span>`;
      }
      innerHTML += `</div>`;
      if (progress.completed) {
        innerHTML += `<div style="position: absolute; top: 20px; right: 20px; color: var(--gold); font-weight: bold;">✔</div>`;
      } else if (!isUnlocked) {
        innerHTML += `<div class="level-lock-icon" style="position: absolute; top: 20px; right: 20px;">🔒</div>`;
      }
      card.innerHTML = innerHTML;
      gridEl.appendChild(card);
    });
  }

  renderGrid();
  window.addEventListener("progress:ready", renderGrid);

  let renderCount = 0;
  const pollId = setInterval(() => {
    renderGrid();
    renderCount++;
    if (renderCount >= 6) clearInterval(pollId);
  }, 500);
})();
