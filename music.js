const music = document.getElementById("bgMusic");
const btn = document.getElementById("musicBtn");

if (music) {
  let started = false;

  document.addEventListener("click", () => {
    if (!started && music) {
      music.volume = 0.25;
      music.play().catch(() => {});
      started = true;
    }
  }, { once: true });

  if (btn) {
    btn.addEventListener("click", () => {
      if (music.paused) {
        music.play();
        btn.innerHTML = "🔊";
      } else {
        music.pause();
        btn.innerHTML = "🔇";
      }
    });
  }
}