(function () {
  function renderGrid() {
    const gridEl = document.getElementById("levelGrid");
    if (!gridEl) return;
    const levels = window.LEVELS || [];
    gridEl.innerHTML = "";
    levels.forEach((level) => {
      const isUnlocked = typeof window.Progress?.isUnlocked === "function"
        ? window.Progress.isUnlocked(level.id)
        : (level.id === 1);
      const progress = typeof window.Progress?.getLevelProgress === "function"
        ? window.Progress.getLevelProgress(level.id)
        : { completed: false, bestMoves: null };
      const card = document.createElement(isUnlocked ? "a" : "div");
      card.className = `level-card ${isUnlocked ? "" : "locked"}`;

      if (isUnlocked) {
        card.href = `puzzle.html?level=${level.id}`;
      }
      const gridSizeLabel = `${level.gridSize}×${level.gridSize}`;
      let innerHTML = `
        <div class="level-number">CHAPTER ${level.id}</div>
        <div class="level-title" style="font-weight: 600; font-size: 1.25rem; margin-bottom: 6px; color: #fff;">${level.title.split(' (')[0]}</div>
        <div class="level-subtitle" style="font-family: 'Cinzel', serif; font-size: 0.9rem; color: var(--gold); opacity: 0.85; margin-bottom: 12px;">(${level.title.split(' (')[1] || 'Puzzle'}</div>
        <div class="level-meta" style="font-size: 0.85rem; opacity: 0.75;">
          <span>Grid: ${gridSizeLabel} · ${level.difficulty}</span>
      `;
      if (progress.completed && progress.bestMoves) {
        innerHTML += `<span> · Moves: ${progress.bestMoves}</span>`;
      }
      innerHTML += `</div>`;
      if (!isUnlocked) {
        innerHTML += `<div class="level-lock-icon" style="position: absolute; top: 20px; right: 20px;">🔒</div>`;
      }
      card.innerHTML = innerHTML;
      gridEl.appendChild(card);
    });
  }

  renderGrid();

  // Progress arrives asynchronously (Firebase auth state + Firestore fetch),
  // so we re-render a few times shortly after load to reflect unlock/
  // completion state, then stop polling.
  let renderCount = 0;
  const pollId = setInterval(() => {
    renderGrid();
    renderCount++;
    if (renderCount >= 6) clearInterval(pollId); // ~3s of polling, then stop
  }, 500);
})();
