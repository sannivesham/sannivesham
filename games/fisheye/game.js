(function () {
  function getQueryLevel() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("level")) || 1;
    return window.FISH_LEVELS ? window.FISH_LEVELS.find(l => l.id === id) : null;
  }

  const level = getQueryLevel();
  if (!level) return;

  document.getElementById("levelTitle").textContent = `లెవెల్ ${level.id}: ${level.titleTelugu}`;
  document.getElementById("levelSubtitle").textContent = level.titleEnglish;
  document.getElementById("targetDisplay").textContent = level.targetHits;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let angle = 0;
  let rotationSpeed = level.speed;
  let hits = 0;
  let lives = 3;
  let isGameOver = false;
  let isFocused = false;
  let perfectEyeStreak = 0;

  // Arrow physics parameters
  let arrow = { x: 200, y: 380, active: false, speed: 12, size: 25 };
  let particles = [];
  let alertText = "";
  let alertTimer = 0;

  window.checkFocus = function(correct) {
    if (correct) {
      isFocused = true;
      rotationSpeed = level.speed * 0.5; // Slow down time for the shot
      showAlert("👁️ ఏకాగ్రత మోడ్ ఆన్ అయింది!", "#4CB5C9");
    } else {
      isFocused = false;
      rotationSpeed = level.speed;
      showAlert("❌ గురి తప్పే అవకాశం!", "#ff4d4d");
    }
    document.getElementById("focusOverlay").classList.add("hidden");
    animate();
  };

  function showAlert(txt, color) {
    alertText = txt;
    alertTimer = 60;
  }

  function fireArrow() {
    if (arrow.active || isGameOver) return;
    arrow.x = 200;
    arrow.y = 360;
    arrow.active = true;
  }

  canvas.addEventListener("click", fireArrow);
  canvas.addEventListener("touchstart", (e) => { e.preventDefault(); fireArrow(); });

  function spawnSpark(x, y) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 20
      });
    }
  }

  function handleWin() {
    isGameOver = true;
    let badge = "ఉత్తమ విలుకాడు!";
    if (perfectEyeStreak >= 5) badge = "Excellent Archer! 🏹";
    if (perfectEyeStreak >= 10) badge = "Arjuna Level 🎯";
    
    document.getElementById("comboBadge").textContent = badge;
    if (window.Progress && typeof window.Progress.recordCompletion === "function") {
      window.Progress.recordCompletion(level.id, perfectEyeStreak);
    }
    document.getElementById("winOverlay").classList.remove("hidden");

    const nextBtn = document.getElementById("nextLevelBtn");
    if (nextBtn) {
      const nextLevel = window.FISH_LEVELS.find(l => l.id === (level.id + 1));
      if (nextLevel) {
        nextBtn.onclick = () => { window.location.href = `game.html?level=${nextLevel.id}`; };
      } else {
        nextBtn.style.display = "none";
      }
    }
  }

  function handleLoss() {
    isGameOver = true;
    document.getElementById("gameOverOverlay").classList.remove("hidden");
  }

  function animate() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update wheel rotation physics
    angle += rotationSpeed;
    if (angle > Math.PI * 2) angle -= Math.PI * 2;

    // Draw training ground center anchor wheel
    ctx.save();
    ctx.translate(200, 150);
    ctx.rotate(angle);

    // Draw structural target wheel background
    ctx.strokeStyle = "#C9A24B";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(201, 162, 75, 0.1)";
    ctx.fill();

    // Draw the wooden target fish body layout frame
    ctx.fillStyle = "#A27035";
    ctx.beginPath();
    ctx.ellipse(0, 0, 70, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fish Tail structure
    ctx.beginPath();
    ctx.moveTo(-70, 0); ctx.lineTo(-90, -20); ctx.lineTo(-90, 20);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Render Target Target Element: The Eye (Right Side tip of the body)
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(45, -5, level.eyeSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(45, -5, level.eyeSize * 0.4, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Update dynamic operational Arrow state vectors
    if (arrow.active) {
      // Wind drift vector manipulation logic
      if (level.wind > 0) {
        arrow.x += Math.sin(arrow.y * 0.05) * level.wind * 0.3;
      }
      arrow.y -= arrow.speed;

      // Render Active Arrow
      ctx.fillStyle = "#C9A24B";
      ctx.fillRect(arrow.x - 2, arrow.y, 4, arrow.size);
      // Arrow Tip triangle head
      ctx.beginPath();
      ctx.moveTo(arrow.x, arrow.y - 6); ctx.lineTo(arrow.x - 6, arrow.y); ctx.lineTo(arrow.x + 6, arrow.y);
      ctx.closePath(); ctx.fill();

      // Check collision coordinates zone boundaries
      if (arrow.y <= 230 && arrow.y >= 70 && arrow.x >= 100 && arrow.x <= 300) {
        // Compute exact rotation offset coordinate calculations
        let hitX = arrow.x - 200;
        let hitY = arrow.y - 150;
        
        let rotX = hitX * Math.cos(-angle) - hitY * Math.sin(-angle);
        let rotY = hitX * Math.sin(-angle) + hitY * Math.cos(-angle);

        // Evaluate intersection vectors against eye center position offset rules
        let distToEye = Math.hypot(rotX - 45, rotY - (-5));
        let distToBody = Math.hypot(rotX, rotY);

        if (distToEye <= level.eyeSize + 4) {
          hits++;
          perfectEyeStreak++;
          spawnSpark(arrow.x, arrow.y);
          document.getElementById("hitDisplay").textContent = hits;
          showAlert("🎯 PERFECT SHOT!", "#C9A24B");
          arrow.active = false;
          
          // Reset focus modifier parameters
          if (isFocused) {
            rotationSpeed = level.speed;
            isFocused = false;
          }

          if (hits >= level.targetHits) {
            handleWin();
            return;
          }
        } else if (distToBody <= 75) {
          // Hit fish body instead of target element criteria tracking rules
          lives--;
          perfectEyeStreak = 0;
          document.getElementById("livesDisplay").textContent = lives;
          showAlert("🐟 FISH BODY! (-1 LIFE)", "#ff9f43");
          arrow.active = false;
          if (lives <= 0) { handleLoss(); return; }
        }
      }

      // Reset array state execution limits
      if (arrow.y < 0) {
        lives--;
        perfectEyeStreak = 0;
        document.getElementById("livesDisplay").textContent = lives;
        showAlert("❌ MISS! (-1 LIFE)", "#ff4d4d");
        arrow.active = false;
        if (lives <= 0) { handleLoss(); return; }
      }
    } else {
      // Draw resting bottom arrow inside quiver limits
      ctx.fillStyle = "rgba(201, 162, 75, 0.4)";
      ctx.fillRect(198, 360, 4, arrow.size);
    }

    // Render custom texts notifications alerts on screen overlays
    if (alertTimer > 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(alertText, 200, 320);
      alertTimer--;
    }

    // Process spark particles calculations loop
    particles.forEach((p, idx) => {
      p.x += p.vx; p.y += p.vy; p.life--;
      ctx.fillStyle = `rgba(201, 162, 75, ${p.life / 20})`;
      ctx.fillRect(p.x, p.y, 3, 3);
      if (p.life <= 0) particles.splice(idx, 1);
    });

    requestAnimationFrame(animate);
  }
})();
