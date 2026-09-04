(function () {
  function difficultyFromGridSize(gridSize) {
    if (gridSize <= 8) return "Easy";
    if (gridSize <= 10) return "Medium";
    return "Hard";
  }

  function renderGrid() {
    const gridEl = document.getElementById("levelGrid") || document.getElementById("grid");
    if (!gridEl) return;

    const levels = window.WORDSEARCH_LEVELS || [];
    gridEl.innerHTML = "";

    levels.forEach((level) => {
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

      const difficulty = difficultyFromGridSize(level.gridSize);
      const wordsPreview = level.displayWords.join(", ");

      let innerHTML = `
        <div class="level-number">LEVEL ${level.id}</div>
        <div class="level-title" style="font-weight: 600; font-size: 1.35rem; margin-bottom: 2px;">${level.titleTelugu}</div>
        <div class="level-subtitle" style="font-family: 'Cinzel', serif; font-size: 0.95rem; color: var(--gold); opacity: 0.85; margin-bottom: 12px;">(${level.titleEnglish})</div>
        <div class="level-meta" style="font-size: 0.85rem; opacity: 0.75;">
          <span>Grid: ${level.gridSize}×${level.gridSize} · ${difficulty}</span>
      `;

      if (progress.completed && progress.bestTime) {
        innerHTML += `<span> · Best: ${progress.bestTime}</span>`;
      }

      innerHTML += `</div>`;
      innerHTML += `<div class="level-words-preview">${wordsPreview}</div>`;

      if (!isUnlocked) {
        innerHTML += `<div class="level-lock-icon" style="position: absolute; top: 20px; right: 20px;">🔒</div>`;
      }

      card.innerHTML = innerHTML;
      gridEl.appendChild(card);
    });
  }

  renderGrid();

  // Progress arrives asynchronously (Firebase auth state + Firestore fetch),
  // so we re-render a few times shortly after load, then stop polling.
  let renderCount = 0;
  const pollId = setInterval(() => {
    renderGrid();
    renderCount++;
    if (renderCount >= 6) clearInterval(pollId);
  }, 500);
})();
