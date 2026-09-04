(function () {
  function getQueryLevel() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("level")) || 1;
    return window.MAZE_LEVELS ? window.MAZE_LEVELS.find(l => l.id === id) : null;
  }

  const level = getQueryLevel();
  if (!level) return;

  document.getElementById("levelTitle").textContent = `లెవెల్ ${level.id}: ${level.titleTelugu}`;
  document.getElementById("levelSubtitle").textContent = level.titleEnglish;

  const canvas = document.getElementById("mazeCanvas");
  const ctx = canvas.getContext("2d");

  const dimension = level.gridDimension;
  let grid = [];
  
  let player = { x: level.startX, y: level.startY };
  const target = { x: level.endX, y: level.endY };
  let isGameOver = false;

  function initMazeGrid() {
    grid = [];
    for (let y = 0; y < dimension; y++) {
      let row = [];
      for (let x = 0; x < dimension; x++) {
        row.push({ x: x, y: y, isWall: true, visited: false });
      }
      grid.push(row);
    }

    let stack = [];
    let current = grid[level.startY][level.startX];
    current.isWall = false;
    current.visited = true;
    
    while (true) {
      let neighbors = getUnvisitedNeighbors(current);
      if (neighbors.length > 0) {
        let next = neighbors[Math.floor(Math.random() * neighbors.length)];
        let midX = current.x + (next.x - current.x) / 2;
        let midY = current.y + (next.y - current.y) / 2;
        grid[midY][midX].isWall = false;
        next.isWall = false;
        next.visited = true;
        stack.push(current);
        current = next;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }
    }
    grid[level.startY][level.startX].isWall = false;
    grid[level.endY][level.endX].isWall = false;
  }

  function getUnvisitedNeighbors(cell) {
    let list = [];
    let directions = [[0, -2], [0, 2], [-2, 0], [2, 0]];
    directions.forEach(([dx, dy]) => {
      let nx = cell.x + dx;
      let ny = cell.y + dy;
      if (nx >= 0 && nx < dimension && ny >= 0 && ny < dimension) {
        if (!grid[ny][nx].visited) list.push(grid[ny][nx]);
      }
    });
    return list;
  }

  function renderMaze() {
    const cellSize = canvas.width / dimension;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        if (grid[y][x].isWall) {
          ctx.fillStyle = "#2c1e14";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = "rgba(18, 12, 8, 0.4)";
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          ctx.fillStyle = "#1e150f";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    ctx.fillStyle = "#C9A24B";
    ctx.font = `${cellSize * 0.6}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🌸", target.x * cellSize + cellSize / 2, target.y * cellSize + cellSize / 2);

    ctx.font = `${cellSize * 0.6}px sans-serif`;
    ctx.fillText("🐒", player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2);
  }

  function movePlayer(dx, dy) {
    if (isGameOver) return;
    let newX = player.x + dx;
    let newY = player.y + dy;

    if (newX >= 0 && newX < dimension && newY >= 0 && newY < dimension) {
      if (!grid[newY][newX].isWall) {
        player.x = newX;
        player.y = newY;
        renderMaze();
        checkTargetMatch();
      }
    }
  }

  function checkTargetMatch() {
    if (player.x === target.x && player.y === target.y) {
      isGameOver = true;
      if (window.Progress && typeof window.Progress.recordCompletion === "function") {
        window.Progress.recordCompletion(level.id, 0);
      }
      document.getElementById("winOverlay").classList.remove("hidden");
    }
  }

  document.getElementById("btnUp").addEventListener("touchstart", (e) => { e.preventDefault(); movePlayer(0, -1); });
  document.getElementById("btnDown").addEventListener("touchstart", (e) => { e.preventDefault(); movePlayer(0, 1); });
  document.getElementById("btnLeft").addEventListener("touchstart", (e) => { e.preventDefault(); movePlayer(-1, 0); });
  document.getElementById("btnRight").addEventListener("touchstart", (e) => { e.preventDefault(); movePlayer(1, 0); });

  document.getElementById("btnUp").addEventListener("click", () => movePlayer(0, -1));
  document.getElementById("btnDown").addEventListener("click", () => movePlayer(0, 1));
  document.getElementById("btnLeft").addEventListener("click", () => movePlayer(-1, 0));
  document.getElementById("btnRight").addEventListener("click", () => movePlayer(1, 0));

  document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "KeyW"].includes(e.key)) { e.preventDefault(); movePlayer(0, -1); }
    if (["ArrowDown", "KeyS"].includes(e.key)) { e.preventDefault(); movePlayer(0, 1); }
    if (["ArrowLeft", "KeyA"].includes(e.key)) { e.preventDefault(); movePlayer(-1, 0); }
    if (["ArrowRight", "KeyD"].includes(e.key)) { e.preventDefault(); movePlayer(1, 0); }
  });

  const nextBtn = document.getElementById("nextLevelBtn");
  if (nextBtn) {
    const nextLevel = window.MAZE_LEVELS.find(l => l.id === (level.id + 1));
    if (nextLevel) {
      nextBtn.onclick = () => { window.location.href = `game.html?level=${nextLevel.id}`; };
    } else {
      nextBtn.style.display = "none";
    }
  }

  initMazeGrid();
  renderMaze();
})();
