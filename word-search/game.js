(function () {
  function getQueryLevel() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("level")) || 1;
    return window.WORDSEARCH_LEVELS ? window.WORDSEARCH_LEVELS.find(l => l.id === id) : null;
  }

  const level = getQueryLevel();
  if (!level) {
    document.body.innerHTML = "<p style='padding:40px;color:#EDE3C8;'>Level context configuration missing.</p>";
    return;
  }

  const titleEl = document.getElementById("levelTitle");
  const dimEl = document.getElementById("levelSubtitleDimensions");
  const nameEl = document.getElementById("levelSubtitleName");

  if (titleEl) titleEl.textContent = `లెవెల్ ${level.id}: ${level.titleTelugu}`;
  if (dimEl) dimEl.textContent = `${level.gridSize}×${level.gridSize}`;
  if (nameEl) nameEl.textContent = `· ${level.titleEnglish}`;

  const size = level.gridSize;
  const wordList = level.words;
  const displayList = level.displayWords;

  let discoveredWords = [];
  let isSelecting = false;
  let startCell = null;
  let gridMatrix;

  const teluguCharacters = ["అ", "ఆ", "ఇ", "ఈ", "ఉ", "క", "గ", "చ", "జ", "ట", "డ", "త", "ద", "న", "ప", "బ", "మ", "య", "ర", "ల", "వ", "స", "హ", "ము", "డు", "రి", "శ", "లం", "క్ష", "జ్ఞ"];

  // Try to place every word in wordList onto a fresh grid. Returns the
  // filled grid on success, or null if any word couldn't be placed within
  // the per-word attempt budget (caller should retry with a fresh grid).
  function attemptGridGeneration() {
    const matrix = Array(size).fill(null).map(() => Array(size).fill(""));

    for (const wordArr of wordList) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 200) {
        const direction = Math.random() > 0.5 ? "H" : "V";
        const row = Math.floor(Math.random() * (direction === "V" ? (size - wordArr.length + 1) : size));
        const col = Math.floor(Math.random() * (direction === "H" ? (size - wordArr.length + 1) : size));

        let collision = false;
        for (let i = 0; i < wordArr.length; i++) {
          const r = direction === "V" ? row + i : row;
          const c = direction === "H" ? col + i : col;
          if (matrix[r][c] !== "" && matrix[r][c] !== wordArr[i]) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          for (let i = 0; i < wordArr.length; i++) {
            const r = direction === "V" ? row + i : row;
            const c = direction === "H" ? col + i : col;
            matrix[r][c] = wordArr[i];
          }
          placed = true;
        }
        attempts++;
      }

      if (!placed) {
        // This grid attempt failed — the word couldn't fit. Bail out so the
        // caller can retry with a completely fresh grid rather than leaving
        // a word that can never be found.
        return null;
      }
    }

    return matrix;
  }

  function generateGrid() {
    const MAX_GRID_ATTEMPTS = 30;
    for (let attempt = 0; attempt < MAX_GRID_ATTEMPTS; attempt++) {
      const matrix = attemptGridGeneration();
      if (matrix) return matrix;
    }
    // Extremely unlikely fallback: if every attempt failed (grid too small
    // for the word set), still return the last attempt's best-effort matrix
    // padded with fillers, so the page doesn't crash outright.
    console.error(`Word search level ${level.id}: could not place all words after ${MAX_GRID_ATTEMPTS} attempts.`);
    return Array(size).fill(null).map(() => Array(size).fill(""));
  }

  gridMatrix = generateGrid();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (gridMatrix[r][c] === "") {
        gridMatrix[r][c] = teluguCharacters[Math.floor(Math.random() * teluguCharacters.length)];
      }
    }
  }

  const container = document.getElementById("gridContainer") || document.getElementById("grid");
  if (container) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    container.style.setProperty("--cols", size);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement("div");
        cell.className = "word-cell";
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.textContent = gridMatrix[r][c];
        container.appendChild(cell);
      }
    }
  }

  function getCellFromCoords(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element && element.classList.contains("word-cell")) {
      return {
        r: Number(element.dataset.row),
        c: Number(element.dataset.col)
      };
    }
    return null;
  }

  function startSelection(r, c) {
    isSelecting = true;
    startCell = { r, c };
    updateHighlights(r, c);
  }

  function moveSelection(r, c) {
    if (!isSelecting) return;
    updateHighlights(r, c);
  }

  function endSelection() {
    if (!isSelecting || !container) return;
    isSelecting = false;

    const selectedCells = container.querySelectorAll(".word-cell.selecting");
    let builtWordString = "";
    selectedCells.forEach(el => builtWordString += el.textContent);

    let foundWord = null;
    displayList.forEach(w => {
      if (discoveredWords.includes(w)) return;
      const cleanTarget = w.replace(/\s+/g, "");

      if (builtWordString === cleanTarget) {
        foundWord = w;
      } else {
        const revBuilt = builtWordString.split("").reverse().join("");
        if (revBuilt === cleanTarget) {
          foundWord = w;
        }
      }
    });

    if (foundWord) {
      discoveredWords.push(foundWord);
      selectedCells.forEach(el => {
        el.classList.remove("selecting");
        el.classList.add("discovered");
      });
      const bankItem = document.getElementById(`word-${foundWord}`);
      if (bankItem) bankItem.classList.add("found");
      checkVictory();
    } else {
      selectedCells.forEach(el => el.classList.remove("selecting"));
    }
  }

  function updateHighlights(currentR, currentC) {
    if (!container) return;
    const cells = container.querySelectorAll(".word-cell");
    cells.forEach(el => el.classList.remove("selecting"));

    if (startCell.r === currentR || startCell.c === currentC) {
      const minR = Math.min(startCell.r, currentR);
      const maxR = Math.max(startCell.r, currentR);
      const minC = Math.min(startCell.c, currentC);
      const maxC = Math.max(startCell.c, currentC);

      cells.forEach(el => {
        const r = Number(el.dataset.row);
        const c = Number(el.dataset.col);
        if (r >= minR && r <= maxR && c >= minC && c <= maxC) {
          el.classList.add("selecting");
        }
      });
    }
  }

  // Mouse event listeners for desktop
  if (container) {
    container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const cell = getCellFromCoords(e.clientX, e.clientY);
      if (cell) startSelection(cell.r, cell.c);
    });

    container.addEventListener("mousemove", (e) => {
      e.preventDefault();
      const cell = getCellFromCoords(e.clientX, e.clientY);
      if (cell) moveSelection(cell.r, cell.c);
    });

    // Mobile touch event listeners with forced preventDefault to enable dragging
    container.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const cell = getCellFromCoords(e.touches[0].clientX, e.touches[0].clientY);
        if (cell) startSelection(cell.r, cell.c);
      }
    }, { passive: false });

    container.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const cell = getCellFromCoords(e.touches[0].clientX, e.touches[0].clientY);
        if (cell) moveSelection(cell.r, cell.c);
      }
    }, { passive: false });
  }

  document.addEventListener("mouseup", endSelection);
  document.addEventListener("touchend", endSelection);

  const wordBank = document.getElementById("wordBank");
  if (wordBank) {
    wordBank.innerHTML = "";
    displayList.forEach(w => {
      const item = document.createElement("div");
      item.className = "word-bank-item";
      item.id = `word-${w}`;
      item.textContent = w;
      wordBank.appendChild(item);
    });
  }

  function checkVictory() {
    if (discoveredWords.length === displayList.length) {
      if (window.Progress && typeof window.Progress.recordCompletion === "function") {
        window.Progress.recordCompletion(level.id, 0);
      }
      const overlay = document.getElementById("winOverlay");
      if (overlay) overlay.classList.remove("hidden");

      const nextBtn = document.getElementById("nextLevelBtn");
      if (nextBtn) {
        const nextLevel = window.WORDSEARCH_LEVELS ? window.WORDSEARCH_LEVELS.find(l => l.id === (level.id + 1)) : null;
        if (nextLevel) {
          nextBtn.onclick = () => {
            window.location.href = `game.html?level=${nextLevel.id}`;
          };
        } else {
          nextBtn.style.display = "none";
        }
      }
    }
  }
})();
