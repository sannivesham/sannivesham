(function () {
  const params = new URLSearchParams(window.location.search);
  const levelId = Number(params.get("level")) || 1;
  const level = typeof window.getLevel === "function" ? window.getLevel(levelId) : null;

  if (!level) {
    document.body.innerHTML = "<p style='padding:40px;color:#EDE3C8;'>Chapter not found.</p>";
    return;
  }

  const { title, difficulty, gridSize, image } = level;

  let tiles = [];
  let moveCount = 0;
  let solved = false;

  document.getElementById("puzzleTitle").textContent = `చాప్టర్ ${level.id}: ${title}`;
  document.getElementById("puzzleSubtitle").textContent = `కఠినత్వం: ${difficulty} · గడులు: ${gridSize}×${gridSize}`;
  document.getElementById("referenceImg").src = image;

  const boardEl = document.getElementById("slidingBoard");
  const moveCountEl = document.getElementById("moveCount");

  function getInversionCount(arr) {
    let invCount = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] !== gridSize * gridSize - 1 && arr[j] !== gridSize * gridSize - 1 && arr[i] > arr[j]) {
          invCount++;
        }
      }
    }
    return invCount;
  }

  function isSolvable(shuffleArr) {
    const inversions = getInversionCount(shuffleArr);

    if (gridSize % 2 !== 0) {
      return inversions % 2 === 0;
    } else {
      let emptyIdx = shuffleArr.indexOf(gridSize * gridSize - 1);
      let emptyRowFromBottom = gridSize - Math.floor(emptyIdx / gridSize);

      if (emptyRowFromBottom % 2 === 0) {
        return inversions % 2 !== 0;
      } else {
        return inversions % 2 === 0;
      }
    }
  }

  function initPuzzle() {
    const totalTiles = gridSize * gridSize;
    tiles = [];
    for (let i = 0; i < totalTiles; i++) {
      tiles.push(i);
    }

    do {
      for (let i = tiles.length - 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
    } while (!isSolvable(tiles) || checkWinState());
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    boardEl.innerHTML = "";

    tiles.forEach((tileValue, currentIndex) => {
      const tileEl = document.createElement("div");

      if (tileValue === gridSize * gridSize - 1) {
        tileEl.className = "tile empty";
      } else {
        tileEl.className = "tile";
        tileEl.style.backgroundImage = `url(${image})`;
        tileEl.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;

        const originR = Math.floor(tileValue / gridSize);
        const originC = tileValue % gridSize;
        const posX = (originC / (gridSize - 1)) * 100;
        const posY = (originR / (gridSize - 1)) * 100;
        tileEl.style.backgroundPosition = `${posX}% ${posY}%`;

        const numHint = document.createElement("span");
        numHint.className = "tile-number";
        numHint.textContent = tileValue + 1;
        tileEl.appendChild(numHint);

        tileEl.addEventListener("click", () => handleTileClick(currentIndex));
      }

      boardEl.appendChild(tileEl);
    });
  }

  function handleTileClick(clickedIndex) {
    if (solved) return;

    const emptyIndex = tiles.indexOf(gridSize * gridSize - 1);

    const clickR = Math.floor(clickedIndex / gridSize);
    const clickC = clickedIndex % gridSize;
    const emptyR = Math.floor(emptyIndex / gridSize);
    const emptyC = emptyIndex % gridSize;

    const isAdjacent = (Math.abs(clickR - emptyR) + Math.abs(clickC - emptyC)) === 1;

    if (isAdjacent) {
      [tiles[clickedIndex], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[clickedIndex]];

      moveCount++;
      if (moveCountEl) moveCountEl.textContent = moveCount;

      renderBoard();
      verifyGameOutcome();
    }
  }

  function checkWinState() {
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] !== i) return false;
    }
    return true;
  }

  function verifyGameOutcome() {
    if (checkWinState()) {
      solved = true;
      if (window.Progress && typeof window.Progress.recordCompletion === "function") {
        window.Progress.recordCompletion(level.id, moveCount);
      }

      const elements = boardEl.querySelectorAll(".tile");
      elements.forEach(el => {
        el.style.border = "none";
        const label = el.querySelector(".tile-number");
        if (label) label.remove();
      });

      document.getElementById("finalMoves").textContent = `మొత్తం మూవ్స్: ${moveCount}`;
      document.getElementById("winOverlay").classList.remove("hidden");

      const nextLevel = typeof window.getNextLevel === "function" ? window.getNextLevel(level.id) : null;
      const nextBtn = document.getElementById("nextLevelBtn");
      if (nextLevel) {
        nextBtn.style.display = "inline-block";
        nextBtn.onclick = () => {
          window.location.href = `puzzle.html?level=${nextLevel.id}`;
        };
      } else {
        nextBtn.style.display = "none";
      }
    }
  }

  // Wait for progress.js (a deferred module) to finish resolving auth state
  // and the Firestore fetch before trusting isUnlocked(). Without this,
  // game.js — a plain synchronous script — was checking window.Progress
  // before it existed, falling back to a stub that treats every level
  // except 1 as locked and redirects the player straight back to
  // index.html, even for levels they've legitimately unlocked.
  function waitForProgress(timeoutMs = 4000) {
    if (!window.ProgressReady || typeof window.ProgressReady.then !== "function") {
      return Promise.resolve();
    }
    return Promise.race([
      window.ProgressReady,
      new Promise((resolve) => setTimeout(resolve, timeoutMs))
    ]);
  }

  async function boot() {
    await waitForProgress();

    const progressInstance = window.Progress || {
      isUnlocked: (id) => id === 1,
      recordCompletion: () => console.log("Local progress backup placeholder")
    };

    if (typeof progressInstance.isUnlocked === "function" && !progressInstance.isUnlocked(levelId)) {
      window.location.href = "index.html";
      return;
    }

    initPuzzle();
    renderBoard();
  }

  boot();
})();
