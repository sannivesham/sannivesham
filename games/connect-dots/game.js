(function () {
  function getQueryLevel() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("level")) || 1;
    return window.DOTS_LEVELS ? window.DOTS_LEVELS.find(l => l.id === id) : null;
  }

  const level = getQueryLevel();
  if (!level) return;

  document.getElementById("levelTitle").textContent = `లెవెల్ ${level.id}: ${level.titleTelugu}`;
  document.getElementById("levelSubtitle").textContent = level.titleEnglish;

  const leftColumn = document.getElementById("leftColumn");
  const rightColumn = document.getElementById("rightColumn");
  const svgLines = document.getElementById("svgLines");

  let selectedLeft = null;
  let selectedRight = null;
  let isChecking = false;
  let matches = {};
  const totalPairs = level.pairs.length;

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  const shuffledLeft = shuffle(level.pairs);
  const shuffledRight = shuffle(level.pairs);

  shuffledLeft.forEach((p) => {
    const node = document.createElement("div");
    node.className = "dot-node";
    node.textContent = p.left;
    node.addEventListener("click", () => handleLeftSelect(node));
    leftColumn.appendChild(node);
  });

  shuffledRight.forEach((p) => {
    const node = document.createElement("div");
    node.className = "dot-node";
    node.textContent = p.right;
    node.addEventListener("click", () => handleRightSelect(node));
    rightColumn.appendChild(node);
  });

  function handleLeftSelect(node) {
    if (isChecking || node.classList.contains("matched")) return;

    if (selectedLeft === node) {
      // Toggle off if already selected
      node.classList.remove("active");
      selectedLeft = null;
      return;
    }

    leftColumn.querySelectorAll(".dot-node").forEach(el => el.classList.remove("active"));
    node.classList.add("active");
    selectedLeft = node;

    if (selectedRight) {
      checkPair();
    }
  }

  function handleRightSelect(node) {
    if (isChecking || node.classList.contains("matched")) return;

    if (selectedRight === node) {
      // Toggle off if already selected
      node.classList.remove("active");
      selectedRight = null;
      return;
    }

    rightColumn.querySelectorAll(".dot-node").forEach(el => el.classList.remove("active"));
    node.classList.add("active");
    selectedRight = node;

    if (selectedLeft) {
      checkPair();
    }
  }

  function checkPair() {
    if (!selectedLeft || !selectedRight) return;
    const leftText = selectedLeft.textContent.trim();
    const rightText = selectedRight.textContent.trim();

    const isValid = level.pairs.some(p => p.left === leftText && p.right === rightText);
    const leftNode = selectedLeft;
    const rightNode = selectedRight;

    if (isValid) {
      matches[leftText] = rightText;
      leftNode.classList.remove("active");
      rightNode.classList.remove("active");
      leftNode.classList.add("matched");
      rightNode.classList.add("matched");
      drawConnectionLine(leftNode, rightNode);
      selectedLeft = null;
      selectedRight = null;

      if (Object.keys(matches).length === totalPairs) {
        setTimeout(triggerVictory, 400);
      }
    } else {
      isChecking = true;
      leftNode.classList.add("wrong");
      rightNode.classList.add("wrong");
      setTimeout(() => {
        leftNode.classList.remove("active", "wrong");
        rightNode.classList.remove("active", "wrong");
        selectedLeft = null;
        selectedRight = null;
        isChecking = false;
      }, 450);
    }
  }

  function drawConnectionLine(leftNode, rightNode) {
    const containerRect = document.getElementById("gameContainer").getBoundingClientRect();
    const r1 = leftNode.getBoundingClientRect();
    const r2 = rightNode.getBoundingClientRect();
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", r1.right - containerRect.left);
    line.setAttribute("y1", (r1.top + r1.height / 2) - containerRect.top);
    line.setAttribute("x2", r2.left - containerRect.left);
    line.setAttribute("y2", (r2.top + r2.height / 2) - containerRect.top);
    svgLines.appendChild(line);
  }

  function triggerVictory() {
    if (window.Progress && typeof window.Progress.recordCompletion === "function") {
      window.Progress.recordCompletion(level.id, 0);
    }
    document.getElementById("winOverlay").classList.remove("hidden");
    const nextBtn = document.getElementById("nextLevelBtn");
    if (nextBtn) {
      const nextLevel = window.DOTS_LEVELS.find(l => l.id === (level.id + 1));
      if (nextLevel) {
        nextBtn.style.display = "inline-flex";
        nextBtn.onclick = () => { window.location.href = `game.html?level=${nextLevel.id}`; };
      } else {
        nextBtn.style.display = "none";
      }
    }
  }

  function redrawAllLines() {
    svgLines.innerHTML = "";
    leftColumn.querySelectorAll(".dot-node.matched").forEach(ln => {
      const targetRight = matches[ln.textContent.trim()];
      const rn = Array.from(rightColumn.querySelectorAll(".dot-node")).find(el => el.textContent.trim() === targetRight);
      if (rn) drawConnectionLine(ln, rn);
    });
  }

  window.addEventListener("resize", redrawAllLines);
  window.addEventListener("orientationchange", () => setTimeout(redrawAllLines, 200));
})();
