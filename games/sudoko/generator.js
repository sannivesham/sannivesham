// Mythology Sudoku — puzzle generator & solver
// Supports 4x4 (2x2 boxes), 6x6 (2x3 boxes), 9x9 (3x3 boxes)

export const SudokuEngine = (() => {

  function boxDims(size) {
    if (size === 4) return { br: 2, bc: 2 };
    if (size === 6) return { br: 2, bc: 3 };
    if (size === 9) return { br: 3, bc: 3 };
    throw new Error("Unsupported grid size: " + size);
  }

  function emptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function isValidPlacement(grid, size, row, col, val) {
    for (let i = 0; i < size; i++) {
      if (grid[row][i] === val) return false;
      if (grid[i][col] === val) return false;
    }
    const { br, bc } = boxDims(size);
    const boxRow = Math.floor(row / br) * br;
    const boxCol = Math.floor(col / bc) * bc;
    for (let r = boxRow; r < boxRow + br; r++) {
      for (let c = boxCol; c < boxCol + bc; c++) {
        if (grid[r][c] === val) return false;
      }
    }
    return true;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Fill a full valid grid via randomized backtracking
  function fillGrid(size) {
    const grid = emptyGrid(size);

    function findEmpty() {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === 0) return [r, c];
        }
      }
      return null;
    }

    function fill() {
      const spot = findEmpty();
      if (!spot) return true;
      const [r, c] = spot;
      const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1));
      for (const n of nums) {
        if (isValidPlacement(grid, size, r, c, n)) {
          grid[r][c] = n;
          if (fill()) return true;
          grid[r][c] = 0;
        }
      }
      return false;
    }

    fill();
    return grid;
  }

  // Count solutions up to a cap (used to verify uniqueness)
  function countSolutions(grid, size, cap = 2) {
    let count = 0;
    const working = grid.map(row => row.slice());

    function findEmpty() {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (working[r][c] === 0) return [r, c];
        }
      }
      return null;
    }

    function solve() {
      if (count >= cap) return;
      const spot = findEmpty();
      if (!spot) {
        count++;
        return;
      }
      const [r, c] = spot;
      for (let n = 1; n <= size; n++) {
        if (count >= cap) return;
        if (isValidPlacement(working, size, r, c, n)) {
          working[r][c] = n;
          solve();
          working[r][c] = 0;
        }
      }
    }

    solve();
    return count;
  }

  // Remove cells from a full grid while keeping a unique solution
  function makePuzzle(size, cluesToKeep) {
    const solution = fillGrid(size);
    const puzzle = solution.map(row => row.slice());

    const cells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) cells.push([r, c]);
    }
    shuffle(cells);

    let removable = size * size - cluesToKeep;

    for (const [r, c] of cells) {
      if (removable <= 0) break;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;

      const solCount = countSolutions(puzzle, size, 2);
      if (solCount !== 1) {
        puzzle[r][c] = backup; // revert, keep unique-solution guarantee
      } else {
        removable--;
      }
    }

    return { puzzle, solution };
  }

  // Difficulty -> approx clues kept, scaled per grid size
  function cluesForDifficulty(size, difficulty) {
    const total = size * size;
    const ratios = { easy: 0.62, medium: 0.5, hard: 0.4 };
    const ratio = ratios[difficulty] || 0.5;
    return Math.max(size, Math.round(total * ratio));
  }

  function generate(size, difficulty) {
    const clues = cluesForDifficulty(size, difficulty);
    return makePuzzle(size, clues);
  }

  return { generate, isValidPlacement, boxDims };
})();
