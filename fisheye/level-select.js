(function () {
  function renderGrid() {
    const gridEl = document.getElementById("levelGrid");
    if (!gridEl || !window.FISH_LEVELS) return;
    gridEl.innerHTML = "";

    window.FISH_LEVELS.forEach((level) => {
      const isUnlocked = typeof window.Progress?.isUnlocked === "function" 
        ? window.Progress.isUnlocked(level.id) 
        : (level.id === 1);

      const progress = typeof window.Progress?.getLevelProgress === "function"
        ? window.Progress.getLevelProgress(level.id)
        : { completed: false };

      const card = document.createElement(isUnlocked ? "a" : "div");
      card.className = `level-card ${isUnlocked ? "" : "locked"}`;
      if (isUnlocked) card.href = `game.html?level=${level.id}`;

      let innerHTML = `
        <div class="level-number">LEVEL ${level.id} - ${level.mode}</div>
        <div class="level-title">${level.titleTelugu}</div>
        <div class="level-subtitle">(${level.titleEnglish})</div>
        <div class="level-meta">లక్ష్యం: ${level.targetHits} హిట్స్</div>
      `;
      if (progress.completed) {
        innerHTML += `<div style="position: absolute; bottom: 20px; right: 20px; color: var(--gold); font-weight: bold;">✔ పూర్తయింది</div>`;
      } else if (!isUnlocked) {
        innerHTML += `<div style="position: absolute; bottom: 20px; right: 20px;">🔒</div>`;
      }
      card.innerHTML = innerHTML;
      gridEl.appendChild(card);
    });
  }
  renderGrid();
  setInterval(renderGrid, 1000);
})();
