const galleryImages = [
  "images/school1.jpg",
  "images/school2.jpg",
  "images/school3.jpg",
  "images/school4.jpg",
  "images/school5.jpg",
  "images/school6.jpg"
];
let currentImageIndex = 0;
let touchStartX = 0;
let touchStartY = 0;
function openImage(index) {
  currentImageIndex = index;
  document.getElementById("popupImage").src = galleryImages[currentImageIndex];
  document.getElementById("imageModal").style.display = "flex";
}
function closeImage() {
  document.getElementById("imageModal").style.display = "none";
}
function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  document.getElementById("popupImage").src = galleryImages[currentImageIndex];
}
function prevImage() {
  currentImageIndex =
    (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  document.getElementById("popupImage").src = galleryImages[currentImageIndex];
}
window.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("imageModal");
  if (!modal) return;
  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  modal.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    if (Math.abs(diffY) > 80 && diffY < 0) {
      closeImage();
    }
    if (Math.abs(diffX) > 60) {
      diffX > 0 ? nextImage() : prevImage();
    }
  });
});

/* ══════════════════════════════════════
   DIVINE GOLDEN PARTICLES (AMBIENT CANVAS)
   ══════════════════════════════════════ */
function initDivineParticles() {
  const canvas = document.getElementById("divineParticleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 25 : 55;
  const particles = [];

  class DivineParticle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.radius = Math.random() * 2.2 + 0.8;
      this.speedY = Math.random() * 0.45 + 0.2;
      this.speedX = (Math.random() - 0.5) * 0.35;
      this.alpha = Math.random() * 0.6 + 0.25;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.isSpark = Math.random() > 0.75;
      this.color = this.isSpark ? "255, 235, 150" : "255, 195, 60";
    }
    update() {
      this.y -= this.speedY;
      this.pulsePhase += this.pulseSpeed;
      this.x += this.speedX + Math.sin(this.pulsePhase) * 0.4;
      if (this.y < -15 || this.x < -20 || this.x > width + 20) {
        this.reset(false);
      }
    }
    draw() {
      const currentAlpha = Math.max(0, this.alpha * (0.65 + 0.35 * Math.sin(this.pulsePhase)));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${currentAlpha})`;
      ctx.shadowBlur = this.isSpark ? 10 : 5;
      ctx.shadowColor = `rgba(${this.color}, 0.8)`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new DivineParticle());
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initDivineParticles);
} else {
  initDivineParticles();
}

