// Sannivesham Medha — AI Interactive Canvas & Form Scripts
(function () {
  const canvas = document.getElementById("medhaCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Golden divine sparkles and Sanskrit/Telugu akshara embers
    const particles = [];
    const symbols = ["✧", "✦", "•", "✨", "అ", "ఆ", "శ్రీ", "ఓం"];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.2,
        size: Math.random() * 14 + 10,
        char: symbols[Math.floor(Math.random() * symbols.length)],
        alpha: Math.random() * 0.6 + 0.2,
        alphaSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaSpeed;

        if (p.alpha > 0.85 || p.alpha < 0.15) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.font = `${p.size}px 'Noto Serif Telugu', serif`;
        ctx.fillStyle = `rgba(255, 209, 102, ${p.alpha})`;
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 8;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  // Handle Interest notification form
  const form = document.getElementById("notifyForm");
  const msgBox = document.getElementById("notifyMessage");
  if (form && msgBox) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("notifyEmail");
      const email = emailInput ? emailInput.value.trim() : "";

      if (email) {
        // Store in localStorage for waitlist
        try {
          const list = JSON.parse(localStorage.getItem("medha_waitlist") || "[]");
          if (!list.includes(email)) {
            list.push(email);
            localStorage.setItem("medha_waitlist", JSON.stringify(list));
          }
        } catch (err) {
          console.warn(err);
        }

        msgBox.className = "notify-msg success";
        msgBox.innerHTML = "✨ ధన్యవాదాలు! సన్నివేశం మేధ లైవ్‌లోకి రాగానే మీకు ప్రత్యేక ఆహ్వానం అందుతుంది.";
        msgBox.style.display = "block";
        form.reset();

        setTimeout(() => {
          msgBox.style.display = "none";
        }, 6000);
      }
    });
  }
})();
