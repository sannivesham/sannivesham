/**
 * Sannivesham AI — Canvas Background Animation
 * Golden sacred characters and floating spiritual particles
 */

export function initMedhaCanvas(canvasId = "medhaCanvas") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

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
