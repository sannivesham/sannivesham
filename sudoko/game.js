import { getLevel, getNextLevel } from "./levels.js";
import { SudokuEngine } from "./generator.js";

(function () {
  // Cultural Symbol Mapping Configuration for the board display
  const SYMBOLS = {
    1: { icon: "🕉️", name: "Om" },
    2: { icon: "🔱", name: "Trishul" },
    3: { icon: "🪔", name: "Diya" },
    4: { icon: "🌸", name: "Lotus" },
    5: { icon: "🏹", name: "Bow" },
    6: { icon: "🐚", name: "Shankha" },
    7: { icon: "👑", name: "Crown" },
    8: { icon: "🚩", name: "Flag" },
    9: { icon: "☀️", name: "Sun" }
  };

  function symbolIcon(val) {
    return SYMBOLS[val] ? `<span style="font-size: 1.5rem;">${SYMBOLS[val].icon}</span>` : "";
  }

  const params = new URLSearchParams(window.location.search);
  const levelId = Number(params.get("level")) || 1;
  const level = getLevel(levelId);

  if (!level) {
    document.body.innerHTML = "<p style='padding:40px;color:#EDE3C8;'>Level not found.</p>";
    return;
  }

  const size = level.size;

  // Puzzles are generated on the fly by SudokuEngine, which guarantees a
  // valid grid with a unique solution (the old hardcoded puzzle data for
  // levels 6, 10 and 11 contained corrupted solution grids with duplicate
  // digits in the same row, which made those levels impossible to solve).
  const { puzzle, solution } = SudokuEngine.generate(size, level.difficulty);
  const { br, bc } = SudokuEngine.boxDims(size);

  const playerGrid = puzzle.map(row => row.slice());
  const givenMask = puzzle.map(row => row.map(v => v !== 0));

  let selected = null;
  let mistakes = 0;
  let seconds = 0;
  let timerHandle = null;
  let solved = false;
  let hintsUsed = 0;
  const maxHints = typeof level.maxHints === "number" ? level.maxHints : Infinity;

  document.getElementById("levelTitle").textContent = `లెవెల్ ${level.id}: ${level.titleTelugu}`;
  document.getElementById("levelSubtitle").textContent = `${size}×${size} · ${level.titleEnglish}`;

  const gridEl = document.getElementById("grid");
  const paletteEl = document.getElementById("palette");
  const timerEl = document.getElementById("timer");
  const mistakeEl = document.getElementById("mistakeCount");
  const hintBtn = document.getElementById("hintBtn");

  if (size > 6) {
    gridEl.style.setProperty("font-size", "1.1rem", "important");
  }

  function formatTime(s) {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  }

  function startTimer() {
    timerHandle = setInterval(() => {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function updateHintButton() {
    if (!hintBtn) return;
    if (!isFinite(maxHints)) {
      hintBtn.textContent = "సహాయం (Hint)";
      hintBtn.disabled = false;
      return;
    }
    const remaining = maxHints - hintsUsed;
    hintBtn.textContent = `సహాయం (${remaining} మిగిలి)`;
    hintBtn.disabled = remaining <= 0 || solved;
  }

  function buildGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.innerHTML = "";

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        if (givenMask[r][c]) cell.classList.add("given");
        if ((c + 1) % bc === 0 && c !== size - 1) cell.classList.add("box-edge-right");
        if ((r + 1) % br === 0 && r !== size - 1) cell.classList.add("box-edge-bottom");

        renderCellContent(cell, r, c);
        cell.addEventListener("click", () => selectCell(r, c));
        gridEl.appendChild(cell);
      }
    }
  }

  function renderCellContent(cell, r, c) {
    const val = playerGrid[r][c];
    cell.innerHTML = val ? symbolIcon(val) : "";
  }

  function buildPalette() {
    paletteEl.innerHTML = "";

    const symbolCounts = {};
    for (let n = 1; n <= size; n++) {
      symbolCounts[n] = 0;
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = playerGrid[r][c];
        if (val && symbolCounts[val] !== undefined) {
          symbolCounts[val]++;
        }
      }
    }

    for (let n = 1; n <= size; n++) {
      if (symbolCounts[n] >= size) continue;

      const btn = document.createElement("button");
      btn.className = "palette-btn";
      btn.style.width = size > 6 ? "38px" : "50px";
      btn.style.height = size > 6 ? "38px" : "50px";
      btn.innerHTML = SYMBOLS[n] ? SYMBOLS[n].icon : n;
      btn.addEventListener("click", () => placeValue(n));
      paletteEl.appendChild(btn);
    }

    const erase = document.createElement("button");
    erase.className = "palette-btn erase";
    erase.style.width = size > 6 ? "38px" : "50px";
    erase.style.height = size > 6 ? "38px" : "50px";
    erase.textContent = "✕";
    erase.addEventListener("click", () => placeValue(0));
    paletteEl.appendChild(erase);
  }

  function selectCell(r, c) {
    if (solved) return;
    selected = { r, c };
    refreshHighlights();
  }

  function refreshHighlights() {
    const cells = gridEl.querySelectorAll(".cell");
    cells.forEach(cell => {
      cell.classList.remove("selected", "same-value", "conflict");
    });
    if (!selected) return;
    const { r, c } = selected;
    const val = playerGrid[r][c];

    cells.forEach(cell => {
      const cr = Number(cell.dataset.r), cc = Number(cell.dataset.c);
      if (cr === r && cc === c) cell.classList.add("selected");
      else if (val && playerGrid[cr][cc] === val) cell.classList.add("same-value");
    });
  }

  function placeValue(n) {
    if (!selected || solved) return;
    const { r, c } = selected;
    if (givenMask[r][c]) return;

    playerGrid[r][c] = n;
    const cellEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    renderCellContent(cellEl, r, c);

    if (n !== 0 && n !== solution[r][c]) {
      mistakes++;
      if (mistakeEl) mistakeEl.textContent = mistakes;
      cellEl.classList.add("conflict");
      setTimeout(() => cellEl.classList.remove("conflict"), 500);
    }

    buildPalette();
    refreshHighlights();
    checkWin();
  }

  function checkWin() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (playerGrid[r][c] !== solution[r][c]) return;
      }
    }

    solved = true;
    selected = null;
    clearInterval(timerHandle);
    updateHintButton();

    const cells = gridEl.querySelectorAll(".cell");
    cells.forEach(cell => cell.classList.remove("selected", "same-value"));

    if (window.Progress && typeof window.Progress.recordCompletion === "function") {
      window.Progress.recordCompletion(level.id, seconds);
    }

    document.getElementById("winTime").textContent = `Solved in ${formatTime(seconds)} with ${mistakes} mistakes.`;
    document.getElementById("winOverlay").classList.remove("hidden");

    const nextBtn = document.getElementById("nextLevelBtn");
    const nextLevel = getNextLevel(level.id);
    if (nextLevel) {
      nextBtn.onclick = () => {
        window.location.href = `game.html?level=${nextLevel.id}`;
      };
      nextBtn.style.display = "";
    } else {
      nextBtn.style.display = "none";
    }
  }

  function giveHint() {
    if (solved) return;
    if (hintsUsed >= maxHints) return;

    const candidates = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!givenMask[r][c] && playerGrid[r][c] !== solution[r][c]) {
          candidates.push([r, c]);
        }
      }
    }
    if (candidates.length === 0) return;
    const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
    playerGrid[r][c] = solution[r][c];
    const cellEl = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    renderCellContent(cellEl, r, c);
    selected = { r, c };
    hintsUsed++;
    updateHintButton();
    buildPalette();
    refreshHighlights();
    checkWin();
  }

  function resetPuzzle() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!givenMask[r][c]) playerGrid[r][c] = 0;
      }
    }
    mistakes = 0;
    if (mistakeEl) mistakeEl.textContent = 0;
    selected = null;
    buildGrid();
    buildPalette();
  }

  hintBtn.addEventListener("click", giveHint);
  document.getElementById("resetBtn").addEventListener("click", resetPuzzle);

  document.addEventListener("keydown", (e) => {
    if (!selected || solved) return;
    if (e.key >= "1" && e.key <= String(size)) {
      placeValue(Number(e.key));
    } else if (e.key === "Backspace" || e.key === "Delete") {
      placeValue(0);
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      let { r, c } = selected;
      if (e.key === "ArrowUp") r = Math.max(0, r - 1);
      if (e.key === "ArrowDown") r = Math.min(size - 1, r + 1);
      if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
      if (e.key === "ArrowRight") c = Math.min(size - 1, c + 1);
      selectCell(r, c);
    }
  });

  buildGrid();
  buildPalette();
  updateHintButton();
  startTimer();
})();
